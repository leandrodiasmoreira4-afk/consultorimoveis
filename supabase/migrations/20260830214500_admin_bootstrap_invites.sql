create table if not exists public.admin_invites (
  email text primary key,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  active boolean not null default true,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from anon, authenticated, public;
grant all on public.admin_invites to service_role;

create or replace function public.handle_admin_invite_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_role text;
begin
  if new.email is null then
    return new;
  end if;

  select ai.role
    into invite_role
  from public.admin_invites ai
  where lower(ai.email) = lower(new.email)
    and ai.active = true
    and ai.claimed_at is null
  limit 1;

  if invite_role is not null then
    insert into public.admin_users (user_id, role)
    values (new.id, invite_role)
    on conflict (user_id) do update set role = excluded.role;

    update public.admin_invites
      set claimed_at = now(), active = false
    where lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_admin_invite_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_admin_invite on auth.users;
create trigger on_auth_user_created_admin_invite
after insert on auth.users
for each row execute procedure public.handle_admin_invite_signup();

insert into public.admin_invites (email, role, active)
values ('Leandro.dias.moreira4@gmail.com', 'admin', true)
on conflict (email) do update
set role = excluded.role,
    active = case when public.admin_invites.claimed_at is null then true else public.admin_invites.active end;
