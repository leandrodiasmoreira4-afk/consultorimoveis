"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import "./admin.css";

type Region = { id:string; city:string; state:string; neighborhood:string|null; slug:string; cover_image_path:string|null };

export function RegionCoverManager(){
  const supabase=useMemo(()=>getSupabaseClient(),[]);
  const [authorized,setAuthorized]=useState(false);
  const [regions,setRegions]=useState<Region[]>([]);
  const [message,setMessage]=useState("");
  const [uploading,setUploading]=useState<string|null>(null);

  async function load(){
    if(!supabase)return;
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return;
    const {data:admin}=await supabase.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
    if(!admin)return;
    setAuthorized(true);
    const {data}=await supabase.from("regions").select("id,city,state,neighborhood,slug,cover_image_path").order("city");
    setRegions((data??[]) as Region[]);
  }

  useEffect(()=>{void load();},[supabase]);

  async function upload(region:Region,file:File|null){
    if(!supabase||!file)return;
    setUploading(region.id);setMessage("");
    const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";
    const path=`${region.id}/cover-${Date.now()}.${ext}`;
    const {error:uploadError}=await supabase.storage.from("region-media").upload(path,file,{upsert:false});
    if(uploadError){setMessage("Não foi possível enviar a imagem.");setUploading(null);return;}
    const {error}=await supabase.from("regions").update({cover_image_path:path}).eq("id",region.id);
    if(error){setMessage("A imagem foi enviada, mas não foi possível defini-la como capa.");setUploading(null);return;}
    if(region.cover_image_path)await supabase.storage.from("region-media").remove([region.cover_image_path]);
    setMessage(`Capa de ${region.city} atualizada.`);setUploading(null);await load();
  }

  if(!authorized)return null;
  return <section className="admin-region-shell"><div className="admin-wrap"><div className="admin-section-head"><div><div className="eyebrow">Apresentação das localidades</div><h2 className="admin-region-title">Capas das regiões</h2></div></div>{message&&<div className="admin-message">{message}</div>}<div className="admin-region-grid">{regions.map(region=>{const url=region.cover_image_path?supabase?.storage.from("region-media").getPublicUrl(region.cover_image_path).data.publicUrl:null;return <article className="admin-region-card" key={region.id}><div className="admin-region-preview" style={url?{backgroundImage:`url(${url})`}:undefined}>{!url&&<span>Sem foto de capa</span>}</div><div className="admin-region-body"><div><strong>{region.city} · {region.state}</strong>{region.neighborhood&&<div className="admin-muted">{region.neighborhood}</div>}</div><label className="admin-button is-primary admin-region-upload">{uploading===region.id?"Enviando…":url?"Trocar capa":"Adicionar capa"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading===region.id} onChange={e=>void upload(region,e.target.files?.[0]??null)}/></label></div></article>})}{regions.length===0&&<div className="admin-empty">As regiões aparecerão aqui depois que forem cadastradas nos imóveis.</div>}</div></div></section>;
}
