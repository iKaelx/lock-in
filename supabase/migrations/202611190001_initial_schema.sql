create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  education_level text,
  study_field text,
  institution text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  preferred_session_minutes integer not null default 50 check (preferred_session_minutes between 15 and 240),
  break_minutes integer not null default 10 check (break_minutes between 0 and 60),
  max_daily_study_minutes integer not null default 300 check (max_daily_study_minutes between 30 and 720),
  preferred_study_days integer[] not null default '{1,2,3,4,5}',
  theme text not null default 'light' check (theme in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#6C5CE7',
  difficulty text not null default 'Medium' check (difficulty in ('Easy','Medium','Hard')),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  weekly_target_minutes integer not null default 180 check (weekly_target_minutes >= 0),
  understanding_level integer not null default 50 check (understanding_level between 0 and 100),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  deadline timestamptz,
  estimated_minutes integer not null default 60 check (estimated_minutes >= 0),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status text not null default 'Pending' check (status in ('Pending','In Progress','Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  exam_date timestamptz not null,
  importance text not null default 'Medium' check (importance in ('Low','Medium','High')),
  preparation_status integer not null default 0 check (preparation_status between 0 and 100),
  topics text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  constraint availability_range check (end_time > start_time),
  unique (user_id, day_of_week, start_time, end_time)
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  week_start date not null,
  status text not null default 'Draft' check (status in ('Draft','Accepted','Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  session_type text not null default 'Study' check (session_type in ('Study','Revision','Break')),
  status text not null default 'Scheduled' check (status in ('Scheduled','Completed','Skipped','Rescheduled')),
  actual_minutes integer check (actual_minutes >= 0),
  focus_rating integer check (focus_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_session_range check (end_time > start_time)
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists tasks_user_subject_idx on public.tasks(user_id, subject_id);
create index if not exists tasks_deadline_idx on public.tasks(deadline);
create index if not exists exams_user_date_idx on public.exams(user_id, exam_date);
create index if not exists sessions_user_start_idx on public.study_sessions(user_id, start_time);
create index if not exists plans_user_week_idx on public.study_plans(user_id, week_start);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.exams enable row level security;
alter table public.availability enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_subscriptions enable row level security;

revoke all on table
  public.profiles,
  public.user_preferences,
  public.subjects,
  public.tasks,
  public.exams,
  public.availability,
  public.study_plans,
  public.study_sessions,
  public.user_subscriptions
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.user_preferences,
  public.subjects,
  public.tasks,
  public.exams,
  public.availability,
  public.study_plans,
  public.study_sessions,
  public.user_subscriptions
to authenticated;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id) values (new.id);
  insert into public.user_preferences(user_id) values (new.id);
  insert into public.user_subscriptions(user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_user();

revoke execute on function public.create_profile_for_user() from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','user_preferences','subjects','tasks','exams','study_plans','study_sessions','user_subscriptions']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['user_preferences','subjects','tasks','exams','availability','study_plans','study_sessions','user_subscriptions']
  loop
    execute format('drop policy if exists "%s_select_owner" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_owner" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_owner" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_owner" on public.%I', t, t);
    execute format('create policy "%s_select_owner" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_insert_owner" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_update_owner" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s_delete_owner" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
  end loop;
end;
$$;

-- profiles use id as their owner column
drop policy if exists profiles_select_owner on public.profiles;
drop policy if exists profiles_insert_owner on public.profiles;
drop policy if exists profiles_update_owner on public.profiles;
drop policy if exists profiles_delete_owner on public.profiles;
create policy profiles_select_owner on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_owner on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_owner on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_owner on public.profiles for delete to authenticated using ((select auth.uid()) = id);
