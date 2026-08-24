import { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { EXPENSE_CATEGORIES, formatKES } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentPeriod = () => todayISO().slice(0, 7);

export function ExpensesTab() {
  const { properties, units, expenses, meterReadings, financeStats, addExpense, addMeterReading, getProperty } =
    useData();

  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [expPropertyId, setExpPropertyId] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [payee, setPayee] = useState("");

  const [unitId, setUnitId] = useState("");
  const [meterType, setMeterType] = useState<"water" | "electricity">("water");
  const [previous, setPrevious] = useState("");
  const [current, setCurrent] = useState("");
  const [meterDate, setMeterDate] = useState(todayISO());
  const [cost, setCost] = useState("");

  const stats = financeStats();
  const totalAllTime = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const monthExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(currentPeriod())), [expenses]);

  const topCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  }, [monthExpenses]);

  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return [...map.entries()].map(([category, amount]) => ({ category, amount }));
  }, [monthExpenses]);

  const filteredExpenses = useMemo(
    () =>
      [...expenses]
        .filter((e) => propertyFilter === "all" || e.propertyId === propertyFilter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, propertyFilter],
  );

  const submitExpense = () => {
    if (!expPropertyId || !description || !amount) return;
    addExpense({ propertyId: expPropertyId, category, description, amount: Number(amount), date, payee });
    setAddOpen(false);
    setExpPropertyId("");
    setDescription("");
    setAmount("");
    setDate(todayISO());
    setPayee("");
  };

  const unitsByProperty = useMemo(() => {
    const map = new Map<string, typeof units>();
    for (const p of properties) map.set(p.id, units.filter((u) => u.propertyId === p.id));
    return map;
  }, [properties, units]);

  const recalcCost = (prev: string, curr: string, type: "water" | "electricity") => {
    const p = Number(prev) || 0;
    const c = Number(curr) || 0;
    const rate = type === "water" ? 50 : 30;
    setCost(String(Math.max(0, (c - p) * rate)));
  };

  const submitMeter = () => {
    if (!unitId || !previous || !current) return;
    addMeterReading({
      unitId,
      type: meterType,
      previous: Number(previous),
      current: Number(current),
      date: meterDate,
      cost: Number(cost) || 0,
    });
    setUnitId("");
    setPrevious("");
    setCurrent("");
    setCost("");
    setMeterDate(todayISO());
  };

  const recentReadings = useMemo(
    () => [...meterReadings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [meterReadings],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">This Month's Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading">{formatKES(stats.expensesThisMonth)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Total (All Time)</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading">{formatKES(totalAllTime)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Top Category</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading">{topCategory}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-heading text-base">Expenses</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">Add Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Property</Label>
                    <Select value={expPropertyId} onValueChange={setExpPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Payee</Label>
                    <Input value={payee} onChange={(e) => setPayee(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="gradient-primary text-primary-foreground" onClick={submitExpense}>
                    Save Expense
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{getProperty(e.propertyId)?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{formatKES(e.amount)}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.payee ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Expenses by Category (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Meter Readings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <div key={p.id}>
                      {(unitsByProperty.get(p.id) ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>{p.name} — {u.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={meterType}
                onValueChange={(v) => {
                  const t = v as "water" | "electricity";
                  setMeterType(t);
                  recalcCost(previous, current, t);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={meterDate} onChange={(e) => setMeterDate(e.target.value)} />
            </div>
            <div>
              <Label>Previous</Label>
              <Input
                type="number"
                value={previous}
                onChange={(e) => {
                  setPrevious(e.target.value);
                  recalcCost(e.target.value, current, meterType);
                }}
              />
            </div>
            <div>
              <Label>Current</Label>
              <Input
                type="number"
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  recalcCost(previous, e.target.value, meterType);
                }}
              />
            </div>
            <div>
              <Label>Cost</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button className="gradient-primary text-primary-foreground" onClick={submitMeter}>
                Add Reading
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Previous → Current</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReadings.map((r) => {
                  const u = units.find((u) => u.id === r.unitId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{u?.label ?? "—"}</TableCell>
                      <TableCell className="capitalize">{r.type}</TableCell>
                      <TableCell>{r.previous} → {r.current}</TableCell>
                      <TableCell>{r.current - r.previous}</TableCell>
                      <TableCell>{formatKES(r.cost)}</TableCell>
                      <TableCell>{r.date}</TableCell>
                    </TableRow>
                  );
                })}
                {recentReadings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No meter readings yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
