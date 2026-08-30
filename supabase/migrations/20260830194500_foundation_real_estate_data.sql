create table public.regions (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null check (char_length(state) = 2),
  neighborhood text,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consultant_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  whatsapp text,
  phone text,
  email text,
  creci text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  description text,
  transaction_type text check (transaction_type is null or transaction_type in ('sale','rent')),
  property_type text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  price numeric(14,2) check (price is null or price >= 0),
  condo_fee numeric(12,2) check (condo_fee is null or condo_fee >= 0),
  iptu numeric(12,2) check (iptu is null or iptu >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  suites integer check (suites is null or suites >= 0),
  parking_spaces integer check (parking_spaces is null or parking_spaces >= 0),
  area_m2 numeric(12,2) check (area_m2 is null or area_m2 >= 0),
  lot_area_m2 numeric(12,2) check (lot_area_m2 is null or lot_area_m2 >= 0),
  region_id uuid references public.regions(id) on delete set null,
  address_line1 text,
  address_number text,
  postal_code text,
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_property_has_timestamp check (status <> 'published' or published_at is not null)
);

create index properties_status_published_idx on public.properties(status, published_at desc);
create index properties_region_idx on public.properties(region_id);
create index properties_type_idx on public.properties(property_type);
create index properties_transaction_idx on public.properties(transaction_type);
create index properties_featured_idx on public.properties(featured) where featured = true;

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  alt_text text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (property_id, storage_path)
);
create index property_media_property_position_idx on public.property_media(property_id, position);

create table public.property_features (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  value text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
create index property_features_property_idx on public.property_features(property_id, position);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  name text,
  email text,
  phone text,
  message text,
  source text,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed','discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_created_at_idx on public.leads(created_at desc);
create index leads_property_idx on public.leads(property_id);

create table public.publication_channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_publications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  channel_id uuid not null references public.publication_channels(id) on delete cascade,
  external_id text,
  external_url text,
  status text not null default 'pending' check (status in ('pending','published','failed','disabled')),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, channel_id)
);

create table public.feed_logs (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.publication_channels(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  event_type text not null,
  status text not null check (status in ('success','error','info')),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index feed_logs_created_at_idx on public.feed_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger regions_set_updated_at before update on public.regions for each row execute function public.set_updated_at();
create trigger consultant_profiles_set_updated_at before update on public.consultant_profiles for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger publication_channels_set_updated_at before update on public.publication_channels for each row execute function public.set_updated_at();
create trigger property_publications_set_updated_at before update on public.property_publications for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.regions enable row level security;
alter table public.consultant_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.property_features enable row level security;
alter table public.leads enable row level security;
alter table public.publication_channels enable row level security;
alter table public.property_publications enable row level security;
alter table public.feed_logs enable row level security;

create policy regions_public_read on public.regions for select to anon, authenticated using (
  exists (select 1 from public.properties p where p.region_id = regions.id and p.status = 'published')
);

create policy consultant_profile_public_read on public.consultant_profiles for select to anon, authenticated using (true);
create policy properties_public_read on public.properties for select to anon, authenticated using (status = 'published');

create policy property_media_public_read on public.property_media for select to anon, authenticated using (
  exists (select 1 from public.properties p where p.id = property_media.property_id and p.status = 'published')
);

create policy property_features_public_read on public.property_features for select to anon, authenticated using (
  exists (select 1 from public.properties p where p.id = property_features.property_id and p.status = 'published')
);

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.regions, public.consultant_profiles, public.properties, public.property_media, public.property_features to anon, authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into public.properties (slug, status)
values ('terreno-200m2-petrolina', 'draft')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', false, 20971520, array['image/jpeg','image/png','image/webp','image/avif','video/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy property_media_storage_public_read
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'property-media'
  and exists (
    select 1
    from public.properties p
    where p.status = 'published'
      and name like p.id::text || '/%'
  )
);
