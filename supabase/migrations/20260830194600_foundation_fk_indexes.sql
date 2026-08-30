create index if not exists property_publications_channel_idx on public.property_publications(channel_id);
create index if not exists feed_logs_channel_idx on public.feed_logs(channel_id);
create index if not exists feed_logs_property_idx on public.feed_logs(property_id);
