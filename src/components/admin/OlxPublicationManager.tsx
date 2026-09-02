"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { stableOlxExternalId, validateOlxProperty, type OlxProfile, type OlxProperty } from "@/lib/olx/vrsync";
import "./admin.css";

type Publication = {
  property_id: string;
  channel_id: string;
  status: "pending" | "published" | "failed" | "disabled";
  external_id: string | null;
  last_error: string | null;
};

type Channel = { id: string; code: string; name: string; enabled: boolean };

export function OlxPublicationManager() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [properties, setProperties] = useState<OlxProperty[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [profile, setProfile] = useState<OlxProfile | null>(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthorized(false); setLoading(false); return; }
    const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (!admin) { setAuthorized(false); setLoading(false); return; }

    setAuthorized(true);
    const [channelResult, propertiesResult, profileResult] = await Promise.all([
      supabase.from("publication_channels").select("id,code,name,enabled").eq("code", "olx").maybeSingle(),
      supabase.from("properties").select("id,slug,title,description,status,price,condo_fee,iptu,transaction_type,property_type,bedrooms,bathrooms,suites,parking_spaces,area_m2,lot_area_m2,address_line1,address_number,postal_code,latitude,longitude,region:regions(city,state,neighborhood),media:property_media(media_type,storage_path,position)").order("created_at", { ascending: false }),
      supabase.from("consultant_profiles").select("display_name,email,phone,whatsapp").limit(1).maybeSingle(),
    ]);

    const olx = channelResult.data as Channel | null;
    setChannel(olx);
    setProperties((propertiesResult.data ?? []) as unknown as OlxProperty[]);
    setProfile((profileResult.data ?? null) as OlxProfile | null);

    if (olx) {
      const { data } = await supabase.from("property_publications").select("property_id,channel_id,status,external_id,last_error").eq("channel_id", olx.id);
      setPublications((data ?? []) as Publication[]);
    } else {
      setPublications([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function setOlx(property: OlxProperty, enabled: boolean) {
    if (!supabase || !channel) return;
    setBusyId(property.id);
    setMessage("");

    try {
      if (!enabled) {
        const { error } = await supabase.from("property_publications").upsert({
          property_id: property.id,
          channel_id: channel.id,
          external_id: stableOlxExternalId(property.id),
          status: "disabled",
          last_error: null,
          last_synced_at: null,
        }, { onConflict: "property_id,channel_id" });
        if (error) throw error;
        await supabase.from("feed_logs").insert({ channel_id: channel.id, property_id: property.id, event_type: "property_disabled", status: "info", message: "Imóvel removido da seleção OLX." });
        setMessage("Imóvel removido da OLX.");
      } else {
        const errors = validateOlxProperty(property, profile);
        const { error } = await supabase.from("property_publications").upsert({
          property_id: property.id,
          channel_id: channel.id,
          external_id: stableOlxExternalId(property.id),
          status: errors.length ? "failed" : "pending",
          last_error: errors.length ? errors.join(" ") : null,
          last_synced_at: null,
        }, { onConflict: "property_id,channel_id" });
        if (error) throw error;

        await supabase.from("feed_logs").insert({
          channel_id: channel.id,
          property_id: property.id,
          event_type: errors.length ? "validation_error" : "property_enabled",
          status: errors.length ? "error" : "success",
          message: errors.length ? errors.join(" ") : "Imóvel habilitado para o feed OLX.",
        });

        setMessage(errors.length
          ? "OLX não habilitada para este imóvel: corrija os campos indicados abaixo."
          : channel.enabled
            ? "Imóvel habilitado para o feed OLX."
            : "Imóvel preparado para OLX. O canal global continua desativado.");
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Não foi possível atualizar OLX: ${error.message}` : "Não foi possível atualizar OLX.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !authorized) return null;

  const byProperty = new Map(publications.map((item) => [item.property_id, item]));

  return <section className="admin-shell" style={{ paddingTop: 0 }}><div className="admin-wrap">
    <div className="admin-card">
      <div className="admin-section-head"><div><div className="eyebrow">Integração imobiliária</div><h2>Publicação OLX</h2></div><span className={`admin-status ${channel?.enabled ? "published" : "draft"}`}>{channel?.enabled ? "Canal ativo" : "Canal global desativado"}</span></div>
      <p className="admin-muted">Selecione quais imóveis devem participar do feed VRSync. Esta área não ativa o canal OLX global automaticamente.</p>
      <p className="admin-muted">Feed: <code>/api/feed/olx</code></p>
      {message && <div className="admin-message">{message}</div>}
    </div>

    <div className="admin-list" style={{ marginTop: 18 }}>
      {properties.map((property) => {
        const publication = byProperty.get(property.id);
        const selected = Boolean(publication && publication.status !== "disabled");
        const errors = selected ? validateOlxProperty(property, profile) : [];
        return <article key={property.id} className="admin-property">
          <div>
            <div className="admin-property-title">{property.title || "Imóvel sem título"}</div>
            <div className="admin-property-meta">{property.status} · {property.property_type || "tipo não informado"} · {property.region?.city || "sem cidade"}</div>
            {publication?.last_error && <p style={{ marginTop: 8 }}><strong>Erro OLX:</strong> {publication.last_error}</p>}
            {!publication?.last_error && errors.length > 0 && <p style={{ marginTop: 8 }}><strong>Pendências OLX:</strong> {errors.join(" ")}</p>}
            {publication?.external_id && <div className="admin-property-meta">ID OLX: {publication.external_id}</div>}
          </div>
          <div className="admin-actions">
            <label className="admin-check"><input type="checkbox" checked={selected} disabled={!channel || busyId === property.id} onChange={(event) => void setOlx(property, event.target.checked)} /> Publicar na OLX</label>
            {publication && <span className={`admin-status ${publication.status === "failed" ? "archived" : publication.status === "disabled" ? "draft" : "published"}`}>{publication.status}</span>}
          </div>
        </article>;
      })}
      {properties.length === 0 && <div className="admin-empty">Nenhum imóvel cadastrado.</div>}
    </div>
  </div></section>;
}
