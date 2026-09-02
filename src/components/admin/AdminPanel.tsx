"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import "./admin.css";

type Media = { id: string; media_type: "image" | "video"; storage_path: string; position: number };
type Region = { id: string; city: string; state: string; neighborhood: string | null; slug: string };
type Property = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: "draft" | "published" | "archived";
  price: number | null;
  property_type: string | null;
  transaction_type: "sale" | "rent" | null;
  featured: boolean;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spaces: number | null;
  created_at: string;
  region: Region | null;
  media: Media[];
};
type Lead = { id:string; name:string|null; email:string|null; phone:string|null; message:string|null; source:string|null; status:string; created_at:string };
type Channel = { id:string; code:string; name:string; enabled:boolean };
type Tab = "dashboard"|"properties"|"leads"|"channels"|"profile";

type Draft = {
  title: string;
  transaction_type: "sale" | "rent";
  property_type: string;
  price: string;
  city: string;
  state: string;
  neighborhood: string;
  description: string;
  area_m2: string;
  bedrooms: string;
  bathrooms: string;
  suites: string;
  parking_spaces: string;
  featured: boolean;
};

const emptyDraft: Draft = {
  title: "",
  transaction_type: "sale",
  property_type: "",
  price: "",
  city: "",
  state: "",
  neighborhood: "",
  description: "",
  area_m2: "",
  bedrooms: "",
  bathrooms: "",
  suites: "",
  parking_spaces: "",
  featured: false,
};

const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
const statusLabel = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" } as const;

const brazilianStates = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function parseMoney(value: string): number | null {
  const clean = value.replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function numeric(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminPanel(){
  const supabase = useMemo(()=>getSupabaseClient(),[]);
  const [loading,setLoading]=useState(true);
  const [authorized,setAuthorized]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [tab,setTab]=useState<Tab>("dashboard");
  const [properties,setProperties]=useState<Property[]>([]);
  const [leads,setLeads]=useState<Lead[]>([]);
  const [channels,setChannels]=useState<Channel[]>([]);
  const [profile,setProfile]=useState({id:"",display_name:"",whatsapp:"",phone:"",email:"",creci:""});
  const [draft,setDraft]=useState<Draft>(emptyDraft);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [files,setFiles]=useState<File[]>([]);
  const [saving,setSaving]=useState(false);
  const [uploadingProperty,setUploadingProperty]=useState<string|null>(null);

  const load = useCallback(async()=>{
    if(!supabase){setMessage("Serviço temporariamente indisponível. Tente novamente em instantes.");setLoading(false);return;}
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){setAuthorized(false);setLoading(false);return;}
    const {data:admin}=await supabase.from("admin_users").select("user_id,role").eq("user_id",session.user.id).maybeSingle();
    if(!admin){setAuthorized(false);setMessage("Esta conta não possui acesso administrativo.");setLoading(false);return;}
    setAuthorized(true);
    const [p,l,c,pr]=await Promise.all([
      supabase.from("properties").select("id,slug,title,description,status,price,property_type,transaction_type,featured,area_m2,bedrooms,bathrooms,suites,parking_spaces,created_at,region:regions(id,city,state,neighborhood,slug),media:property_media(id,media_type,storage_path,position)").order("created_at",{ascending:false}),
      supabase.from("leads").select("id,name,email,phone,message,source,status,created_at").order("created_at",{ascending:false}),
      supabase.from("publication_channels").select("id,code,name,enabled").order("name"),
      supabase.from("consultant_profiles").select("id,display_name,whatsapp,phone,email,creci").limit(1).maybeSingle(),
    ]);
    setProperties((p.data??[]) as unknown as Property[]);
    setLeads((l.data??[]) as Lead[]);
    setChannels((c.data??[]) as Channel[]);
    if(pr.data) setProfile({id:pr.data.id,display_name:pr.data.display_name??"",whatsapp:pr.data.whatsapp??"",phone:pr.data.phone??"",email:pr.data.email??"",creci:pr.data.creci??""});
    setLoading(false);
  },[supabase]);

  useEffect(()=>{void load();},[load]);

  async function login(e:FormEvent){e.preventDefault();if(!supabase)return;setMessage("");setLoading(true);const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMessage("Não foi possível entrar. Confira e-mail e senha.");setLoading(false);return;}await load();}
  async function logout(){if(!supabase)return;await supabase.auth.signOut();setAuthorized(false);setProperties([]);setLeads([]);}

  async function getOrCreateRegion(): Promise<string|null> {
    if(!supabase)return null;
    const city=draft.city.trim();
    const state=draft.state.trim().toUpperCase().slice(0,2);
    const neighborhood=draft.neighborhood.trim();
    if(!city||!state)return null;
    const slug=slugify([city,state,neighborhood].filter(Boolean).join("-"));
    const {data:existing}=await supabase.from("regions").select("id").eq("slug",slug).maybeSingle();
    if(existing?.id)return existing.id;
    const {data,error}=await supabase.from("regions").insert({city,state,neighborhood:neighborhood||null,slug}).select("id").single();
    if(error)throw error;
    return data.id;
  }

  async function uploadFiles(propertyId:string, selected:File[]) {
    if(!supabase||selected.length===0)return;
    const {count}=await supabase.from("property_media").select("id",{count:"exact",head:true}).eq("property_id",propertyId);
    let position=count??0;
    for(const file of selected){
      const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
      const path=`${propertyId}/${crypto.randomUUID()}-${safe}`;
      const {error:uploadError}=await supabase.storage.from("property-media").upload(path,file,{upsert:false});
      if(uploadError)throw uploadError;
      const {error:rowError}=await supabase.from("property_media").insert({property_id:propertyId,storage_path:path,media_type:file.type.startsWith("video/")?"video":"image",position});
      if(rowError)throw rowError;
      position+=1;
    }
  }

  async function saveProperty(e:FormEvent){
    e.preventDefault();if(!supabase)return;
    if(!draft.title.trim()||!draft.property_type.trim()){setMessage("Informe pelo menos o título e o tipo do imóvel.");return;}
    setSaving(true);setMessage("");
    try{
      const region_id=await getOrCreateRegion();
      const values={title:draft.title.trim(),description:draft.description.trim()||null,transaction_type:draft.transaction_type,property_type:draft.property_type.trim(),price:parseMoney(draft.price),region_id,area_m2:numeric(draft.area_m2),bedrooms:numeric(draft.bedrooms),bathrooms:numeric(draft.bathrooms),suites:numeric(draft.suites),parking_spaces:numeric(draft.parking_spaces),featured:draft.featured};
      let propertyId=editingId;
      if(editingId){const {error}=await supabase.from("properties").update(values).eq("id",editingId);if(error)throw error;}
      else{const slugBase=slugify(draft.title)||"imovel";const slug=`${slugBase}-${Date.now().toString().slice(-6)}`;const {data,error}=await supabase.from("properties").insert({...values,slug,status:"draft"}).select("id").single();if(error)throw error;propertyId=data.id;}
      if(propertyId&&files.length)await uploadFiles(propertyId,files);
      const wasEditing=Boolean(editingId);
      setDraft(emptyDraft);setEditingId(null);setFiles([]);setMessage(wasEditing?"Imóvel atualizado com sucesso.":"Imóvel criado como rascunho.");await load();
    }catch(error){setMessage(error instanceof Error?`Não foi possível salvar: ${error.message}`:"Não foi possível salvar o imóvel.");}
    finally{setSaving(false);}
  }

  function editProperty(property:Property){
    setEditingId(property.id);
    setDraft({title:property.title??"",transaction_type:property.transaction_type??"sale",property_type:property.property_type??"",price:property.price!=null?money.format(Number(property.price)):"",city:property.region?.city??"",state:property.region?.state??"",neighborhood:property.region?.neighborhood??"",description:property.description??"",area_m2:property.area_m2?.toString()??"",bedrooms:property.bedrooms?.toString()??"",bathrooms:property.bathrooms?.toString()??"",suites:property.suites?.toString()??"",parking_spaces:property.parking_spaces?.toString()??"",featured:property.featured});
    setFiles([]);setTab("properties");window.scrollTo({top:0,behavior:"smooth"});
  }

  async function setPropertyStatus(property:Property,status:"draft"|"published"|"archived"){
    if(!supabase)return;
    if(status==="published"&&(!property.title||!property.property_type)){setMessage("Complete o título e o tipo do imóvel antes de publicar.");return;}
    const update=status==="published"?{status,published_at:new Date().toISOString()}:{status,published_at:null};
    const {error}=await supabase.from("properties").update(update).eq("id",property.id);
    if(error){setMessage(`Não foi possível alterar a publicação: ${error.message}`);return;}
    setMessage(status==="published"?"Imóvel publicado. Ele já está disponível no catálogo público.":status==="draft"?"Imóvel movido para rascunho.":"Imóvel arquivado.");await load();
  }

  async function addMedia(propertyId:string, selected:File[]){if(!selected.length)return;setUploadingProperty(propertyId);setMessage("");try{await uploadFiles(propertyId,selected);setMessage("Fotos e vídeos adicionados com sucesso.");await load();}catch(error){setMessage(error instanceof Error?`Não foi possível enviar os arquivos: ${error.message}`:"Não foi possível enviar os arquivos.");}finally{setUploadingProperty(null);}}
  async function setLeadStatus(id:string,status:string){if(!supabase)return;await supabase.from("leads").update({status}).eq("id",id);await load();}
  async function saveProfile(e:FormEvent){e.preventDefault();if(!supabase)return;const values={display_name:profile.display_name.trim(),whatsapp:profile.whatsapp.trim()||null,phone:profile.phone.trim()||null,email:profile.email.trim()||null,creci:profile.creci.trim()||null};if(!values.display_name){setMessage("Informe o nome de exibição.");return;}const result=profile.id?await supabase.from("consultant_profiles").update(values).eq("id",profile.id):await supabase.from("consultant_profiles").insert(values);if(result.error)setMessage("Não foi possível salvar os dados do consultor.");else{setMessage("Dados do consultor atualizados.");await load();}}

  if(loading)return <div className="admin-login"><div className="admin-login-inner">Carregando área administrativa…</div></div>;
  if(!authorized)return <section className="admin-login"><div className="admin-login-inner"><div className="eyebrow">Área do proprietário</div><h1 className="admin-title">Acesso administrativo</h1><p className="admin-login-copy">Entre com sua conta administrativa.</p><form onSubmit={login} className="admin-form" style={{marginTop:30}}><input className="admin-input" type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/><input className="admin-input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="admin-button is-primary">Entrar</button></form>{message&&<p style={{marginTop:16}}>{message}</p>}</div></section>;

  const published=properties.filter(p=>p.status==="published").length;const drafts=properties.filter(p=>p.status==="draft").length;const newLeads=leads.filter(l=>l.status==="new").length;

  return <section className="admin-shell"><div className="admin-wrap">
    <div className="admin-topbar"><div><div className="eyebrow">Cristian Oliveira · Gestão</div><h1 className="admin-title">Painel administrativo</h1></div><button onClick={logout} className="admin-button">Sair</button></div>
    <nav className="admin-tabs">{([['dashboard','Visão geral'],['properties','Imóveis'],['leads','Leads'],['channels','Portais'],['profile','Perfil']] as [Tab,string][]).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`admin-tab ${tab===key?"is-active":""}`}>{label}</button>)}</nav>
    {message&&<div className="admin-message">{message}</div>}
    {tab==="dashboard"&&<div className="admin-stat-grid">{[[properties.length,"Imóveis"],[published,"Publicados"],[drafts,"Rascunhos"],[newLeads,"Novos leads"]].map(([n,l])=><article key={String(l)} className="admin-stat"><strong>{n}</strong><div className="admin-muted">{l}</div></article>)}</div>}
    {tab==="properties"&&<div className="admin-grid"><form onSubmit={saveProperty} className="admin-card admin-form"><div className="admin-section-head"><h2>{editingId?"Editar imóvel":"Novo imóvel"}</h2>{editingId&&<button type="button" className="admin-link" onClick={()=>{setEditingId(null);setDraft(emptyDraft);setFiles([])}}>Cancelar edição</button>}</div><div className="admin-field"><label>Título do anúncio</label><input className="admin-input" placeholder="Ex.: Apartamento com vista para o mar" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} required/></div><div className="admin-row"><div className="admin-field"><label>Finalidade</label><select className="admin-select" value={draft.transaction_type} onChange={e=>setDraft({...draft,transaction_type:e.target.value as 'sale'|'rent'})}><option value="sale">Venda</option><option value="rent">Aluguel</option></select></div><div className="admin-field"><label>Tipo do imóvel</label><input className="admin-input" placeholder="Apartamento, casa, terreno..." value={draft.property_type} onChange={e=>setDraft({...draft,property_type:e.target.value})} required/></div></div><div className="admin-field"><label>Valor</label><input className="admin-input" inputMode="decimal" placeholder="R$ 0,00" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} onBlur={()=>{const n=parseMoney(draft.price);if(n!==null)setDraft(v=>({...v,price:money.format(n)}))}}/></div><div className="admin-row three"><div className="admin-field"><label>Cidade</label><input className="admin-input" placeholder="Cidade" value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})}/></div><div className="admin-field"><label htmlFor="property-state">Estado / UF</label><select id="property-state" className="admin-select" value={draft.state} onChange={e=>setDraft({...draft,state:e.target.value})}><option value="">Selecione o estado</option>{brazilianStates.map(([uf,name])=><option key={uf} value={uf}>{name} — {uf}</option>)}</select></div><div className="admin-field"><label>Bairro</label><input className="admin-input" placeholder="Opcional" value={draft.neighborhood} onChange={e=>setDraft({...draft,neighborhood:e.target.value})}/></div></div><div className="admin-row"><div className="admin-field"><label>Área (m²)</label><input className="admin-input" inputMode="decimal" value={draft.area_m2} onChange={e=>setDraft({...draft,area_m2:e.target.value})}/></div><div className="admin-field"><label>Vagas</label><input className="admin-input" inputMode="numeric" value={draft.parking_spaces} onChange={e=>setDraft({...draft,parking_spaces:e.target.value})}/></div></div><div className="admin-row"><div className="admin-field"><label>Quartos</label><input className="admin-input" inputMode="numeric" value={draft.bedrooms} onChange={e=>setDraft({...draft,bedrooms:e.target.value})}/></div><div className="admin-field"><label>Banheiros</label><input className="admin-input" inputMode="numeric" value={draft.bathrooms} onChange={e=>setDraft({...draft,bathrooms:e.target.value})}/></div></div><div className="admin-field"><label>Suítes</label><input className="admin-input" inputMode="numeric" value={draft.suites} onChange={e=>setDraft({...draft,suites:e.target.value})}/></div><div className="admin-field"><label>Descrição</label><textarea className="admin-textarea" placeholder="Use somente a descrição oficial do imóvel." value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></div><div className="admin-upload"><div className="admin-label">Fotos e vídeos</div><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" onChange={e=>setFiles(Array.from(e.target.files??[]))}/><p className="admin-help">Selecione uma ou várias fotos. Vídeos MP4 também são aceitos.</p>{files.length>0&&<div className="admin-file-count">{files.length} arquivo(s) selecionado(s)</div>}</div><label className="admin-check"><input type="checkbox" checked={draft.featured} onChange={e=>setDraft({...draft,featured:e.target.checked})}/> Mostrar como destaque</label><button className="admin-button is-primary" disabled={saving}>{saving?"Salvando…":editingId?"Salvar alterações":"Criar imóvel"}</button></form><div className="admin-list">{properties.map(p=><article key={p.id} className="admin-property"><div><div className="admin-property-title">{p.title||"Imóvel sem título"}<span className={`admin-status ${p.status}`}>{statusLabel[p.status]}</span></div><div className="admin-property-meta">{[p.property_type,p.region?.city,p.region?.state].filter(Boolean).join(" · ")||"Informações em preenchimento"}{p.price!=null?` · ${money.format(Number(p.price))}`:""}</div><div className="admin-property-meta">{p.media?.length??0} mídia(s) cadastrada(s)</div><div className="admin-upload" style={{marginTop:12}}><div className="admin-label">Adicionar fotos ou vídeo</div><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" disabled={uploadingProperty===p.id} onChange={e=>void addMedia(p.id,Array.from(e.target.files??[]))}/></div></div><div className="admin-actions"><button className="admin-button" onClick={()=>editProperty(p)}>Editar</button><button className="admin-button" disabled={p.status==="draft"} onClick={()=>void setPropertyStatus(p,"draft")}>Rascunho</button><button className="admin-button is-primary" disabled={p.status==="published"} onClick={()=>void setPropertyStatus(p,"published")}>Publicar</button><button className="admin-button is-danger" disabled={p.status==="archived"} onClick={()=>void setPropertyStatus(p,"archived")}>Arquivar</button></div></article>)}{properties.length===0&&<div className="admin-empty">Nenhum imóvel cadastrado.</div>}</div></div>}
    {tab==="leads"&&<div className="admin-list">{leads.map(l=><article key={l.id} className="admin-card"><div className="admin-section-head"><strong>{l.name||"Lead sem nome"}</strong><select className="admin-select" style={{maxWidth:190}} value={l.status} onChange={e=>void setLeadStatus(l.id,e.target.value)}><option value="new">Novo</option><option value="contacted">Contatado</option><option value="qualified">Qualificado</option><option value="closed">Fechado</option><option value="discarded">Descartado</option></select></div><p className="admin-muted">{[l.phone,l.email,l.source].filter(Boolean).join(" · ")||"Sem contato informado"}</p>{l.message&&<p>{l.message}</p>}</article>)}{leads.length===0&&<div className="admin-empty">Nenhum lead recebido.</div>}</div>}
    {tab==="channels"&&<div className="admin-stat-grid">{channels.map(c=><article key={c.id} className="admin-card"><div className="eyebrow">Canal de publicação</div><h2>{c.name}</h2><p className="admin-muted">{c.enabled?"Canal habilitado.":"Integração em preparação."}</p></article>)}</div>}
    {tab==="profile"&&<form onSubmit={saveProfile} className="admin-card admin-form" style={{maxWidth:680}}><h2>Dados do consultor</h2><div className="admin-field"><label>Nome</label><input className="admin-input" value={profile.display_name} onChange={e=>setProfile({...profile,display_name:e.target.value})} required/></div><div className="admin-field"><label>WhatsApp</label><input className="admin-input" value={profile.whatsapp} onChange={e=>setProfile({...profile,whatsapp:e.target.value})}/></div><div className="admin-field"><label>Telefone</label><input className="admin-input" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div><div className="admin-field"><label>E-mail</label><input className="admin-input" type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})}/></div><div className="admin-field"><label>CRECI</label><input className="admin-input" value={profile.creci} onChange={e=>setProfile({...profile,creci:e.target.value})}/></div><button className="admin-button is-primary">Salvar dados</button></form>}
  </div></section>;
}
