-- FAST Prep (grade 4 FAST + i-Ready) — separate from the PSAT/SAT tables so the two never mix.
-- Only accounts listed in fast_learners can save FAST progress; the admin adds learners (no self sign-up).

create table if not exists public.fast_learners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  grade text not null default '4',
  school text,
  active boolean not null default true,
  goals jsonb not null default '{}',
  rewards jsonb not null default '[]' check (jsonb_typeof(rewards) = 'array' and jsonb_array_length(rewards) <= 20), -- parent-set real rewards [{id, label, xp (coin cost)}]
  created_at timestamptz not null default now()
);

create table if not exists public.fast_progress (
  user_id uuid primary key references public.fast_learners(user_id) on delete cascade,
  data jsonb not null default '{}',
  client_updated_ms bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- School results (FAST PM1/PM2/PM3, i-Ready diagnostics), entered by the parent.
create table if not exists public.fast_scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.fast_learners(user_id) on delete cascade,
  test text not null check (test in ('fast_math', 'fast_reading', 'fast_writing', 'iready_math', 'iready_reading')),
  grade text not null,
  term text not null,                 -- e.g. 'PM1 (fall)', 'Winter diagnostic'
  taken_on date,
  score integer,
  level integer check (level is null or level between 1 and 5),
  details jsonb not null default '{}', -- e.g. category levels {"Fractions": 2}
  created_at timestamptz not null default now()
);
create index if not exists fast_scores_user_idx on public.fast_scores(user_id, taken_on);

-- Parent feedback on essays (rubric points + a note).
create table if not exists public.fast_feedback (
  user_id uuid not null references public.fast_learners(user_id) on delete cascade,
  essay_id text not null,
  scores jsonb not null default '{}',
  note text check (note is null or length(note) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, essay_id)
);

create or replace function public.fast_is_learner() returns boolean
language sql stable security definer set search_path = ''
as 'select exists (select 1 from public.fast_learners l where l.user_id = (select auth.uid()) and l.active)';
revoke all on function public.fast_is_learner() from public, anon;
grant execute on function public.fast_is_learner() to authenticated;

-- updated_at is sent by the app with every save (no trigger).

alter table public.fast_learners enable row level security;
alter table public.fast_progress enable row level security;
alter table public.fast_scores enable row level security;
alter table public.fast_feedback enable row level security;

drop policy if exists "fast learners read own or admin" on public.fast_learners;
create policy "fast learners read own or admin" on public.fast_learners for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "fast admin manages learners" on public.fast_learners;
create policy "fast admin manages learners" on public.fast_learners for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "fast progress read own or admin" on public.fast_progress;
create policy "fast progress read own or admin" on public.fast_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "fast progress insert own" on public.fast_progress;
create policy "fast progress insert own" on public.fast_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.fast_is_learner()));
drop policy if exists "fast progress update own" on public.fast_progress;
create policy "fast progress update own" on public.fast_progress for update to authenticated
  using (user_id = (select auth.uid()) and (select public.fast_is_learner()))
  with check (user_id = (select auth.uid()) and octet_length(data::text) < 3000000);

drop policy if exists "fast scores read own or admin" on public.fast_scores;
create policy "fast scores read own or admin" on public.fast_scores for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "fast scores admin insert" on public.fast_scores;
create policy "fast scores admin insert" on public.fast_scores for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "fast scores admin update" on public.fast_scores;
create policy "fast scores admin update" on public.fast_scores for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "fast scores admin delete" on public.fast_scores;
create policy "fast scores admin delete" on public.fast_scores for delete to authenticated using ((select public.is_admin()));

drop policy if exists "fast feedback read own or admin" on public.fast_feedback;
create policy "fast feedback read own or admin" on public.fast_feedback for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "fast feedback admin insert" on public.fast_feedback;
create policy "fast feedback admin insert" on public.fast_feedback for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "fast feedback admin update" on public.fast_feedback;
create policy "fast feedback admin update" on public.fast_feedback for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select, insert, update on public.fast_progress to authenticated;
grant select, update on public.fast_learners to authenticated;
grant select, insert, update, delete on public.fast_scores to authenticated;
grant select, insert, update on public.fast_feedback to authenticated;
revoke all on public.fast_learners, public.fast_progress, public.fast_scores, public.fast_feedback from anon;
