import React, { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Building2,
  Home,
  Users,
  DoorOpen,
  DoorClosed,
  Wrench,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Receipt,
  Percent,
  KeyRound,
} from "lucide-react";

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({
  label,
  value,
  icon: Icon,
}) => (
  <Card>
    <CardContent className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-xl font-heading font-semibold text-foreground">{value}</span>
    </CardContent>
  </Card>
);

const HeroStat: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="flex flex-col items-center gap-1 p-3 text-center">
    <Icon className="h-5 w-5 text-primary" />
    <span className="text-2xl md:text-3xl font-heading font-bold text-foreground">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const severityBorder: Record<string, string> = {
  critical: "border-destructive text-destructive",
  warning: "border-warning text-warning",
  info: "border-info text-info",
};

export const OverviewTab: React.FC = () => {
  const {
    properties,
    buildings,
    units,
    financeStats,
    occupancyStats,
    monthlySeries,
    smartAlerts,
    propertyComparison,
  } = useData();

  const [propertyId, setPropertyId] = useState<string>("all");
  const filterId = propertyId === "all" ? undefined : propertyId;

  const finance = financeStats(filterId);
  const occupancy = occupancyStats(filterId);
  const series = monthlySeries(6);
  const alerts = smartAlerts();
  const comparison = propertyComparison();

  const occupancyDonut = useMemo(
    () => [
      { name: "Occupied", value: occupancy.occupied, color: "var(--color-chart-1)" },
      { name: "Vacant", value: occupancy.vacant, color: "var(--color-chart-2)" },
      { name: "Reserved", value: occupancy.reserved, color: "var(--color-chart-3)" },
      { name: "Maintenance", value: occupancy.maintenance, color: "var(--color-chart-4)" },
    ],
    [occupancy],
  );

  const totalUnits = filterId ? units.filter((u) => u.propertyId === filterId).length : units.length;
  const totalBuildings = filterId
    ? buildings.filter((b) => b.propertyId === filterId).length
    : buildings.length;
  const totalProperties = filterId ? 1 : properties.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-heading font-bold text-foreground">Property Overview</h2>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-border">
            <HeroStat label="Occupancy Rate" value={`${occupancy.rate}%`} icon={Percent} />
            <HeroStat label="Collection Rate" value={`${finance.collectionRate}%`} icon={ShieldCheck} />
            <HeroStat label="Outstanding Rent" value={formatKES(finance.outstanding)} icon={Wallet} />
            <HeroStat label="Open Tickets" value={String(finance.openTickets)} icon={Wrench} />
            <HeroStat label="Vacant Units" value={String(occupancy.vacant)} icon={DoorOpen} />
            <HeroStat label="Leases Expiring" value={String(finance.leasesExpiringSoon)} icon={Calendar} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Properties" value={String(totalProperties)} icon={Building2} />
        <StatCard label="Buildings" value={String(totalBuildings)} icon={Home} />
        <StatCard label="Units" value={String(totalUnits)} icon={KeyRound} />
        <StatCard label="Occupied" value={String(occupancy.occupied)} icon={DoorClosed} />
        <StatCard label="Vacant" value={String(occupancy.vacant)} icon={DoorOpen} />
        <StatCard label="Reserved" value={String(occupancy.reserved)} icon={Calendar} />
        <StatCard label="Under Maintenance" value={String(occupancy.maintenance)} icon={Wrench} />
        <StatCard label="Active Tenants" value={String(finance.activeTenants)} icon={Users} />
        <StatCard label="Expected Rent (mo.)" value={formatKES(finance.expectedThisMonth)} icon={Wallet} />
        <StatCard label="Collected This Month" value={formatKES(finance.collectedThisMonth)} icon={TrendingUp} />
        <StatCard label="Outstanding" value={formatKES(finance.outstanding)} icon={AlertTriangle} />
        <StatCard label="Overdue" value={formatKES(finance.overdue)} icon={AlertTriangle} />
        <StatCard label="Security Deposits Held" value={formatKES(finance.depositsHeld)} icon={ShieldCheck} />
        <StatCard label="Expenses (mo.)" value={formatKES(finance.expensesThisMonth)} icon={Receipt} />
        <StatCard label="Net Income" value={formatKES(finance.netIncome)} icon={TrendingDown} />
        <StatCard label="Collection Rate" value={`${finance.collectionRate}%`} icon={Percent} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Legend />
                <Bar dataKey="income" fill="var(--color-chart-1)" name="Income" />
                <Bar dataKey="expenses" fill="var(--color-chart-2)" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Occupancy</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyDonut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {occupancyDonut.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Net Income Trend</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.map((s) => ({ month: s.month, net: s.income - s.expenses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Line type="monotone" dataKey="net" stroke="var(--color-chart-3)" strokeWidth={2} name="Net Income" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Action Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts right now. All good!</p>}
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`border-l-4 pl-3 py-2 text-sm bg-muted/40 rounded ${severityBorder[a.severity] ?? ""}`}
            >
              {a.message}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Property Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">Property</th>
                  <th className="py-2 pr-2">Occupancy</th>
                  <th className="py-2 pr-2">Income</th>
                  <th className="py-2 pr-2">Expenses</th>
                  <th className="py-2 pr-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.property.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">{row.property.name}</td>
                    <td className="py-2 pr-2">{row.occupancy}%</td>
                    <td className="py-2 pr-2">{formatKES(row.income)}</td>
                    <td className="py-2 pr-2">{formatKES(row.expenses)}</td>
                    <td className={`py-2 pr-2 font-medium ${row.profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatKES(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
