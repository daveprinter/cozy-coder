import { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES, type Payment, type PaymentMethod } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const todayISO = () => new Date().toISOString().slice(0, 10);

export function PaymentsTab() {
  const { tenants, payments, getTenant, unitLabel, getUnit, getProperty, tenantBalance, recordPayment } = useData();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");

  const activeTenants = tenants.filter((t) => t.status === "active");

  const resetForm = () => {
    setTenantId("");
    setAmount("");
    setMethod("mpesa");
    setReference("");
    setNote("");
  };

  const submit = () => {
    if (!tenantId || !amount) return;
    const p = recordPayment({ tenantId, amount: Number(amount), method, reference, note });
    toast({ title: "Payment recorded" });
    setAddOpen(false);
    resetForm();
    setReceiptPayment(p);
  };

  const sorted = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date)), [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => {
      const tenant = getTenant(p.tenantId);
      return (
        tenant?.name.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    });
  }, [sorted, search, getTenant]);

  const todaysTotal = payments.filter((p) => p.date.startsWith(todayISO())).reduce((s, p) => s + p.amount, 0);

  const renderReceipt = (p: Payment) => {
    const unit = getUnit(p.unitId);
    const property = unit ? getProperty(unit.propertyId) : undefined;
    const tenant = getTenant(p.tenantId);
    const balance = tenantBalance(p.tenantId);
    return (
      <div className="space-y-3 text-sm">
        <div className="text-center space-y-1">
          <p className="font-heading text-lg">{property?.name ?? "NyumbaLink"}</p>
          <p className="text-muted-foreground">Payment Receipt</p>
        </div>
        <Separator className="border-dashed" />
        <div className="flex justify-between"><span className="text-muted-foreground">Receipt No.</span><span>{p.receiptNo}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Tenant</span><span>{tenant?.name ?? "—"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span>{unitLabel(p.unitId)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(p.date).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{p.method}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span>{p.reference || "—"}</span></div>
        <Separator className="border-dashed" />
        <div className="flex justify-between text-base font-heading"><span>Amount</span><span>{formatKES(p.amount)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Remaining Balance</span><span>{formatKES(balance)}</span></div>
        <Separator className="border-dashed" />
        <div className="flex justify-between"><span className="text-muted-foreground">Received by</span><span>{p.receivedBy}</span></div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading">Payments & Receipts</h2>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — Bal {formatKES(tenantBalance(t.id))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div>
                <Label>Note</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button className="gradient-primary text-primary-foreground" onClick={submit}>
                Save & Get Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">All Payments</CardTitle>
          <Input
            placeholder="Search by tenant, receipt no, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Received By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setReceiptPayment(p)}>
                    <TableCell>{p.receiptNo}</TableCell>
                    <TableCell>{getTenant(p.tenantId)?.name ?? "—"}</TableCell>
                    <TableCell>{unitLabel(p.unitId)}</TableCell>
                    <TableCell>{formatKES(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{p.method}</Badge>
                    </TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                    <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                    <TableCell>{p.receivedBy}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{filtered.length} payments</span>
            <span>Total: {formatKES(filtered.reduce((s, p) => s + p.amount, 0))}</span>
            <span>Today's Collection: {formatKES(todaysTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!receiptPayment} onOpenChange={(o) => !o && setReceiptPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Receipt</DialogTitle>
          </DialogHeader>
          {receiptPayment && renderReceipt(receiptPayment)}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => setReceiptPayment(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
