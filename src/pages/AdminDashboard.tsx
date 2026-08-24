import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/lib/domain/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, LogOut, Users, Home, Wrench, Wallet, ShieldCheck, Search, Activity,
} from "lucide-react";

type AppRole = "admin" | "landlord" | "caretaker" | "tenant";

interface AccountRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

const money = (n: number) => `KSh ${Math.round(n).toLocaleString()}`;

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const data = useData();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountQuery, setAccountQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");

  const finance = data.financeStats();
  const occupancy = data.occupancyStats();

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      byUser.set(r.user_id, list);
    });
    setAccounts(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        created_at: p.created_at,
        roles: byUser.get(p.id) ?? [],
      })),
    );
    setLoadingAccounts(false);
  };

  useEffect(() => {
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grantRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast({ title: "Could not grant role", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role granted", description: `User is now a ${role}.` });
    void loadAccounts();
  };

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      `${a.full_name} ${a.email ?? ""} ${a.phone ?? ""} ${a.roles.join(" ")}`.toLowerCase().includes(q),
    );
  }, [accounts, accountQuery]);

  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    const hits: { kind: string; label: string; detail: string }[] = [];
    data.properties.forEach((p) => {
      if (`${p.name} ${p.town ?? ""}`.toLowerCase().includes(q))
        hits.push({ kind: "Property", label: p.name, detail: p.town ?? "" });
    });
    data.units.forEach((u) => {
      if (u.unitNumber.toLowerCase().includes(q))
        hits.push({ kind: "Unit", label: u.unitNumber, detail: u.status });
    });
    data.tenants.forEach((t) => {
      if (`${t.fullName} ${t.phone ?? ""}`.toLowerCase().includes(q))
        hits.push({ kind: "Tenant", label: t.fullName, detail: t.phone ?? "" });
    });
    data.tickets.forEach((t) => {
      if (`${t.number} ${t.title}`.toLowerCase().includes(q))
        hits.push({ kind: "Maintenance", label: `${t.number} — ${t.title}`, detail: t.status });
    });
    return hits.slice(0, 25);
  }, [data, globalQuery]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const kpis = [
    { label: "Registered accounts", value: String(accounts.length), icon: Users },
    { label: "Properties", value: String(data.properties.length), icon: Home },
    { label: "Occupancy", value: `${Math.round(occupancy.rate)}%`, icon: Building2 },
    { label: "Collected this month", value: money(finance.collectedThisMonth), icon: Wallet },
    { label: "Open tickets", value: String(finance.openTickets), icon: Wrench },
    { label: "Staff on payroll", value: String(data.staff.length), icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero p-4 pb-6 text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-heading text-lg font-bold">NyumbaLink</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="font-heading text-xl font-bold">Super Admin Console</h1>
          <p className="text-primary-foreground/80 text-sm">Accounts, roles, system health and portfolio-wide search</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label} className="glow-card border-0 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <k.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading text-2xl font-bold text-foreground mt-2">{k.value}</p>
            </Card>
          ))}
        </div>

        <Card className="glow-card border-0 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Global search</h2>
          </div>
          <Input
            placeholder="Search properties, units, tenants, maintenance tickets..."
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
          />
          {globalResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-72 overflow-auto">
              {globalResults.map((r, i) => (
                <div key={`${r.kind}-${i}`} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <Badge variant="secondary">{r.kind}</Badge>
                </div>
              ))}
            </div>
          )}
          {globalQuery && globalResults.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No matches found.</p>
          )}
        </Card>

        <Card className="glow-card border-0 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-heading text-lg font-bold">Accounts & roles</h2>
            <Input
              placeholder="Filter accounts..."
              value={accountQuery}
              onChange={(e) => setAccountQuery(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Grant role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAccounts && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading accounts…</TableCell></TableRow>
                )}
                {!loadingAccounts && filteredAccounts.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No accounts found.</TableCell></TableRow>
                )}
                {filteredAccounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.full_name || "Unnamed"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.email ?? "—"}<br />{a.phone ?? ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                        {a.roles.map((r) => <Badge key={r} className="gradient-primary text-primary-foreground">{r}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(v) => grantRole(a.id, v as AppRole)}>
                        <SelectTrigger className="w-36 ml-auto"><SelectValue placeholder="Grant…" /></SelectTrigger>
                        <SelectContent>
                          {(["admin", "landlord", "caretaker", "tenant"] as AppRole[])
                            .filter((r) => !a.roles.includes(r))
                            .map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="glow-card border-0 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Recent activity</h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto">
            {data.auditLog.slice(0, 25).map((e) => (
              <div key={e.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{e.action}</p>
                <p className="text-xs text-muted-foreground">{e.detail} — {e.actor} · {e.date.slice(0, 10)}</p>
              </div>
            ))}
            {data.auditLog.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
          </div>
        </Card>

        <Card className="glow-card border-0 p-5">
          <h2 className="font-heading text-lg font-bold mb-3">Jump to a dashboard</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/landlord"><Button variant="outline">Landlord</Button></Link>
            <Link to="/caretaker"><Button variant="outline">Caretaker</Button></Link>
            <Link to="/dashboard"><Button variant="outline">Tenant</Button></Link>
            <Link to="/finance"><Button variant="outline">Finance</Button></Link>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
