"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, MapPin, Upload } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import "./admin.css";

type Region = {
  id: string;
  city: string;
  state: string;
  neighborhood: string | null;
  cover_image_path: string | null;
};

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxFileSize = 10 * 1024 * 1024;

export function RegionCoverManager() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    if (!supabase) {
      setMessage("Não foi possível carregar as regiões agora.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("regions")
      .select("id,city,state,neighborhood,cover_image_path")
      .order("city")
      .order("neighborhood", { nullsFirst: true });

    if (error) setMessage("Não foi possível carregar as regiões. Tente novamente.");
    else setRegions((data ?? []) as Region[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadRegions();
  }, [loadRegions]);

  async function uploadCover(region: Region, file: File | null) {
    if (!supabase || !file) return;
    if (!acceptedTypes.has(file.type)) {
      setMessage("Escolha uma imagem em JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > maxFileSize) {
      setMessage("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setUploading(region.id);
    setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${region.id}/cover-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("region-media").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      setMessage("Não foi possível enviar a imagem. Tente novamente.");
      setUploading(null);
      return;
    }

    const { data: updatedRegion, error: updateError } = await supabase
      .from("regions")
      .update({ cover_image_path: path })
      .eq("id", region.id)
      .select("id")
      .single();

    if (updateError || !updatedRegion) {
      await supabase.storage.from("region-media").remove([path]);
      setMessage("A imagem foi enviada, mas não foi possível salvar a nova capa.");
      setUploading(null);
      return;
    }

    setRegions((current) => current.map((item) => item.id === region.id ? { ...item, cover_image_path: path } : item));
    setMessage(`Capa de ${region.city} atualizada com sucesso.`);
    setUploading(null);

    if (region.cover_image_path) {
      await supabase.storage.from("region-media").remove([region.cover_image_path]);
    }
  }

  if (loading) return <div className="admin-empty" role="status">Carregando regiões…</div>;

  return <div className="admin-region-section">
    <div className="admin-region-header">
      <div>
        <div className="eyebrow">Apresentação das localidades</div>
        <h2 className="admin-region-title">Regiões</h2>
        <p className="admin-muted admin-region-intro">Escolha a imagem que apresentará cada região no site.</p>
      </div>
      <div className="admin-region-total"><strong>{regions.length}</strong><span>{regions.length === 1 ? "região" : "regiões"}</span></div>
    </div>

    {message ? <div className="admin-message" role="status">{message}</div> : null}

    <div className="admin-region-grid">
      {regions.map((region) => {
        const coverUrl = region.cover_image_path
          ? supabase?.storage.from("region-media").getPublicUrl(region.cover_image_path).data.publicUrl
          : null;
        const isUploading = uploading === region.id;
        const location = [region.city, region.state].filter(Boolean).join(" · ");

        return <article className="admin-region-card" key={region.id}>
          <div
            className={`admin-region-preview ${coverUrl ? "has-cover" : ""}`}
            style={coverUrl ? { backgroundImage: `linear-gradient(180deg, transparent 48%, rgba(20,18,15,.44)), url(${coverUrl})` } : undefined}
            role="img"
            aria-label={coverUrl ? `Foto de capa de ${location}` : `${location} ainda não possui foto de capa`}
          >
            {coverUrl
              ? <span className="admin-region-cover-badge"><ImageIcon size={14} aria-hidden="true" /> Capa atual</span>
              : <div className="admin-region-placeholder"><ImageIcon size={30} aria-hidden="true" /><span>Sem foto de capa</span></div>}
          </div>
          <div className="admin-region-body">
            <div className="admin-region-location">
              <MapPin size={17} aria-hidden="true" />
              <div><strong>{location}</strong><span>{region.neighborhood || "Toda a cidade"}</span></div>
            </div>
            <label className="admin-button is-primary admin-region-upload">
              <Upload size={15} aria-hidden="true" />
              {isUploading ? "Enviando…" : coverUrl ? "Trocar foto" : "Adicionar foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                aria-label={`${coverUrl ? "Trocar" : "Adicionar"} foto de capa de ${location}`}
                disabled={uploading !== null}
                onChange={(event) => {
                  void uploadCover(region, event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </article>;
      })}
    </div>

    {regions.length === 0 ? <div className="admin-empty">As regiões aparecerão aqui quando forem informadas no cadastro dos imóveis.</div> : null}
  </div>;
}
