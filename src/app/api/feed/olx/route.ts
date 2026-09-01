import { NextRequest } from "next/server";
import { getPublicServerSupabase } from "@/lib/supabase/public-server";
import { getServerAdminSupabase } from "@/lib/supabase/server-admin";
import { buildVrsyncXml, validateOlxProperty, type OlxProfile, type OlxProperty } from "@/lib/olx/vrsync";

export const dynamic = "force-dynamic";

async function logFeed(channelId: string | null, status: "success" | "error" | "info", message: string, metadata: Record<string, unknown> = {}) {
  const admin = getServerAdminSupabase();
  if (!admin) return;

  if (status === "success" && channelId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("feed_logs")
      .select("id", { head: true, count: "exact" })
      .eq("channel_id", channelId)
      .eq("event_type", "feed_generated")
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) > 0) return;
  }

  await admin.from("feed_logs").insert({
    channel_id: channelId,
    event_type: status === "success" ? "feed_generated" : "feed_generation_error",
    status,
    message,
    metadata,
  });
}

export async function GET(request: NextRequest) {
  const supabase = getPublicServerSupabase();
  if (!supabase) return new Response("Supabase unavailable", { status: 503 });

  const { data: channel, error: channelError } = await supabase
    .from("publication_channels")
    .select("id,code,name,enabled")
    .eq("code", "olx")
    .maybeSingle();

  if (channelError) {
    await logFeed(null, "error", "Falha ao carregar o canal OLX.", { error: channelError.message });
    return new Response("Could not load OLX channel", { status: 500 });
  }

  const { data: profileData } = await supabase
    .from("consultant_profiles")
    .select("display_name,email,phone,whatsapp")
    .limit(1)
    .maybeSingle();

  const profile = (profileData ?? { display_name: null, email: null, phone: null, whatsapp: null }) as OlxProfile;
  let listings: Array<{ property: OlxProperty; externalId: string }> = [];

  if (channel?.enabled) {
    const { data: publications, error: publicationError } = await supabase
      .from("property_publications")
      .select("property_id,external_id,status")
      .eq("channel_id", channel.id)
      .in("status", ["pending", "published"]);

    if (publicationError) {
      await logFeed(channel.id, "error", "Falha ao carregar publicações OLX.", { error: publicationError.message });
      return new Response("Could not load OLX publications", { status: 500 });
    }

    const propertyIds = (publications ?? []).map((item) => item.property_id);
    if (propertyIds.length) {
      const { data: properties, error: propertyError } = await supabase
        .from("properties")
        .select("id,slug,title,description,status,price,condo_fee,iptu,transaction_type,property_type,bedrooms,bathrooms,suites,parking_spaces,area_m2,lot_area_m2,address_line1,address_number,postal_code,latitude,longitude,region:regions(city,state,neighborhood),media:property_media(media_type,storage_path,position)")
        .in("id", propertyIds)
        .eq("status", "published");

      if (propertyError) {
        await logFeed(channel.id, "error", "Falha ao carregar imóveis do feed OLX.", { error: propertyError.message });
        return new Response("Could not load feed properties", { status: 500 });
      }

      const publicationMap = new Map((publications ?? []).map((item) => [item.property_id, item]));
      const admin = getServerAdminSupabase();

      for (const property of (properties ?? []) as unknown as OlxProperty[]) {
        const errors = validateOlxProperty(property, profile);
        const publication = publicationMap.get(property.id);

        if (errors.length) {
          if (admin && publication) {
            await admin.from("property_publications").update({ status: "failed", last_error: errors.join(" ") }).eq("property_id", property.id).eq("channel_id", channel.id);
            await admin.from("feed_logs").insert({ channel_id: channel.id, property_id: property.id, event_type: "validation_error", status: "error", message: errors.join(" ") });
          }
          continue;
        }

        listings.push({
          property,
          externalId: publication?.external_id ?? `olx-${property.id}`,
        });
      }
    }
  }

  const xml = buildVrsyncXml({ origin: request.nextUrl.origin, profile, listings });
  await logFeed(channel?.id ?? null, "success", "Feed OLX gerado com sucesso.", { listings: listings.length, channel_enabled: Boolean(channel?.enabled) });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
