import Link from "next/link";
import { getProperties } from "@/data/properties";
import { getSupabaseClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegionSummary = { slug:string; city:string; state:string; count:number; cover_image_path:string|null };

export default async function RegionsPage() {
  const properties = await getProperties();
  const supabase=getSupabaseClient();
  const regionSlugs=Array.from(new Set(properties.map(p=>p.region?.slug).filter(Boolean))) as string[];
  const coverMap=new Map<string,string|null>();
  if(supabase&&regionSlugs.length){
    const {data}=await supabase.from("regions").select("slug,cover_image_path").in("slug",regionSlugs);
    for(const region of data??[])coverMap.set(region.slug,region.cover_image_path);
  }
  const regions=Array.from(properties.reduce((map,property)=>{
    const region=property.region;if(!region)return map;
    const current=map.get(region.slug);
    if(current)current.count+=1;else map.set(region.slug,{slug:region.slug,city:region.city,state:region.state,count:1,cover_image_path:coverMap.get(region.slug)??null});
    return map;
  },new Map<string,RegionSummary>()).values()).sort((a,b)=>a.city.localeCompare(b.city,"pt-BR"));

  return <><section className="page-hero"><div className="container-wide"><div className="eyebrow">Territórios</div><h1>Regiões</h1></div></section><section className="section"><div className="container-wide">{regions.length===0?<div className="manifesto-grid"><div className="eyebrow">Em preparação</div><p className="manifesto-copy" style={{margin:0}}>As regiões aparecerão aqui conforme os imóveis forem publicados.</p></div>:<div className="editorial-grid">{regions.map(region=>{const cover=region.cover_image_path&&supabase?supabase.storage.from("region-media").getPublicUrl(region.cover_image_path).data.publicUrl:null;return <Link key={region.slug} href={`/imoveis?regiao=${encodeURIComponent(region.slug)}`} className="editorial-card region-card"><div className="region-cover" style={cover?{backgroundImage:`linear-gradient(180deg,rgba(20,19,16,.05),rgba(20,19,16,.48)),url(${cover})`}:undefined}><span className="eyebrow">{region.state}</span></div><div className="card-meta"><div><div className="card-title">{region.city}</div><div className="card-small">{region.count} {region.count===1?"imóvel disponível":"imóveis disponíveis"}</div></div><div className="card-small">Ver seleção ↗</div></div></Link>})}</div>}</div></section></>;
}
