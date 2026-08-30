create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

create policy "admin_users_read_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- Authenticated users only receive table privileges here; RLS below decides who may act.
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.property_media to authenticated;
grant select, insert, update, delete on public.property_features to authenticated;
grant select, insert, update, delete on public.regions to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.publication_channels to authenticated;
grant select, insert, update, delete on public.property_publications to authenticated;
grant select, insert, update, delete on public.feed_logs to authenticated;
grant select, insert, update, delete on public.consultant_profiles to authenticated;

create policy "admins_manage_properties"
on public.properties
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_property_media"
on public.property_media
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_property_features"
on public.property_features
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_regions"
on public.regions
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_leads"
on public.leads
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_publication_channels"
on public.publication_channels
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_property_publications"
on public.property_publications
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_feed_logs"
on public.feed_logs
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admins_manage_consultant_profiles"
on public.consultant_profiles
for all
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- Private bucket: authenticated admins can manage draft and published media.
create policy "admins_read_property_media_objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'property-media'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "admins_insert_property_media_objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-media'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "admins_update_property_media_objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-media'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
)
with check (
  bucket_id = 'property-media'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

create policy "admins_delete_property_media_objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-media'
  and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
);

-- Region requested for the project; this does not assign any property address.
insert into public.regions (city, state, slug)
values ('Salvador', 'BA', 'salvador-ba')
on conflict (slug) do nothing;

-- Portal records are intentionally disabled until each official integration is implemented.
insert into public.publication_channels (code, name, enabled)
values
  ('olx', 'OLX', false),
  ('zap', 'ZAP Imóveis', false),
  ('vivareal', 'Viva Real', false)
on conflict (code) do nothing;
