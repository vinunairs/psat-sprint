-- Parent-set rewards: students read their own row; only an admin can write (via admin_set_rewards).
create table if not exists public.reward_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rewards jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.reward_config enable row level security;
drop policy if exists "read own rewards" on public.reward_config;
create policy "read own rewards" on public.reward_config for select using (auth.uid() = user_id);
create or replace function public.admin_get_rewards(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return coalesce((select rewards from reward_config where user_id = p_user),
                  (select data->'rewards' from progress where user_id = p_user), '[]'::jsonb);
end $$;
create or replace function public.admin_set_rewards(p_user uuid, p_rewards jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if jsonb_typeof(p_rewards) <> 'array' or jsonb_array_length(p_rewards) > 12 then raise exception 'bad rewards'; end if;
  insert into reward_config(user_id, rewards, updated_at) values (p_user, p_rewards, now())
  on conflict (user_id) do update set rewards = excluded.rewards, updated_at = now();
end $$;
revoke all on function public.admin_get_rewards(uuid) from public, anon;
revoke all on function public.admin_set_rewards(uuid, jsonb) from public, anon;
grant execute on function public.admin_get_rewards(uuid) to authenticated;
grant execute on function public.admin_set_rewards(uuid, jsonb) to authenticated;
insert into reward_config(user_id, rewards)
select p.user_id, (select jsonb_agg(jsonb_build_object('id', r->>'id', 'label', r->>'label', 'xp', (r->>'xp')::int)) from jsonb_array_elements(p.data->'rewards') r)
from progress p where jsonb_typeof(p.data->'rewards') = 'array' and jsonb_array_length(p.data->'rewards') > 0
on conflict (user_id) do nothing;
