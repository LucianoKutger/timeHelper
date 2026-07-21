alter table public.work_days
  add column if not exists day_marker text;

update public.work_days
set day_marker = btrim(note),
    note = null
where day_marker is null
  and btrim(note) in ('K', 'U');

alter table public.work_days
  drop constraint if exists work_days_has_work_or_note,
  drop constraint if exists work_days_has_work_or_marker,
  drop constraint if exists valid_day_marker;

alter table public.work_days
  add constraint valid_day_marker check (
    day_marker is null or day_marker in ('K', 'U')
  ),
  add constraint work_days_has_work_or_marker check (
    start_time_one is not null or day_marker is not null
  );
