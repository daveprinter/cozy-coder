-- 1. Create a private schema that is NOT exposed through the Data API
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Drop the API-exposed security-definer helpers.
-- CASCADE drops the policies that reference them; all are recreated below.
DROP FUNCTION IF EXISTS public.is_property_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_property_landlord(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_property_caretaker(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_own_tenant_record(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

-- 3. Recreate the helpers in the hidden private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$function$;

CREATE OR REPLACE FUNCTION private.is_own_tenant_record(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.tenants where id = _tenant_id and user_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.is_property_caretaker(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.properties where id = _property_id and caretaker_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.is_property_landlord(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.properties where id = _property_id and landlord_id = auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.is_property_member(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select private.is_property_landlord(_property_id)
    or private.is_property_caretaker(_property_id)
    or exists (select 1 from public.tenants where property_id = _property_id and user_id = auth.uid())
$function$;

-- 4. Lock down permissions: helpers are only reachable by signed-in users
--    during row-level security evaluation, never via the public API
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_own_tenant_record(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_property_caretaker(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_property_landlord(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_property_member(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_own_tenant_record(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_property_caretaker(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_property_landlord(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_property_member(uuid) TO authenticated, service_role;

-- 5. Recreate all policies that referenced the moved functions

-- buildings
CREATE POLICY "Members view buildings" ON public.buildings FOR SELECT TO authenticated
  USING (private.is_property_member(property_id));
CREATE POLICY "Landlord/caretaker manage buildings" ON public.buildings FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- units
CREATE POLICY "Members view units" ON public.units FOR SELECT TO authenticated
  USING (private.is_property_member(property_id));
CREATE POLICY "Landlord/caretaker view units" ON public.units FOR SELECT TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));
CREATE POLICY "Landlord/caretaker manage units" ON public.units FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- tenants
CREATE POLICY "Landlord/caretaker view tenants" ON public.tenants FOR SELECT TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));
CREATE POLICY "Landlord/caretaker manage tenants" ON public.tenants FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- leases
CREATE POLICY "Members view leases" ON public.leases FOR SELECT TO authenticated
  USING (private.is_property_member(property_id) OR private.is_own_tenant_record(tenant_id));
CREATE POLICY "Landlord/caretaker manage leases" ON public.leases FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- rent_invoices
CREATE POLICY "Members view invoices" ON public.rent_invoices FOR SELECT TO authenticated
  USING (private.is_property_member(property_id) OR private.is_own_tenant_record(tenant_id));
CREATE POLICY "Landlord/caretaker manage invoices" ON public.rent_invoices FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- payments
CREATE POLICY "Members view payments" ON public.payments FOR SELECT TO authenticated
  USING (private.is_property_member(property_id) OR private.is_own_tenant_record(tenant_id));
CREATE POLICY "Landlord/caretaker record payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));
CREATE POLICY "Tenants record own mock payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK ((status = 'mock'::text) AND private.is_own_tenant_record(tenant_id));
CREATE POLICY "Landlord/caretaker update payments" ON public.payments FOR UPDATE TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));
CREATE POLICY "Landlord delete payments" ON public.payments FOR DELETE TO authenticated
  USING (private.is_property_landlord(property_id));

-- expenses
CREATE POLICY "Landlord manages expenses" ON public.expenses FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id))
  WITH CHECK (private.is_property_landlord(property_id));

-- maintenance_requests
CREATE POLICY "Members view maintenance" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (private.is_property_member(property_id) OR private.is_own_tenant_record(tenant_id));
CREATE POLICY "Tenants report issues" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK ((reported_by = auth.uid()) AND ((tenant_id IS NULL) OR private.is_own_tenant_record(tenant_id)));
CREATE POLICY "Landlord/caretaker manage maintenance" ON public.maintenance_requests FOR ALL TO authenticated
  USING (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id))
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));

-- announcements
CREATE POLICY "Members view announcements" ON public.announcements FOR SELECT TO authenticated
  USING (private.is_property_member(property_id));
CREATE POLICY "Landlord/caretaker post announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (private.is_property_landlord(property_id) OR private.is_property_caretaker(property_id));
CREATE POLICY "Landlord deletes announcements" ON public.announcements FOR DELETE TO authenticated
  USING (private.is_property_landlord(property_id));

-- audit_logs
CREATE POLICY "Landlord views audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING ((property_id IS NOT NULL) AND private.is_property_landlord(property_id));
DROP POLICY "Members write audit logs" ON public.audit_logs;
CREATE POLICY "Members write audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK ((actor_id = auth.uid()) AND ((property_id IS NULL) OR private.is_property_member(property_id)));

-- 6. notifications: only self-notifications or property managers notifying their own members
DROP POLICY "Authenticated create notifications" ON public.notifications;
CREATE POLICY "Managers notify property members" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE ((p.landlord_id = auth.uid()) OR (p.caretaker_id = auth.uid()))
        AND (
          (p.landlord_id = notifications.user_id)
          OR (p.caretaker_id = notifications.user_id)
          OR EXISTS (SELECT 1 FROM public.tenants t WHERE (t.property_id = p.id) AND (t.user_id = notifications.user_id))
        )
    )
  );