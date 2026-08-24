create policy "Admins read all profiles" on public.profiles
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins read all roles" on public.user_roles
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins grant roles" on public.user_roles
  for insert to authenticated
  with check (private.has_role(auth.uid(), 'admin'::app_role));

create policy "Admins revoke roles" on public.user_roles
  for delete to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));

grant delete on public.user_roles to authenticated;