-- Public feed access is intentionally read-only and limited to rows that are
-- both published on the site and enabled for the globally active OLX channel.
-- No service role or SECURITY DEFINER function is required.

grant select (id, code, name, enabled) on public.publication_channels to anon;
grant select (property_id, channel_id, external_id, status) on public.property_publications to anon;

create policy "olx_channel_public_feed_read"
on public.publication_channels
for select
to anon
using (code = 'olx' and enabled = true);

create policy "olx_property_publications_public_feed_read"
on public.property_publications
for select
to anon
using (
  status in ('pending', 'published')
  and exists (
    select 1
    from public.publication_channels c
    where c.id = property_publications.channel_id
      and c.code = 'olx'
      and c.enabled = true
  )
  and exists (
    select 1
    from public.properties p
    where p.id = property_publications.property_id
      and p.status = 'published'
  )
);
