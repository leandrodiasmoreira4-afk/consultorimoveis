drop policy if exists "admin_users_read_self" on public.admin_users;
create policy "admin_users_read_self" on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['properties','property_media','property_features','regions','leads','publication_channels','property_publications','feed_logs','consultant_profiles'] loop
    execute format('drop policy if exists %I on public.%I', 'admins_manage_' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.user_id = (select auth.uid())))', 'admins_manage_' || t, t);
  end loop;
end $$;

drop policy if exists "admins_read_property_media_objects" on storage.objects;
create policy "admins_read_property_media_objects" on storage.objects for select to authenticated
using (bucket_id='property-media' and exists (select 1 from public.admin_users au where au.user_id=(select auth.uid())));

drop policy if exists "admins_insert_property_media_objects" on storage.objects;
create policy "admins_insert_property_media_objects" on storage.objects for insert to authenticated
with check (bucket_id='property-media' and exists (select 1 from public.admin_users au where au.user_id=(select auth.uid())));

drop policy if exists "admins_update_property_media_objects" on storage.objects;
create policy "admins_update_property_media_objects" on storage.objects for update to authenticated
using (bucket_id='property-media' and exists (select 1 from public.admin_users au where au.user_id=(select auth.uid())))
with check (bucket_id='property-media' and exists (select 1 from public.admin_users au where au.user_id=(select auth.uid())));

drop policy if exists "admins_delete_property_media_objects" on storage.objects;
create policy "admins_delete_property_media_objects" on storage.objects for delete to authenticated
using (bucket_id='property-media' and exists (select 1 from public.admin_users au where au.user_id=(select auth.uid())));
