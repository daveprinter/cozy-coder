import React, { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { useData } from "@/lib/domain/DataContext";
import { formatKES, MAINTENANCE_CATEGORIES, COMPLAINT_CATEGORIES, TICKET_STATUS_LABELS } from "@/lib/domain/types";
import type { PaymentMethod, Payment } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, Wrench, Home, FileWarning, CreditCard, LogOut, Building2, ChevronRight,
  Receipt, FileText, Droplets, Megaphone, MessageSquare, User as UserIcon,
} from "lucide-react";

type View =
  | "home" | "rent" | "payments" | "statements" | "maintenance"
  | "lease" | "utilities" | "announcements" | "complaints" | "profile";

const TenantDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { apartmentName, notifications, markNotificationRead } = useApp();
  const data = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<View>("home");
  const [showNotifs, setShowNotifs] = useState(false);

  const tenant = useMemo(() => data.tenants.find((t) => t.status === "active"), [data.tenants]);
  const unit = tenant ? data.tenantUnit(tenant.id) : undefined;
  const lease = tenant ? data.tenantLease(tenant.id) : undefined;
  const deposit = tenant ? data.tenantDeposit(tenant.id) : undefined;
  const property = tenant ? data.getProperty(tenant.propertyId) : undefined;
  const balance = tenant ? data.tenantBalance(tenant.id) : 0;
  const payments = tenant ? data.tenantPayments(tenant.id) : [];
  const invStates = tenant ? data.invoiceStates(tenant.id) : [];
  const myTickets = tenant ? data.tickets.filter((t) => t.tenantId === tenant.id) : [];
  const myComplaints = tenant ? data.complaints.filter((c) => c.tenantId === tenant.id) : [];
  const myMeters = unit ? data.meterReadings.filter((m) => m.unitId === unit.id) : [];
  const myAnnouncements = data.announcements.filter(
    (a) => a.audience === "all" || (a.audience === "property" && a.targetId === tenant?.propertyId),
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const nextDueDate = useMemo(() => {
    const day = data.settings.rentDueDay || 5;
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, day);
    return next.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
  }, [data.settings.rentDueDay]);

  // ------ Pay Rent dialog state ------
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("mpesa");
  const [payRef, setPayRef] = useState("");
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const openPay = () => {
    setPayAmount(String(balance > 0 ? balance : lease?.rent ?? 0));
    setPayMethod("mpesa");
    setPayRef("");
    setPayOpen(true);
  };

  const submitPay = () => {
    if (!tenant) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const p = data.recordPayment({ tenantId: tenant.id, amount: amt, method: payMethod, reference: payRef }, "Tenant");
    setPayOpen(false);
    setReceipt(p);
    toast({ title: "Payment recorded", description: `${formatKES(amt)} via ${payMethod}` });
  };

  // ------ receipt viewer for payments list ------
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);

  // ------ maintenance form ------
  const [mCategory, setMCategory] = useState(MAINTENANCE_CATEGORIES[0]);
  const [mPriority, setMPriority] = useState<"low" | "normal" | "high" | "urgent" | "emergency">("normal");
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");

  const submitTicket = () => {
    if (!tenant || !unit) return;
    if (!mTitle.trim() || !mDesc.trim()) {
      toast({ title: "Please fill in title and description", variant: "destructive" });
      return;
    }
    data.addTicket({
      unitId: unit.id,
      propertyId: tenant.propertyId,
      tenantId: tenant.id,
      title: mTitle,
      category: mCategory,
      priority: mPriority,
      description: mDesc,
      status: "new",
    });
    setMTitle("");
    setMDesc("");
    toast({ title: "Request submitted", description: "Our team will get back to you shortly." });
  };

  // ------ complaint form ------
  const [cCategory, setCCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [cDesc, setCDesc] = useState("");

  const submitComplaint = () => {
    if (!tenant) return;
    if (!cDesc.trim()) {
      toast({ title: "Please describe your complaint", variant: "destructive" });
      return;
    }
    data.addComplaint({ tenantId: tenant.id, category: cCategory, description: cDesc, status: "open" });
    setCDesc("");
    toast({ title: "Complaint submitted" });
  };

  // ------ profile edit ------
  const [editingProfile, setEditingProfile] = useState(false);
  const [phone, setPhone] = useState(tenant?.phone ?? "");
  const [email, setEmail] = useState(tenant?.email ?? "");

  const saveProfile = () => {
    if (!tenant) return;
    data.updateTenant(tenant.id, { phone, email });
    setEditingProfile(false);
    toast({ title: "Profile updated" });
  };

  const financeSummary = useMemo(() => {
    const totalInvoiced = invStates.reduce((s, i) => s + i.amount + i.penaltyAmount, 0);
    const totalPaid = invStates.reduce((s, i) => s + i.paidAmount, 0);
    const penalties = invStates.reduce((s, i) => s + i.penaltyAmount, 0);
    return { totalInvoiced, totalPaid, penalties, outstanding: balance };
  }, [invStates, balance]);

  const formatPeriod = (period: string) => {
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  };

  const invoiceBadgeVariant = (status: string) => {
    if (status === "paid") return "default";
    if (status === "overdue" || status === "disputed") return "destructive";
    return "secondary";
  };

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">No active tenant found.</p>
      </div>
    );
  }

  const actions: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "rent", label: "My Rent", icon: CreditCard },
    { id: "payments", label: "Payments & Receipts", icon: Receipt },
    { id: "statements", label: "Rent Statements", icon: FileText },
    { id: "maintenance", label: "Report Maintenance", icon: Wrench },
    { id: "lease", label: "My Lease", icon: Home },
    { id: "utilities", label: "Utilities", icon: Droplets },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "complaints", label: "Complaints", icon: FileWarning },
    { id: "profile", label: "My Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero p-4 pb-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="font-heading text-lg font-bold">NyumbaLink</span>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={showNotifs} onOpenChange={setShowNotifs}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-xs flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card">
                <SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No notifications yet</p>
                  ) : notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${n.read ? "bg-muted/50" : "bg-accent border-primary/20"}`}
                    >
                      <p className="font-medium text-sm text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <h1 className="font-heading text-2xl font-bold">Welcome to {apartmentName}</h1>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {tenant.name} • {unit?.label ?? "—"}
        </p>
      </header>

      <main className="p-4 -mt-2 max-w-2xl mx-auto">
        {view === "home" ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-muted-foreground text-sm mb-4">What would you like to do today?</p>
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => setView(a.id)}
                className="w-full glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <a.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">{a.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            <Button variant="ghost" onClick={() => setView("home")} className="mb-4 gap-2 text-muted-foreground">
              ← Back
            </Button>

            {view === "rent" && (
              <div className="space-y-4">
                <Card className="glass-card p-5 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Rent</p>
                    <p className="font-heading text-2xl font-bold text-foreground">{formatKES(lease?.rent ?? 0)}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    {balance > 0 ? (
                      <p className="font-heading text-3xl font-bold text-destructive">{formatKES(balance)}</p>
                    ) : (
                      <p className="font-heading text-3xl font-bold text-success">Cleared</p>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next due date</span>
                    <span className="text-foreground font-medium">{nextDueDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="text-foreground font-medium">{unit?.label ?? "—"} • {property?.name ?? "—"}</span>
                  </div>
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={openPay}>
                    Pay Rent
                  </Button>
                </Card>
              </div>
            )}

            {view === "payments" && (
              <div className="space-y-4">
                <Card className="glass-card p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Invoiced</p>
                    <p className="font-heading font-bold text-foreground">{formatKES(financeSummary.totalInvoiced)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="font-heading font-bold text-success">{formatKES(financeSummary.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Penalties</p>
                    <p className="font-heading font-bold text-warning">{formatKES(financeSummary.penalties)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className={`font-heading font-bold ${financeSummary.outstanding > 0 ? "text-destructive" : "text-success"}`}>
                      {formatKES(financeSummary.outstanding)}
                    </p>
                  </div>
                </Card>

                <div className="space-y-2">
                  {payments.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">No payments yet.</p>
                  ) : payments.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setViewReceipt(p)}
                      className="w-full glass-card p-3 flex items-center justify-between text-left hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatKES(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()} • {p.receiptNo}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{p.method}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "statements" && (
              <div className="space-y-2">
                {invStates.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No invoices yet.</p>
                ) : invStates.map((inv) => (
                  <Card key={inv.id} className="glass-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{formatPeriod(inv.period)}</p>
                      <Badge variant={invoiceBadgeVariant(inv.status) as any} className="capitalize">{inv.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Amount</span><span className="text-foreground">{formatKES(inv.amount)}</span>
                    </div>
                    {inv.penaltyAmount > 0 && (
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>Penalty</span><span className="text-warning">{formatKES(inv.penaltyAmount)}</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Paid</span><span className="text-success">{formatKES(inv.paidAmount)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Due Date</span><span className="text-foreground">{new Date(inv.dueDate).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {view === "maintenance" && (
              <div className="space-y-6">
                <Card className="glass-card p-4 space-y-3">
                  <h3 className="font-heading font-semibold text-foreground">Report a maintenance issue</h3>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={mCategory} onValueChange={setMCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={mPriority} onValueChange={(v) => setMPriority(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low", "normal", "high", "urgent", "emergency"].map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Leaking tap" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Describe the issue..." />
                  </div>
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={submitTicket}>
                    Submit Request
                  </Button>
                </Card>

                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">My Requests</h3>
                  <div className="space-y-2">
                    {myTickets.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">No requests yet.</p>
                    ) : myTickets.map((t) => (
                      <Card key={t.id} className="glass-card p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.number} • {t.category}</p>
                        </div>
                        <Badge variant="secondary">{TICKET_STATUS_LABELS[t.status]}</Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === "lease" && (
              <div className="space-y-4">
                <Card className="glass-card p-4 space-y-2">
                  <h3 className="font-heading font-semibold text-foreground mb-2">Lease Details</h3>
                  {lease ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Start Date</span><span className="text-foreground">{new Date(lease.startDate).toLocaleDateString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">End Date</span><span className="text-foreground">{new Date(lease.endDate).toLocaleDateString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rent</span><span className="text-foreground">{formatKES(lease.rent)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deposit</span><span className="text-foreground">{formatKES(lease.deposit)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment Frequency</span><span className="text-foreground capitalize">{lease.paymentFrequency}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="secondary" className="capitalize">{lease.status}</Badge></div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Days Remaining</span>
                        <span className="text-foreground">{Math.max(0, Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000))}</span>
                      </div>
                    </>
                  ) : <p className="text-muted-foreground text-sm">No active lease found.</p>}
                </Card>

                <Card className="glass-card p-4 space-y-2">
                  <h3 className="font-heading font-semibold text-foreground mb-2">Deposit</h3>
                  {deposit ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount Held</span><span className="text-foreground">{formatKES(deposit.amount)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="secondary" className="capitalize">{deposit.status.replace("_", " ")}</Badge></div>
                      {deposit.deductions.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">Deductions</p>
                          {deposit.deductions.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{d.reason}</span>
                              <span className="text-destructive">-{formatKES(d.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : <p className="text-muted-foreground text-sm">No deposit record found.</p>}
                </Card>
              </div>
            )}

            {view === "utilities" && (
              <div className="space-y-2">
                {myMeters.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No meter readings yet.</p>
                ) : myMeters.map((m) => (
                  <Card key={m.id} className="glass-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground capitalize">{m.type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>{m.previous} → {m.current}</span>
                      <span className="text-foreground">{m.current - m.previous} units</span>
                    </div>
                    <div className="text-sm flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="text-foreground font-medium">{formatKES(m.cost)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {view === "announcements" && (
              <div className="space-y-2">
                {myAnnouncements.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No announcements.</p>
                ) : myAnnouncements.map((a) => {
                  const borderColor =
                    a.priority === "emergency" ? "border-l-destructive" :
                    a.priority === "urgent" ? "border-l-warning" : "border-l-info";
                  return (
                    <Card key={a.id} className={`glass-card p-4 border-l-4 ${borderColor}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <Badge variant="secondary" className="capitalize">{a.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </Card>
                  );
                })}
              </div>
            )}

            {view === "complaints" && (
              <div className="space-y-6">
                <Card className="glass-card p-4 space-y-3">
                  <h3 className="font-heading font-semibold text-foreground">Submit a complaint</h3>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={cCategory} onValueChange={setCCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Describe your complaint..." />
                  </div>
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={submitComplaint}>
                    Submit Complaint
                  </Button>
                </Card>

                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">My Complaints</h3>
                  <div className="space-y-2">
                    {myComplaints.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">No complaints filed.</p>
                    ) : myComplaints.map((c) => (
                      <Card key={c.id} className="glass-card p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.category}</p>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{c.status}</Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === "profile" && (
              <div className="space-y-4">
                <Card className="glass-card p-4 space-y-2">
                  <h3 className="font-heading font-semibold text-foreground mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Name</span><span className="text-foreground text-right">{tenant.name}</span>
                    <span className="text-muted-foreground">Phone</span><span className="text-foreground text-right">{tenant.phone}</span>
                    <span className="text-muted-foreground">Email</span><span className="text-foreground text-right">{tenant.email}</span>
                    <span className="text-muted-foreground">National ID</span><span className="text-foreground text-right">{tenant.nationalId}</span>
                    {tenant.isStudent && (
                      <>
                        <span className="text-muted-foreground">School</span><span className="text-foreground text-right">{tenant.school}</span>
                        <span className="text-muted-foreground">Course</span><span className="text-foreground text-right">{tenant.course}</span>
                        <span className="text-muted-foreground">Year of Study</span><span className="text-foreground text-right">{tenant.yearOfStudy}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <span className="text-foreground text-right">{tenant.emergencyContactName} ({tenant.emergencyContactPhone})</span>
                  </div>
                </Card>

                <Card className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-foreground">Edit Phone / Email</h3>
                    {!editingProfile && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>Edit</Button>
                    )}
                  </div>
                  {editingProfile && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 gradient-primary text-primary-foreground" onClick={saveProfile}>Save</Button>
                        <Button variant="ghost" className="flex-1" onClick={() => setEditingProfile(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pay Rent Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pay Rent</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount (KES)</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Reference (optional)</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="M-Pesa code, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={submitPay}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Receipt Dialog after payment */}
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment Successful</DialogTitle></DialogHeader>
          {receipt && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt No.</span><span className="text-foreground font-medium">{receipt.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-medium">{formatKES(receipt.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="text-foreground capitalize">{receipt.method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{new Date(receipt.date).toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">New Balance</span>
                <span className={tenant ? (data.tenantBalance(tenant.id) > 0 ? "text-destructive font-medium" : "text-success font-medium") : ""}>
                  {tenant ? formatKES(data.tenantBalance(tenant.id)) : "-"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setReceipt(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment receipt viewer */}
      <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {viewReceipt && (
            <div className="space-y-2 text-sm border border-dashed border-border rounded-lg p-4">
              <p className="text-center font-heading font-bold text-foreground">{property?.name}</p>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Tenant</span><span className="text-foreground">{tenant.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="text-foreground">{unit?.label ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-medium">{formatKES(viewReceipt.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="text-foreground capitalize">{viewReceipt.method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="text-foreground">{viewReceipt.reference || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt No.</span><span className="text-foreground">{viewReceipt.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{new Date(viewReceipt.date).toLocaleString()}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantDashboard;
