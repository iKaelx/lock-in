create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  color text not null default '#6C5CE7' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_valid_range check (ends_at > starts_at)
);

create table public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  content text not null default '',
  color text not null default '#F4F1FF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_notes_content_length check (char_length(content) <= 20000)
);

create index calendar_events_user_start_idx on public.calendar_events(user_id, starts_at);
create index study_notes_user_pinned_updated_idx on public.study_notes(user_id, is_pinned desc, updated_at desc);

alter table public.calendar_events enable row level security;
alter table public.study_notes enable row level security;

revoke all on table public.calendar_events, public.study_notes from anon, authenticated;
grant select, insert, update, delete on table public.calendar_events, public.study_notes to authenticated;

create policy calendar_events_select_owner on public.calendar_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy calendar_events_insert_owner on public.calendar_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy calendar_events_update_owner on public.calendar_events
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy calendar_events_delete_owner on public.calendar_events
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy study_notes_select_owner on public.study_notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy study_notes_insert_owner on public.study_notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy study_notes_update_owner on public.study_notes
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy study_notes_delete_owner on public.study_notes
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger set_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger set_study_notes_updated_at
  before update on public.study_notes
  for each row execute function public.set_updated_at();