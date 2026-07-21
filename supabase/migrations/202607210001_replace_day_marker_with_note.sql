do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'start_time_1'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'start_time_one'
  ) then
    alter table public.work_days rename column start_time_1 to start_time_one;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'end_time_1'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'end_time_one'
  ) then
    alter table public.work_days rename column end_time_1 to end_time_one;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'start_time_2'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'start_time_two'
  ) then
    alter table public.work_days rename column start_time_2 to start_time_two;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'end_time_2'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'work_days'
      and column_name = 'end_time_two'
  ) then
    alter table public.work_days rename column end_time_2 to end_time_two;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_days'
      and column_name = 'day_marker'
  ) then
    execute $sql$
      update public.work_days
      set note = coalesce(nullif(btrim(note), ''), day_marker::text)
      where day_marker is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_days'
      and column_name = 'day_code'
  ) then
    execute $sql$
      update public.work_days
      set note = coalesce(nullif(btrim(note), ''), day_code::text)
      where day_code is not null
    $sql$;
  end if;
end
$$;

alter table public.work_days
  drop constraint if exists work_days_has_work_or_marker,
  drop constraint if exists has_work_or_marker,
  drop constraint if exists has_work_or_code,
  drop constraint if exists valid_day_code,
  drop constraint if exists work_days_has_work_or_note;

alter table public.work_days
  drop column if exists day_marker,
  drop column if exists day_code;

alter table public.work_days
  add constraint work_days_has_work_or_note check (
    start_time_one is not null or nullif(btrim(note), '') is not null
  );
