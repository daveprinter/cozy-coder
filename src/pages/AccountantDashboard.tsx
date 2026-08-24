import React, { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/lib/domain/DataContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Building2, LogOut, Download, Wallet, TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";

const money = (n: number) => `KSh ${Math.round(n).toLocaleString()}`;

const toCsv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

const download = (name: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const AccountantDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const data = useData();
  const [query, setQuery] = useState("");

  const stats = data.financeStats();
  const series = data.monthlySeries(6);
  const comparison = data.propertyComparison();
  const arrears = data.arrears();

  const ledger = useMemo(() => {
    const rows = [
      ...data.payments.map((p) => ({
        id: p.id,
        date: p.date.slice(0, 10),
        kind: "Income" as const,
        label: `${data.getTenant(p.tenantId)?.fullName ?? "Tenant"} — ${p.method}`,
        ref: p.receiptNo,
        amount: p.amount,
      })),
      ...data.expenses.map((e) => ({
        id: e.id,
        date: e.date.slice(0, 10),
        kind: "Expense" as const,
        label: `${e.category} — ${e.description}`,
        ref: e.payee ?? "—",
        amount: -e.amount,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.label} ${r.ref} ${r.kind}`.toLowerCase().includes(q)) : rows;
  }, [data, query]);

  const exportLedger = () => {
    download(
      "nyumbalink-ledger.csv",
      toCsv([
        ["Date", "Type", "Description", "Reference", "Amount"],
        ...ledger.map((r) => [r.date, r.kind, r.label, r.ref, r.amount]),
      ]),
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const kpis = [
    { label: "Collected this month", value: money(stats.collectedThisMonth), icon: Wallet },
    { label: "Expected this month", value: money(stats.expectedThisMonth), icon: TrendingUp },
    { label: "Expenses this month", value: money(stats.expensesThisMonth), icon: TrendingDown },
    { label: "Outstanding arrears", value: money(stats.outstanding), icon: AlertTriangle },
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
          <h1 className="font-heading text-xl font-bold">Finance Dashboard</h1>
          <p className="text-primary-foreground/80 text-sm">Income, expenses and collections across the portfolio</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="font-heading text-lg font-bold mb-4">Income vs expenses (6 months)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glow-card border-0 p-5">
          <h2 className="font-heading text-lg font-bold mb-4">Profit & loss by property</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Occupancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((c) => (
                <TableRow key={c.property.id}>
                  <TableCell className="font-medium">{c.property.name}</TableCell>
                  <TableCell className="text-right">{money(c.income)}</TableCell>
                  <TableCell className="text-right">{money(c.expenses)}</TableCell>
                  <TableCell className={`text-right font-semibold ${c.profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {money(c.profit)}
                  </TableCell>
                  <TableCell className="text-right">{Math.round(c.occupancy)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glow-card border-0 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-heading text-lg font-bold">Ledger</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search transactions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-56"
              />
              <Button onClick={exportLedger} className="gradient-primary text-primary-foreground gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.slice(0, 100).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.kind}</TableCell>
                    <TableCell>{r.label}</TableCell>
                    <TableCell>{r.ref}</TableCell>
                    <TableCell className={`text-right font-medium ${r.amount >= 0 ? "text-success" : "text-destructive"}`}>
                      {money(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="glow-card border-0 p-5">
          <h2 className="font-heading text-lg font-bold mb-4">Arrears watchlist</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead className="text-right">Days overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrears.slice(0, 20).map((a) => (
                <TableRow key={a.tenant.id}>
                  <TableCell className="font-medium">{a.tenant.fullName}</TableCell>
                  <TableCell>{a.unit?.unitNumber ?? "—"}</TableCell>
                  <TableCell className="text-right text-destructive font-semibold">{money(a.amountOwed)}</TableCell>
                  <TableCell className="text-right">{a.daysOverdue}</TableCell>
                </TableRow>
              ))}
              {arrears.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No arrears — everyone is up to date.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
};

export default AccountantDashboard;
