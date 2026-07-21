create extension if not exists pgcrypto;

create table if not exists public.work_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  start_time_one time,
  end_time_one time,
  start_time_two time,
  end_time_two time,
  day_marker text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_block_1 check (
    (start_time_one is null and end_time_one is null)
    or (start_time_one is not null and end_time_one > start_time_one)
  ),
  constraint valid_block_2 check (
    (start_time_two is null and end_time_two is null)
    or (start_time_two is not null and end_time_two > start_time_two)
  ),
  constraint valid_day_marker check (
    day_marker is null or day_marker in ('K', 'U')
  ),
  constraint work_days_has_work_or_marker check (
    start_time_one is not null or day_marker is not null
  )
);

create unique index if not exists uq_work_day_per_date
  on public.work_days (user_id, work_date);

create table if not exists public.command_requests (
  request_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  action_type text,
  status text not null,
  result_ref text,
  error_code text,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

create table if not exists public.excel_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  version text not null,
  mapping_json jsonb not null,
  sha256 text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.file_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artifact_type text not null,
  period text not null,
  revision integer not null,
  storage_path text not null,
  template_version text not null,
  data_version text not null,
  sha256 text not null,
  is_current boolean not null default false,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  unique (user_id, artifact_type, period, revision)
);

create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid references public.file_artifacts(id),
  recipient text not null,
  subject text not null,
  body text not null,
  status text not null default 'preview',
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  correlation_id uuid not null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_aliases (
  user_id uuid not null references auth.users(id) on delete cascade,
  spoken_value text not null,
  canonical_value text not null,
  active boolean not null default true,
  primary key (user_id, spoken_value)
);

alter table public.work_days enable row level security;
alter table public.command_requests enable row level security;
alter table public.excel_templates enable row level security;
alter table public.file_artifacts enable row level security;
alter table public.email_drafts enable row level security;
alter table public.audit_events enable row level security;
alter table public.activity_aliases enable row level security;

create policy "users own work_days" on public.work_days
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own command_requests" on public.command_requests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own excel_templates" on public.excel_templates
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own file_artifacts" on public.file_artifacts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own email_drafts" on public.email_drafts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own audit_events" on public.audit_events
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own activity_aliases" on public.activity_aliases
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
