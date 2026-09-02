import { NextRequest } from "next/server";
import { getPublicServerSupabase } from "@/lib/supabase/public-server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const supabase = getPublicServerSupabase();
  if (!supabase) return new Response("Supabase unavailable", { status: 503 });

  const { path } = await context.params;
  const storagePath = path.map(decodeURIComponent).join("/");

  const { data: media, error: mediaError } = await supabase
    .from("property_media")
    .select("property_id,media_type,storage_path")
    .eq("storage_path", storagePath)
    .eq("media_type", "image")
    .maybeSingle();

  if (mediaError || !media) return new Response("Not found", { status: 404 });

  const { data: channel } = await supabase
    .from("publication_channels")
    .select("id")
    .eq("code", "olx")
    .eq("enabled", true)
    .maybeSingle();

  if (!channel) return new Response("Not found", { status: 404 });

  const { data: publication } = await supabase
    .from("property_publications")
    .select("property_id,status")
    .eq("property_id", media.property_id)
    .eq("channel_id", channel.id)
    .in("status", ["pending", "published"])
    .maybeSingle();

  if (!publication) return new Response("Not found", { status: 404 });

  const { data: file, error: downloadError } = await supabase.storage.from("property-media").download(storagePath);
  if (downloadError || !file) return new Response("Not found", { status: 404 });

  return new Response(file, {
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
