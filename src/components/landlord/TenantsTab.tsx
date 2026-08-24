import { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES, type PaymentMethod, type Tenant } from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "notice", label: "Notice" },
  { value: "moved_out", label: "Moved Out" },
];

const statusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  if (status === "active") return "default";
  if (status === "notice") return "secondary";
  return "outline";
};

function emptyForm() {
  return {
    name: "",
    nationalId: "",
    phone: "",
    email: "",
    isStudent: true,
    school: "",
    course: "",
    regNumber: "",
    yearOfStudy: 1,
    emergencyContactName: "",
    emergencyContactPhone: "",
    unitId: "",
    moveInDate: new Date().toISOString().slice(0, 10),
  };
}

export function TenantsTab() {
  const {
    tenants,
    properties,
    units,
    unitLabel,
    tenantLease,
    tenantBalance,
    tenantDeposit,
    tenantPayments,
    invoiceStates,
    tickets,
    addTenant,
    addLease,
    updateUnit,
    addInvoice,
    recordPayment,
    moveOutTenant,
  } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [damages, setDamages] = useState("");
  const [unpaidUtilities, setUnpaidUtilities] = useState("");

  const vacantUnits = useMemo(
    () => units.filter((u) => u.status === "vacant" || u.status === "reserved"),
    [units],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (propertyFilter !== "all" && t.propertyId !== propertyFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      const label = unitLabel(t.unitId).toLowerCase();
      return t.name.toLowerCase().includes(q) || t.phone.toLowerCase().includes(q) || label.includes(q);
    });
  }, [tenants, search, propertyFilter, statusFilter, unitLabel]);

  const resetForm = () => setForm(emptyForm());

  const handleAddTenant = () => {
    const unit = units.find((u) => u.id === form.unitId);
    if (!unit || !form.name || !form.phone) {
      toast({ title: "Missing information", description: "Please fill in name, phone and select a unit.", variant: "destructive" });
      return;
    }
    const tenant = addTenant({
      name: form.name,
      nationalId: form.nationalId,
      phone: form.phone,
      email: form.email,
      isStudent: form.isStudent,
      school: form.isStudent ? form.school : "",
      course: form.isStudent ? form.course : "",
      regNumber: form.isStudent ? form.regNumber : "",
      yearOfStudy: form.isStudent ? Number(form.yearOfStudy) : 0,
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
      unitId: unit.id,
      propertyId: unit.propertyId,
      moveInDate: form.moveInDate,
      status: "active",
    });

    const start = new Date(form.moveInDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    addLease({
      tenantId: tenant.id,
      unitId: unit.id,
      startDate: form.moveInDate,
      endDate: end.toISOString().slice(0, 10),
      rent: unit.rent,
      deposit: unit.deposit,
      paymentFrequency: "monthly",
      status: "active",
      signedAt: form.moveInDate,
    });

    updateUnit(unit.id, { status: "occupied" });

    const period = form.moveInDate.slice(0, 7);
    addInvoice({
      tenantId: tenant.id,
      unitId: unit.id,
      period,
      amount: unit.rent,
      penaltyAmount: 0,
      dueDate: `${period}-05`,
    });

    toast({ title: "Tenant added", description: `${tenant.name} has been added successfully.` });
    setAddOpen(false);
    resetForm();
  };

  const handleRecordPayment = () => {
    if (!selectedTenant) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    recordPayment({ tenantId: selectedTenant.id, amount, method: paymentMethod });
    toast({ title: "Payment recorded", description: formatKES(amount) });
    setPaymentAmount("");
  };

  const handleMoveOut = () => {
    if (!selectedTenant) return;
    moveOutTenant(selectedTenant.id, {
      damages: damages ? Number(damages) : undefined,
      unpaidUtilities: unpaidUtilities ? Number(unpaidUtilities) : undefined,
    });
    toast({ title: "Tenant moved out", description: selectedTenant.name });
    setMoveOutOpen(false);
    setSelectedTenant(null);
    setDamages("");
    setUnpaidUtilities("");
  };

  const selectedLease = selectedTenant ? tenantLease(selectedTenant.id) : undefined;
  const selectedDeposit = selectedTenant ? tenantDeposit(selectedTenant.id) : undefined;
  const selectedInvoices = selectedTenant ? invoiceStates(selectedTenant.id) : [];
  const selectedPayments = selectedTenant ? tenantPayments(selectedTenant.id) : [];
  const selectedTickets = selectedTenant ? tickets.filter((tk) => tk.unitId === selectedTenant.unitId) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Tenants</h2>
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">Add Tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>National ID</Label>
                  <Input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-2">
                <Label>Is Student?</Label>
                <Switch checked={form.isStudent} onCheckedChange={(v) => setForm({ ...form, isStudent: v })} />
              </div>

              {form.isStudent && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>School</Label>
                    <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Course</Label>
                    <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Reg Number</Label>
                    <Input value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Year of Study</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.yearOfStudy}
                      onChange={(e) => setForm({ ...form, yearOfStudy: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Unit</Label>
                  <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {vacantUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.label} — {formatKES(u.rent)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Move-in Date</Label>
                  <Input
                    type="date"
                    value={form.moveInDate}
                    onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button className="gradient-primary text-primary-foreground" onClick={handleAddTenant}>
                Add Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input placeholder="Search name, phone, unit..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const lease = tenantLease(t.id);
          const unit = units.find((u) => u.id === t.unitId);
          const rent = lease?.rent ?? unit?.rent ?? 0;
          const balance = tenantBalance(t.id);
          return (
            <Card
              key={t.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedTenant(t)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-foreground">{t.name}</span>
                      {t.isStudent && (
                        <Badge variant="secondary" className="text-xs">
                          Student
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{unitLabel(t.unitId)}</p>
                  </div>
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.phone}</p>
                {t.isStudent && (
                  <p className="text-xs text-muted-foreground">
                    {t.school} · {t.course} · Year {t.yearOfStudy}
                  </p>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rent: {formatKES(rent)}</span>
                  <span className={balance > 0 ? "font-medium text-destructive" : "font-medium text-success"}>
                    {formatKES(balance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No tenants found.</p>
        )}
      </div>

      <Sheet
        open={!!selectedTenant}
        onOpenChange={(o) => {
          if (!o) setSelectedTenant(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedTenant && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="font-heading flex items-center gap-2">
                  {selectedTenant.name}
                  {selectedTenant.isStudent && <Badge variant="secondary">Student</Badge>}
                </SheetTitle>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-foreground">{selectedTenant.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedTenant.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">National ID</p>
                  <p className="text-foreground">{selectedTenant.nationalId || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="text-foreground">{unitLabel(selectedTenant.unitId)}</p>
                </div>
                {selectedTenant.isStudent && (
                  <>
                    <div>
                      <p className="text-muted-foreground">School</p>
                      <p className="text-foreground">{selectedTenant.school}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course</p>
                      <p className="text-foreground">{selectedTenant.course}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reg Number</p>
                      <p className="text-foreground">{selectedTenant.regNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year of Study</p>
                      <p className="text-foreground">{selectedTenant.yearOfStudy}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-muted-foreground">Emergency Contact</p>
                  <p className="text-foreground">
                    {selectedTenant.emergencyContactName} ({selectedTenant.emergencyContactPhone})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Move-in Date</p>
                  <p className="text-foreground">{selectedTenant.moveInDate}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-heading mb-2 font-semibold text-foreground">Financial Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border p-2">
                    <p className="text-muted-foreground">Balance</p>
                    <p
                      className={
                        tenantBalance(selectedTenant.id) > 0
                          ? "font-semibold text-destructive"
                          : "font-semibold text-success"
                      }
                    >
                      {formatKES(tenantBalance(selectedTenant.id))}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-2">
                    <p className="text-muted-foreground">Deposit</p>
                    {selectedDeposit ? (
                      <>
                        <p className="font-semibold text-foreground">{formatKES(selectedDeposit.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedDeposit.status} · deductions{" "}
                          {formatKES(selectedDeposit.deductions.reduce((s, d) => s + d.amount, 0))}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No deposit</p>
                    )}
                  </div>
                </div>
                {selectedLease && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Lease: {selectedLease.startDate} → {selectedLease.endDate} · {formatKES(selectedLease.rent)}/
                    {selectedLease.paymentFrequency}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-heading mb-2 font-semibold text-foreground">Invoices</h3>
                <div className="space-y-2">
                  {selectedInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                      <div>
                        <p className="text-foreground">{inv.period}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatKES(inv.paidAmount)} / {formatKES(inv.amount + inv.penaltyAmount)}
                        </p>
                      </div>
                      <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                  {selectedInvoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices.</p>}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-heading mb-2 font-semibold text-foreground">Payment History</h3>
                <div className="space-y-2">
                  {selectedPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                      <div>
                        <p className="text-foreground">{p.date.slice(0, 10)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.method} · {p.receiptNo}
                        </p>
                      </div>
                      <span className="font-medium text-foreground">{formatKES(p.amount)}</span>
                    </div>
                  ))}
                  {selectedPayments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-heading mb-2 font-semibold text-foreground">Maintenance Tickets</h3>
                <div className="space-y-2">
                  {selectedTickets.map((tk) => (
                    <div key={tk.id} className="rounded-md border border-border p-2 text-sm">
                      <p className="text-foreground">{tk.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {tk.category} · {tk.status}
                      </p>
                    </div>
                  ))}
                  {selectedTickets.length === 0 && <p className="text-sm text-muted-foreground">No tickets.</p>}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-heading mb-2 font-semibold text-foreground">Record Payment</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="sm:w-40">
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
                  <Button className="gradient-primary text-primary-foreground" onClick={handleRecordPayment}>
                    Record
                  </Button>
                </div>
              </div>

              <Separator />

              {!moveOutOpen ? (
                <Button variant="destructive" onClick={() => setMoveOutOpen(true)} disabled={selectedTenant.status === "moved_out"}>
                  Move Out
                </Button>
              ) : (
                <div className="space-y-2 rounded-md border border-destructive/50 p-3">
                  <p className="text-sm font-medium text-foreground">Confirm move out for {selectedTenant.name}?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Damages (KES)</Label>
                      <Input type="number" value={damages} onChange={(e) => setDamages(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Unpaid Utilities (KES)</Label>
                      <Input type="number" value={unpaidUtilities} onChange={(e) => setUnpaidUtilities(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setMoveOutOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleMoveOut}>
                      Confirm Move Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
