import { NextRequest } from "next/server";
import { getPublicServerSupabase } from "@/lib/supabase/public-server";
import { buildVrsyncXml, validateOlxProperty, type OlxProfile, type OlxProperty } from "@/lib/olx/vrsync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getPublicServerSupabase();
  if (!supabase) return new Response("Supabase unavailable", { status: 503 });

  const { data: channel, error: channelError } = await supabase
    .from("publication_channels")
    .select("id,code,name,enabled")
    .eq("code", "olx")
    .maybeSingle();

  if (channelError) return new Response("Could not load OLX channel", { status: 500 });

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

    if (publicationError) return new Response("Could not load OLX publications", { status: 500 });

    const propertyIds = (publications ?? []).map((item) => item.property_id);
    if (propertyIds.length) {
      const { data: properties, error: propertyError } = await supabase
        .from("properties")
        .select("id,slug,title,description,status,price,condo_fee,iptu,transaction_type,property_type,bedrooms,bathrooms,suites,parking_spaces,area_m2,lot_area_m2,address_line1,address_number,postal_code,latitude,longitude,region:regions(city,state,neighborhood),media:property_media(media_type,storage_path,position)")
        .in("id", propertyIds)
        .eq("status", "published");

      if (propertyError) return new Response("Could not load feed properties", { status: 500 });

      const publicationMap = new Map((publications ?? []).map((item) => [item.property_id, item]));
      listings = ((properties ?? []) as unknown as OlxProperty[])
        .filter((property) => validateOlxProperty(property, profile).length === 0)
        .map((property) => ({
          property,
          externalId: publicationMap.get(property.id)?.external_id ?? `olx-${property.id}`,
        }));
    }
  }

  const xml = buildVrsyncXml({
    origin: request.nextUrl.origin,
    profile,
    listings,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
