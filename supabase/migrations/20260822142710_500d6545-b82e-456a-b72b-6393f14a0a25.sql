-- ===== Roles =====
create type public.app_role as enum ('admin', 'landlord', 'caretaker', 'tenant');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Users claim non-admin role" on public.user_roles for insert to authenticated with check (user_id = auth.uid() and role <> 'admin');

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  national_id text,
  email text,
  role app_role not null default 'tenant',
  is_student boolean not null default false,
  university text,
  course text,
  reg_number text,
  year_of_study text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- ===== Properties =====
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references auth.users(id) on delete cascade,
  caretaker_id uuid references auth.users(id) on delete set null,
  name text not null,
  code text,
  property_type text not null default 'apartment',
  address text,
  county text,
  town text,
  nearby_university text,
  description text,
  amenities text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;

create or replace function public.is_property_landlord(_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties where id = _property_id and landlord_id = auth.uid())
$$;

create or replace function public.is_property_caretaker(_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.properties where id = _property_id and caretaker_id = auth.uid())
$$;

create policy "Landlord manages own properties" on public.properties for all to authenticated
  using (landlord_id = auth.uid()) with check (landlord_id = auth.uid());
create policy "Caretaker views assigned property" on public.properties for select to authenticated
  using (caretaker_id = auth.uid());
create policy "Caretaker updates assigned property" on public.properties for update to authenticated
  using (caretaker_id = auth.uid()) with check (caretaker_id = auth.uid());

-- ===== Buildings =====
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  code text,
  floors_count integer not null default 1,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.buildings to authenticated;
grant all on public.buildings to service_role;
alter table public.buildings enable row level security;
create policy "Landlord/caretaker manage buildings" on public.buildings for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Units =====
create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  unit_number text not null,
  floor text,
  unit_type text not null default 'bedsitter',
  rent_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  status text not null default 'vacant' check (status in ('vacant','occupied','reserved','maintenance','notice')),
  max_occupants integer not null default 1,
  furnished boolean not null default false,
  water_meter_no text,
  electricity_meter_no text,
  notes text,
  created_at timestamptz not null default now(),
  unique (property_id, unit_number)
);
grant select, insert, update, delete on public.units to authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;
create policy "Landlord/caretaker view units" on public.units for select to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));
create policy "Landlord/caretaker manage units" on public.units for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Tenants =====
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  national_id text,
  is_student boolean not null default false,
  university text,
  course text,
  reg_number text,
  year_of_study text,
  emergency_contact_name text,
  emergency_contact_phone text,
  move_in_date date,
  move_out_date date,
  rent_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active','notice','moved_out')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tenants to authenticated;
grant all on public.tenants to service_role;
alter table public.tenants enable row level security;
create policy "Landlord/caretaker view tenants" on public.tenants for select to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));
create policy "Tenant views own record" on public.tenants for select to authenticated
  using (user_id = auth.uid());
create policy "Landlord/caretaker manage tenants" on public.tenants for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Helper functions (after tenants) =====
create or replace function public.is_own_tenant_record(_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenants where id = _tenant_id and user_id = auth.uid())
$$;

create or replace function public.is_property_member(_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_property_landlord(_property_id)
    or public.is_property_caretaker(_property_id)
    or exists (select 1 from public.tenants where property_id = _property_id and user_id = auth.uid())
$$;

create policy "Members view buildings" on public.buildings for select to authenticated
  using (public.is_property_member(property_id));
create policy "Members view units" on public.units for select to authenticated
  using (public.is_property_member(property_id));

-- ===== Leases =====
create table public.leases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  start_date date,
  end_date date,
  rent_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('draft','active','expired','terminated')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.leases to authenticated;
grant all on public.leases to service_role;
alter table public.leases enable row level security;
create policy "Members view leases" on public.leases for select to authenticated
  using (public.is_property_member(property_id) or public.is_own_tenant_record(tenant_id));
create policy "Landlord/caretaker manage leases" on public.leases for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Rent invoices =====
create table public.rent_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  period date not null,
  amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid','overdue','waived')),
  created_at timestamptz not null default now(),
  unique (tenant_id, period)
);
grant select, insert, update, delete on public.rent_invoices to authenticated;
grant all on public.rent_invoices to service_role;
alter table public.rent_invoices enable row level security;
create policy "Members view invoices" on public.rent_invoices for select to authenticated
  using (public.is_property_member(property_id) or public.is_own_tenant_record(tenant_id));
create policy "Landlord/caretaker manage invoices" on public.rent_invoices for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Payments =====
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  invoice_id uuid references public.rent_invoices(id) on delete set null,
  amount numeric(12,2) not null,
  method text not null default 'cash' check (method in ('mpesa','bank','cash','card','other')),
  reference text,
  receipt_no text,
  period date,
  note text,
  recorded_by uuid,
  status text not null default 'confirmed' check (status in ('confirmed','mock','reversed')),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "Members view payments" on public.payments for select to authenticated
  using (public.is_property_member(property_id) or public.is_own_tenant_record(tenant_id));
create policy "Landlord/caretaker record payments" on public.payments for insert to authenticated
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));
create policy "Tenants record own mock payments" on public.payments for insert to authenticated
  with check (status = 'mock' and public.is_own_tenant_record(tenant_id));
create policy "Landlord/caretaker update payments" on public.payments for update to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));
create policy "Landlord delete payments" on public.payments for delete to authenticated
  using (public.is_property_landlord(property_id));

-- ===== Expenses =====
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(12,2) not null,
  expense_date date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create policy "Landlord manages expenses" on public.expenses for all to authenticated
  using (public.is_property_landlord(property_id)) with check (public.is_property_landlord(property_id));

-- ===== Maintenance requests =====
create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  reported_by uuid,
  title text not null,
  description text,
  category text not null default 'other',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent','emergency')),
  status text not null default 'new' check (status in ('new','assigned','in_progress','waiting_parts','completed','rejected','cancelled')),
  assigned_to text,
  cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select, insert, update, delete on public.maintenance_requests to authenticated;
grant all on public.maintenance_requests to service_role;
alter table public.maintenance_requests enable row level security;
create policy "Members view maintenance" on public.maintenance_requests for select to authenticated
  using (public.is_property_member(property_id) or public.is_own_tenant_record(tenant_id));
create policy "Tenants report issues" on public.maintenance_requests for insert to authenticated
  with check (reported_by = auth.uid() and (tenant_id is null or public.is_own_tenant_record(tenant_id)));
create policy "Landlord/caretaker manage maintenance" on public.maintenance_requests for all to authenticated
  using (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id))
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));

-- ===== Announcements =====
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  author_id uuid,
  title text not null,
  message text not null,
  audience text not null default 'all',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "Members view announcements" on public.announcements for select to authenticated
  using (public.is_property_member(property_id));
create policy "Landlord/caretaker post announcements" on public.announcements for insert to authenticated
  with check (public.is_property_landlord(property_id) or public.is_property_caretaker(property_id));
create policy "Landlord deletes announcements" on public.announcements for delete to authenticated
  using (public.is_property_landlord(property_id));

-- ===== Notifications =====
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Users view own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "Authenticated create notifications" on public.notifications for insert to authenticated with check (true);

-- ===== Audit logs =====
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  actor_id uuid,
  actor_name text,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Landlord views audit logs" on public.audit_logs for select to authenticated
  using (property_id is not null and public.is_property_landlord(property_id));
create policy "Members write audit logs" on public.audit_logs for insert to authenticated
  with check (actor_id = auth.uid());