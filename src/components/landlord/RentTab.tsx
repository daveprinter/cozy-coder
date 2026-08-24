import { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES, type InvoiceState, type InvoiceStatus, type PaymentMethod } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "text-success",
  partial: "text-warning",
  unpaid: "text-muted-foreground",
  overdue: "text-destructive",
  waived: "text-info",
  disputed: "text-info",
};

const currentPeriod = () => new Date().toISOString().slice(0, 7);

interface Row {
  tenantId: string;
  tenantName: string;
  unitLabel: string;
  inv: InvoiceState;
}

export function RentTab() {
  const { tenants, invoiceStates, unitLabel, getTenant, tenantUnit, arrears, financeStats, waiveInvoice, recordPayment } =
    useData();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payDialogTenant, setPayDialogTenant] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [reference, setReference] = useState("");

  const stats = financeStats();
  const period = currentPeriod();

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const t of tenants.filter((t) => t.status === "active")) {
      const invs = invoiceStates(t.id).filter((i) => i.period === period);
      for (const inv of invs) {
        out.push({ tenantId: t.id, tenantName: t.name, unitLabel: unitLabel(inv.unitId), inv });
      }
    }
    return out.filter((r) => statusFilter === "all" || r.inv.status === statusFilter);
  }, [tenants, invoiceStates, unitLabel, period, statusFilter]);

  const arrearsList = arrears();

  const openPayDialog = (tenantId: string, prefill: number) => {
    setPayDialogTenant(tenantId);
    setAmount(String(prefill));
    setMethod("mpesa");
    setReference("");
  };

  const submitPayment = () => {
    if (!payDialogTenant || !amount) return;
    recordPayment({ tenantId: payDialogTenant, amount: Number(amount), method, reference });
    toast({ title: "Payment recorded" });
    setPayDialogTenant(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Expected This Month</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading">{formatKES(stats.expectedThisMonth)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading text-success">{formatKES(stats.collectedThisMonth)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading text-warning">{formatKES(stats.outstanding)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-heading text-destructive">{formatKES(stats.overdue)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Collection Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={stats.collectionRate} />
          <p className="text-sm text-muted-foreground">{stats.collectionRate}% collected this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base">Current Period Invoices</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.inv.id}>
                    <TableCell>{r.tenantName}</TableCell>
                    <TableCell>{r.unitLabel}</TableCell>
                    <TableCell>
                      {formatKES(r.inv.amount)}
                      {r.inv.penaltyAmount > 0 && (
                        <span className="text-destructive text-xs ml-1">+{formatKES(r.inv.penaltyAmount)}</span>
                      )}
                    </TableCell>
                    <TableCell>{formatKES(r.inv.paidAmount)}</TableCell>
                    <TableCell>{r.inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[r.inv.status]}>
                        {r.inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(r.inv.status === "unpaid" || r.inv.status === "overdue") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            waiveInvoice(r.inv.id);
                            toast({ title: "Invoice waived" });
                          }}
                        >
                          Waive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found.
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
          <CardTitle className="font-heading text-base">Arrears</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Owed</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrearsList.map((a) => (
                  <TableRow key={a.tenant.id}>
                    <TableCell>{a.tenant.name}</TableCell>
                    <TableCell>{a.unit?.label ?? "—"}</TableCell>
                    <TableCell className="text-destructive font-bold">{formatKES(a.amountOwed)}</TableCell>
                    <TableCell>{a.daysOverdue}</TableCell>
                    <TableCell>{a.lastPaymentDate ?? "—"}</TableCell>
                    <TableCell>{a.tenant.phone}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog
                        open={payDialogTenant === a.tenant.id}
                        onOpenChange={(o) => (o ? openPayDialog(a.tenant.id, a.amountOwed) : setPayDialogTenant(null))}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="gradient-primary text-primary-foreground">
                            Record Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-heading">Record Payment — {a.tenant.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>Amount</Label>
                              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <div>
                              <Label>Method</Label>
                              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                                  <SelectItem value="bank">Bank</SelectItem>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="card">Card</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Reference</Label>
                              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="gradient-primary text-primary-foreground" onClick={submitPayment}>
                              Save Payment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-60"
                        onClick={() => toast({ title: "Reminder queued (SMS integration coming soon)" })}
                      >
                        Send Reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {arrearsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tenants in arrears.
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
