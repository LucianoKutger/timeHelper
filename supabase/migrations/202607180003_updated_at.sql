create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_work_days_updated_at
before update on public.work_days
for each row execute function public.set_updated_at();
