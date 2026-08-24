import React, { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

type Period = "this_month" | "last_month" | "last_3_months";

function periodPrefixes(period: Period): string[] {
  const now = new Date();
  const monthsBack = period === "this_month" ? [0] : period === "last_month" ? [1] : [0, 1, 2];
  return monthsBack.map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  });
}

function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const ReportsTab: React.FC = () => {
  const {
    properties,
    tenants,
    payments,
    expenses,
    tickets,
    arrears,
    maintenanceByCategory,
    financeStats,
    monthlySeries,
    getUnit,
  } = useData();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>("this_month");
  const prefixes = periodPrefixes(period);
  const inPeriod = (dateStr: string) => prefixes.some((p) => dateStr.startsWith(p));

  const filteredPayments = useMemo(() => payments.filter((p) => inPeriod(p.date)), [payments, period]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => inPeriod(e.date)), [expenses, period]);

  const totalIncome = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const perProperty = properties.map((prop) => {
    const propTenantIds = new Set(tenants.filter((t) => t.propertyId === prop.id).map((t) => t.id));
    const income = filteredPayments.filter((p) => propTenantIds.has(p.tenantId)).reduce((s, p) => s + p.amount, 0);
    const propExpenses = filteredExpenses.filter((e) => e.propertyId === prop.id).reduce((s, e) => s + e.amount, 0);
    return { property: prop, income, expenses: propExpenses, net: income - propExpenses };
  });

  const rentCollection = properties.map((prop) => {
    const stats = financeStats(prop.id);
    return { property: prop, expected: stats.expectedThisMonth, collected: stats.collectedThisMonth, rate: stats.collectionRate };
  });

  const arrearsList = arrears();
  const arrearsTotal = arrearsList.reduce((s, a) => s + a.amountOwed, 0);

  const maintenanceTicketSpend = tickets
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + (t.actualCost ?? 0), 0);
  const maintenanceExpenseSpend = expenses
    .filter((e) => ["Repairs", "Maintenance"].includes(e.category))
    .reduce((s, e) => s + e.amount, 0);
  const totalMaintenanceSpend = maintenanceTicketSpend + maintenanceExpenseSpend;
  const maintenanceCategories = maintenanceByCategory();

  const finance = financeStats();
  const monthPoint = monthlySeries(1)[0];
  const overallOccupancyRate = useMemo(() => {
    // aggregate occupancy across properties via financeStats has no occupancy; use rentCollection average as proxy not required
    return null;
  }, []);

  const exportTenantsCSV = () => {
    const rows: (string | number)[][] = [
      ["Name", "Phone", "Email", "Property", "Unit", "Status", "Move In", "School"],
      ...tenants.map((t) => [
        t.name,
        t.phone,
        t.email,
        properties.find((p) => p.id === t.propertyId)?.name ?? "",
        getUnit(t.unitId ?? "")?.label ?? "",
        t.status,
        t.moveInDate,
        t.school,
      ]),
    ];
    downloadCSV("tenants.csv", toCSV(rows));
    toast({ title: "Export complete", description: "Tenants CSV downloaded." });
  };

  const exportPaymentsCSV = () => {
    const rows: (string | number)[][] = [
      ["Receipt No", "Tenant", "Amount", "Date", "Method", "Reference"],
      ...payments.map((p) => [
        p.receiptNo,
        tenants.find((t) => t.id === p.tenantId)?.name ?? "",
        p.amount,
        p.date,
        p.method,
        p.reference,
      ]),
    ];
    downloadCSV("payments.csv", toCSV(rows));
    toast({ title: "Export complete", description: "Payments CSV downloaded." });
  };

  const exportExpensesCSV = () => {
    const rows: (string | number)[][] = [
      ["Property", "Category", "Description", "Amount", "Date", "Payee"],
      ...expenses.map((e) => [
        properties.find((p) => p.id === e.propertyId)?.name ?? "",
        e.category,
        e.description,
        e.amount,
        e.date,
        e.payee ?? "",
      ]),
    ];
    downloadCSV("expenses.csv", toCSV(rows));
    toast({ title: "Export complete", description: "Expenses CSV downloaded." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-heading font-bold text-foreground">Reports & Exports</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Profit & Loss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-xl font-heading font-semibold text-success">{formatKES(totalIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-heading font-semibold text-destructive">{formatKES(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-xl font-heading font-semibold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatKES(netProfit)}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">Property</th>
                  <th className="py-2 pr-2">Income</th>
                  <th className="py-2 pr-2">Expenses</th>
                  <th className="py-2 pr-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {perProperty.map((row) => (
                  <tr key={row.property.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">{row.property.name}</td>
                    <td className="py-2 pr-2">{formatKES(row.income)}</td>
                    <td className="py-2 pr-2">{formatKES(row.expenses)}</td>
                    <td className={`py-2 pr-2 font-medium ${row.net >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatKES(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Rent Collection Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rentCollection.map((row) => (
            <div key={row.property.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">{row.property.name}</span>
                <span className="text-muted-foreground">
                  {formatKES(row.collected)} / {formatKES(row.expected)} ({row.rate}%)
                </span>
              </div>
              <Progress value={row.rate} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Arrears Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">Tenant</th>
                  <th className="py-2 pr-2">Unit</th>
                  <th className="py-2 pr-2">Amount Owed</th>
                  <th className="py-2 pr-2">Days Overdue</th>
                  <th className="py-2 pr-2">Last Payment</th>
                  <th className="py-2 pr-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {arrearsList.map((a) => (
                  <tr key={a.tenant.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground">{a.tenant.name}</td>
                    <td className="py-2 pr-2">{a.unit?.label ?? "—"}</td>
                    <td className="py-2 pr-2 text-destructive font-medium">{formatKES(a.amountOwed)}</td>
                    <td className="py-2 pr-2">{a.daysOverdue}</td>
                    <td className="py-2 pr-2">{a.lastPaymentDate ? new Date(a.lastPaymentDate).toLocaleDateString() : "—"}</td>
                    <td className="py-2 pr-2">{a.tenant.phone}</td>
                  </tr>
                ))}
                {arrearsList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No arrears — all tenants are up to date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Maintenance Cost Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Total Maintenance Spend:{" "}
            <span className="text-foreground font-semibold">{formatKES(totalMaintenanceSpend)}</span>
          </p>
          <div className="space-y-2">
            {maintenanceCategories.map((c) => (
              <div key={c.category} className="flex justify-between text-sm border-b border-border/50 pb-1">
                <span className="text-foreground">{c.category}</span>
                <span className="text-muted-foreground">{c.count} ticket{c.count === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading text-base">Your Property Monthly Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-heading font-semibold text-success">{formatKES(monthPoint?.income ?? 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expenses</p>
              <p className="font-heading font-semibold text-destructive">{formatKES(monthPoint?.expenses ?? 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net</p>
              <p className="font-heading font-semibold text-foreground">
                {formatKES((monthPoint?.income ?? 0) - (monthPoint?.expenses ?? 0))}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Collection Rate</p>
              <p className="font-heading font-semibold text-foreground">{finance.collectionRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Maintenance Spend</p>
              <p className="font-heading font-semibold text-foreground">{formatKES(totalMaintenanceSpend)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Arrears Total</p>
              <p className="font-heading font-semibold text-destructive">{formatKES(arrearsTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">New Tenants</p>
              <p className="font-heading font-semibold text-foreground">{finance.newTenantsThisMonth}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Move-Outs</p>
              <p className="font-heading font-semibold text-foreground">{finance.moveOutsThisMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Export Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="gradient-primary text-primary-foreground" onClick={exportTenantsCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Tenants CSV
          </Button>
          <Button className="gradient-primary text-primary-foreground" onClick={exportPaymentsCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Payments CSV
          </Button>
          <Button className="gradient-primary text-primary-foreground" onClick={exportExpensesCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Expenses CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
