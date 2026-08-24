create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'tenant');
  safe_role app_role;
begin
  if requested in ('tenant','landlord','caretaker') then
    safe_role := requested::app_role;
  else
    safe_role := 'tenant'::app_role;
  end if;

  insert into public.profiles (id, full_name, phone, national_id, email, role, is_student, university, course, reg_number, year_of_study)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'national_id',
    new.email,
    safe_role,
    coalesce((new.raw_user_meta_data ->> 'is_student')::boolean, false),
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'course',
    new.raw_user_meta_data ->> 'reg_number',
    new.raw_user_meta_data ->> 'year_of_study'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();