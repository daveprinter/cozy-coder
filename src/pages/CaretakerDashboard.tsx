import React, { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/lib/domain/DataContext";
import {
  formatKES,
  UNIT_STATUS_LABELS,
  UNIT_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  MAINTENANCE_CATEGORIES,
  COMPLAINT_CATEGORIES,
  type UnitStatus,
  type TicketStatus,
  type Priority,
  type PaymentMethod,
} from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, LogOut, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CHECKLIST_ITEMS = [
  { id: "cleaning", label: "Cleaning" },
  { id: "water_tank", label: "Water Tank Checking" },
  { id: "security", label: "Security Checking" },
];

const TABS = [
  { id: "today", label: "Today" },
  { id: "units", label: "Units" },
  { id: "tenants", label: "Tenants" },
  { id: "maintenance", label: "Maintenance" },
  { id: "inspections", label: "Inspections" },
  { id: "meters", label: "Meters" },
  { id: "visitors", label: "Visitors" },
  { id: "notices", label: "Notices" },
  { id: "complaints", label: "Complaints" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const todayISO = () => new Date().toISOString().slice(0, 10);

const priorityColor = (p: Priority | string) =>
  p === "urgent" || p === "emergency"
    ? "bg-destructive/10 text-destructive"
    : p === "high"
    ? "bg-warning/10 text-warning"
    : p === "normal"
    ? "bg-info/10 text-info"
    : "bg-muted text-muted-foreground";

const CaretakerDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const data = useData();
  const {
    units,
    tenants,
    tickets,
    inspections,
    meterReadings,
    visitors,
    announcements,
    complaints,
    getTenant,
    getUnit,
    unitLabel,
    tenantBalance,
    occupancyStats,
    arrears,
    updateUnit,
    recordPayment,
    addTicket,
    updateTicket,
    addInspection,
    addMeterReading,
    addVisitor,
    checkoutVisitor,
    addAnnouncement,
    updateComplaint,
    logAudit,
  } = data;

  const [tab, setTab] = useState<Tab>("today");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const toggleChecklist = (id: string, label: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [id]: checked }));
    if (checked) {
      logAudit("Caretaker", "Checklist", `${label} completed`);
      toast({ title: "Checklist updated", description: `${label} marked complete.` });
    }
  };

  const activeTenants = tenants.filter((t) => t.status !== "moved_out");

  // ---------------- Today ----------------
  const occ = occupancyStats();
  const todayStr = todayISO();
  const todaysPayments = data.payments.filter((p) => p.date.startsWith(todayStr));
  const todaysTotal = todaysPayments.reduce((s, p) => s + p.amount, 0);
  const arrearsList = arrears();
  const openTickets = tickets.filter((t) => !["completed", "rejected", "cancelled"].includes(t.status));

  // ---------------- Units grouped by building ----------------
  const unitsByBuilding = useMemo(() => {
    const map = new Map<string, typeof units>();
    for (const u of units) {
      const key = u.buildingId;
      if (!map.has(key)) map.set(key, [] as any);
      map.get(key)!.push(u);
    }
    return map;
  }, [units]);

  // ---------------- Payment dialog ----------------
  const [paymentTenantId, setPaymentTenantId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [paymentRef, setPaymentRef] = useState("");

  const openPaymentDialog = (tenantId: string) => {
    setPaymentTenantId(tenantId);
    setPaymentAmount(String(Math.max(0, tenantBalance(tenantId))));
    setPaymentMethod("mpesa");
    setPaymentRef("");
  };

  const submitPayment = () => {
    if (!paymentTenantId || !paymentAmount) return;
    const payment = recordPayment(
      { tenantId: paymentTenantId, amount: Number(paymentAmount), method: paymentMethod, reference: paymentRef },
      "Caretaker",
    );
    toast({ title: "Payment recorded", description: `Receipt ${payment.receiptNo}` });
    setPaymentTenantId(null);
  };

  // ---------------- New ticket dialog ----------------
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketUnitId, setTicketUnitId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketCategory, setTicketCategory] = useState(MAINTENANCE_CATEGORIES[0]);
  const [ticketPriority, setTicketPriority] = useState<Priority>("normal");
  const [ticketDesc, setTicketDesc] = useState("");

  const submitTicket = () => {
    const unit = getUnit(ticketUnitId);
    if (!unit || !ticketTitle) return;
    const ticket = addTicket({
      unitId: ticketUnitId,
      propertyId: unit.propertyId,
      title: ticketTitle,
      category: ticketCategory,
      priority: ticketPriority,
      description: ticketDesc,
      status: "new",
    });
    toast({ title: "Ticket created", description: ticket.number });
    setTicketOpen(false);
    setTicketTitle("");
    setTicketDesc("");
  };

  const advanceTicket = (id: string, status: TicketStatus) => {
    updateTicket(id, { status }, "Caretaker");
    toast({ title: "Ticket updated", description: TICKET_STATUS_LABELS[status] });
  };

  const nextTicketStatus: Partial<Record<TicketStatus, TicketStatus>> = {
    new: "assigned",
    assigned: "in_progress",
    in_progress: "completed",
    waiting_parts: "in_progress",
  };

  // ---------------- Inspection form ----------------
  const [inspUnitId, setInspUnitId] = useState("");
  const [inspType, setInspType] = useState<
    "move_in" | "move_out" | "routine" | "emergency" | "safety" | "maintenance"
  >("routine");
  const [inspCondition, setInspCondition] = useState<"excellent" | "good" | "fair" | "poor">("good");
  const [inspNotes, setInspNotes] = useState("");
  const [inspDate, setInspDate] = useState(todayStr);

  const submitInspection = () => {
    if (!inspUnitId) return;
    addInspection({
      unitId: inspUnitId,
      type: inspType,
      date: inspDate,
      inspector: "Caretaker",
      condition: inspCondition,
      notes: inspNotes,
    });
    toast({ title: "Inspection logged" });
    setInspNotes("");
  };

  // ---------------- Meter reading form ----------------
  const [meterUnitId, setMeterUnitId] = useState("");
  const [meterType, setMeterType] = useState<"water" | "electricity">("water");
  const [meterPrev, setMeterPrev] = useState("");
  const [meterCurrent, setMeterCurrent] = useState("");
  const [meterDate, setMeterDate] = useState(todayStr);

  const meterCost = useMemo(() => {
    const prev = Number(meterPrev) || 0;
    const cur = Number(meterCurrent) || 0;
    const diff = Math.max(0, cur - prev);
    return diff * (meterType === "water" ? 50 : 30);
  }, [meterPrev, meterCurrent, meterType]);

  const submitMeterReading = () => {
    if (!meterUnitId || !meterPrev || !meterCurrent) return;
    addMeterReading({
      unitId: meterUnitId,
      type: meterType,
      previous: Number(meterPrev),
      current: Number(meterCurrent),
      date: meterDate,
      cost: meterCost,
    });
    toast({ title: "Meter reading saved", description: formatKES(meterCost) });
    setMeterPrev("");
    setMeterCurrent("");
  };

  // ---------------- Visitors ----------------
  const [visTenantId, setVisTenantId] = useState("");
  const [visName, setVisName] = useState("");
  const [visPhone, setVisPhone] = useState("");
  const [visId, setVisId] = useState("");
  const [visVehicle, setVisVehicle] = useState("");

  const submitVisitor = () => {
    if (!visTenantId || !visName) return;
    addVisitor({
      tenantId: visTenantId,
      name: visName,
      phone: visPhone,
      entryTime: new Date().toISOString(),
      idRef: visId || undefined,
      vehicleReg: visVehicle || undefined,
    });
    toast({ title: "Visitor registered", description: visName });
    setVisName("");
    setVisPhone("");
    setVisId("");
    setVisVehicle("");
  };

  const todaysVisitors = visitors.filter((v) => v.entryTime.startsWith(todayStr));

  // ---------------- Notices ----------------
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticePriority, setNoticePriority] = useState<"normal" | "urgent" | "emergency">("normal");

  const submitNotice = () => {
    if (!noticeTitle || !noticeMessage) return;
    addAnnouncement({ title: noticeTitle, message: noticeMessage, priority: noticePriority, audience: "all" });
    toast({ title: "Notice posted" });
    setNoticeTitle("");
    setNoticeMessage("");
  };

  const noticeBorder = (p: string) =>
    p === "emergency" ? "border-l-destructive" : p === "urgent" ? "border-l-warning" : "border-l-info";

  // ---------------- Complaints ----------------
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolveText, setResolveText] = useState("");

  const submitResolution = () => {
    if (!resolveOpen) return;
    updateComplaint(resolveOpen, { status: "resolved", resolution: resolveText });
    toast({ title: "Complaint resolved" });
    setResolveOpen(null);
    setResolveText("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero p-4 pb-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="font-heading text-lg font-bold">NyumbaLink</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <h1 className="font-heading text-xl font-bold">Caretaker Dashboard</h1>
        <p className="text-primary-foreground/80 text-sm">On-site operations</p>
      </header>

      <nav className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {TABS.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(item.id)}
            className={`flex-shrink-0 ${tab === item.id ? "gradient-primary text-primary-foreground" : ""}`}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      <main className="p-4 space-y-4 animate-fade-in max-w-4xl mx-auto">
        {tab === "today" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading">Occupancy</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-success">{occ.occupied}</p>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-info">{occ.vacant}</p>
                  <p className="text-xs text-muted-foreground">Vacant</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{occ.reserved}</p>
                  <p className="text-xs text-muted-foreground">Reserved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{occ.maintenance}</p>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-sm text-muted-foreground">Occupancy rate: <span className="font-semibold text-foreground">{occ.rate}%</span></p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Today's Collections</p>
                  <p className="text-xl font-bold text-success">{formatKES(todaysTotal)}</p>
                  <p className="text-xs text-muted-foreground">{todaysPayments.length} payment(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Unpaid Tenants</p>
                  <p className="text-xl font-bold text-destructive">{arrearsList.length}</p>
                  <p className="text-xs text-muted-foreground">{formatKES(arrearsList.reduce((s, a) => s + a.amountOwed, 0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Open Tickets</p>
                  <p className="text-xl font-bold text-warning">{openTickets.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="font-heading">Daily Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <Checkbox
                      id={item.id}
                      checked={!!checklist[item.id]}
                      onCheckedChange={(v) => toggleChecklist(item.id, item.label, !!v)}
                    />
                    <label htmlFor={item.id} className="flex-1 font-medium text-foreground cursor-pointer">{item.label}</label>
                    {checklist[item.id] && <span className="text-xs text-success font-medium">✓ Done</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "units" && (
          <div className="space-y-4">
            {[...unitsByBuilding.entries()].map(([buildingId, us]) => (
              <Card key={buildingId}>
                <CardHeader><CardTitle className="font-heading text-base">{data.getBuilding(buildingId)?.name ?? "Building"}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {us.map((u) => {
                    const tenant = tenants.find((t) => t.unitId === u.id && t.status !== "moved_out");
                    return (
                      <div key={u.id} className="p-3 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{u.label}</p>
                          <span className="text-xs text-muted-foreground">{UNIT_TYPE_LABELS[u.type]}</span>
                        </div>
                        {tenant && <p className="text-sm text-muted-foreground">Tenant: {tenant.name}</p>}
                        <Select value={u.status} onValueChange={(v) => updateUnit(u.id, { status: v as UnitStatus }, "Caretaker")}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(UNIT_STATUS_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "tenants" && (
          <div className="space-y-3">
            {activeTenants.map((t) => {
              const balance = tenantBalance(t.id);
              return (
                <Card key={t.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{unitLabel(t.unitId)} · {t.phone}</p>
                      <p className={`text-sm font-medium ${balance > 0 ? "text-destructive" : "text-success"}`}>
                        {balance > 0 ? `Owes ${formatKES(balance)}` : "Balance clear"}
                      </p>
                    </div>
                    <Dialog open={paymentTenantId === t.id} onOpenChange={(o) => !o && setPaymentTenantId(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openPaymentDialog(t.id)}>
                          Record Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle className="font-heading">Record Payment — {t.name}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Amount</Label>
                            <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                          </div>
                          <div>
                            <Label>Method</Label>
                            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["mpesa", "bank", "cash", "card", "other"].map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Reference</Label>
                            <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Optional" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button className="gradient-primary text-primary-foreground" onClick={submitPayment}>Save Payment</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "maintenance" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">New Maintenance Ticket</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Unit</Label>
                      <Select value={ticketUnitId} onValueChange={setTicketUnitId}>
                        <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                        <SelectContent>
                          {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MAINTENANCE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={ticketPriority} onValueChange={(v) => setTicketPriority(v as Priority)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["low", "normal", "high", "urgent", "emergency"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="gradient-primary text-primary-foreground" onClick={submitTicket}>Create Ticket</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {openTickets.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{t.number} — {t.title}</p>
                    <Badge className={priorityColor(t.priority)}>{t.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{unitLabel(t.unitId)} · {t.category}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{TICKET_STATUS_LABELS[t.status]}</Badge>
                    {nextTicketStatus[t.status] && (
                      <Button size="sm" variant="secondary" onClick={() => advanceTicket(t.id, nextTicketStatus[t.status]!)}>
                        Mark {TICKET_STATUS_LABELS[nextTicketStatus[t.status]!]}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {openTickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No open tickets.</p>}
          </div>
        )}

        {tab === "inspections" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading">New Inspection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Unit</Label>
                  <Select value={inspUnitId} onValueChange={setInspUnitId}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={inspType} onValueChange={(v) => setInspType(v as typeof inspType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["move_in", "move_out", "routine", "emergency", "safety", "maintenance"].map((v) => (
                        <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={inspCondition} onValueChange={(v) => setInspCondition(v as typeof inspCondition)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["excellent", "good", "fair", "poor"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={inspDate} onChange={(e) => setInspDate(e.target.value)} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={inspNotes} onChange={(e) => setInspNotes(e.target.value)} />
                </div>
                <Button className="gradient-primary text-primary-foreground w-full" onClick={submitInspection}>Save Inspection</Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {inspections.map((i) => (
                <Card key={i.id}>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{unitLabel(i.unitId)} · {i.type.replace("_", " ")}</p>
                      <Badge variant="outline">{i.condition}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{i.date}</p>
                    {i.notes && <p className="text-sm text-muted-foreground">{i.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "meters" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading">New Reading</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Unit</Label>
                  <Select value={meterUnitId} onValueChange={setMeterUnitId}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={meterType} onValueChange={(v) => setMeterType(v as typeof meterType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Previous</Label>
                    <Input type="number" value={meterPrev} onChange={(e) => setMeterPrev(e.target.value)} />
                  </div>
                  <div>
                    <Label>Current</Label>
                    <Input type="number" value={meterCurrent} onChange={(e) => setMeterCurrent(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={meterDate} onChange={(e) => setMeterDate(e.target.value)} />
                </div>
                <p className="text-sm text-muted-foreground">Estimated cost: <span className="font-semibold text-foreground">{formatKES(meterCost)}</span></p>
                <Button className="gradient-primary text-primary-foreground w-full" onClick={submitMeterReading}>Save Reading</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-heading text-base">Recent Readings</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {meterReadings.slice(0, 20).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                    <span>{unitLabel(m.unitId)} · {m.type}</span>
                    <span className="text-muted-foreground">{m.previous} → {m.current}</span>
                    <span className="font-medium text-foreground">{formatKES(m.cost)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "visitors" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading">Register Visitor</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Tenant</Label>
                  <Select value={visTenantId} onValueChange={setVisTenantId}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {activeTenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visitor Name</Label>
                  <Input value={visName} onChange={(e) => setVisName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={visPhone} onChange={(e) => setVisPhone(e.target.value)} />
                </div>
                <div>
                  <Label>ID Reference</Label>
                  <Input value={visId} onChange={(e) => setVisId(e.target.value)} />
                </div>
                <div>
                  <Label>Vehicle Reg</Label>
                  <Input value={visVehicle} onChange={(e) => setVisVehicle(e.target.value)} />
                </div>
                <Button className="gradient-primary text-primary-foreground w-full" onClick={submitVisitor}>Register</Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {todaysVisitors.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground">Visiting {getTenant(v.tenantId)?.name ?? "—"} · {new Date(v.entryTime).toLocaleTimeString()}</p>
                    </div>
                    {v.exitTime ? (
                      <Badge variant="outline">Checked out</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => { checkoutVisitor(v.id); toast({ title: "Visitor checked out" }); }}>Check Out</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {todaysVisitors.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No visitors today.</p>}
            </div>
          </div>
        )}

        {tab === "notices" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-heading">Post Notice</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={noticePriority} onValueChange={(v) => setNoticePriority(v as typeof noticePriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["normal", "urgent", "emergency"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gradient-primary text-primary-foreground w-full" onClick={submitNotice}>Post</Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {announcements.map((a) => (
                <Card key={a.id} className={`border-l-4 ${noticeBorder(a.priority)}`}>
                  <CardContent className="p-3">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "complaints" && (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{c.category}</p>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{getTenant(c.tenantId)?.name ?? "—"}: {c.description}</p>
                  {c.resolution && <p className="text-sm text-success">Resolution: {c.resolution}</p>}
                  <div className="flex gap-2">
                    {c.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => { updateComplaint(c.id, { status: "investigating" }); toast({ title: "Marked investigating" }); }}>
                        Investigate
                      </Button>
                    )}
                    {c.status !== "resolved" && (
                      <Dialog open={resolveOpen === c.id} onOpenChange={(o) => setResolveOpen(o ? c.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gradient-primary text-primary-foreground">Resolve</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle className="font-heading">Resolve Complaint</DialogTitle></DialogHeader>
                          <Textarea placeholder="Resolution notes" value={resolveText} onChange={(e) => setResolveText(e.target.value)} />
                          <DialogFooter>
                            <Button className="gradient-primary text-primary-foreground" onClick={submitResolution}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {complaints.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No complaints.</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default CaretakerDashboard;
