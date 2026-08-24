import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_STATE, type DomainState } from "./seed";
import type {
  Announcement,
  ArrearEntry,
  AuditEntry,
  Building,
  Complaint,
  Deposit,
  Expense,
  FinanceStats,
  Inspection,
  Invoice,
  InvoiceState,
  InvoiceStatus,
  Lease,
  MaintenanceTicket,
  MeterReading,
  MonthlyPoint,
  OccupancyStats,
  Payment,
  PaymentMethod,
  Property,
  Settings,
  SmartAlert,
  Staff,
  Tenant,
  Unit,
  Visitor,
} from "./types";

const STORAGE_KEY = "nyumba_domain_v1";
const MS_DAY = 24 * 60 * 60 * 1000;

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentPeriod = () => todayISO().slice(0, 7);

let localSeq = 1000;
const nid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(localSeq++).toString(36)}`;

interface PaymentInput {
  tenantId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  date?: string;
  receivedBy?: string;
}

interface DataContextType extends Omit<DomainState, "paymentSeq" | "ticketSeq"> {
  hydrated: boolean;
  // lookups
  getProperty: (id: string) => Property | undefined;
  getBuilding: (id: string) => Building | undefined;
  getUnit: (id: string) => Unit | undefined;
  getTenant: (id: string) => Tenant | undefined;
  unitLabel: (unitId: string | null | undefined) => string;
  tenantUnit: (tenantId: string) => Unit | undefined;
  tenantLease: (tenantId: string) => Lease | undefined;
  buildingUnits: (buildingId: string) => Unit[];
  propertyBuildings: (propertyId: string) => Building[];
  propertyUnits: (propertyId: string) => Unit[];
  propertyTenants: (propertyId: string) => Tenant[];
  // finance selectors
  invoiceStates: (tenantId: string) => InvoiceState[];
  tenantBalance: (tenantId: string) => number;
  tenantPayments: (tenantId: string) => Payment[];
  tenantDeposit: (tenantId: string) => Deposit | undefined;
  arrears: (propertyId?: string) => ArrearEntry[];
  financeStats: (propertyId?: string) => FinanceStats;
  occupancyStats: (propertyId?: string) => OccupancyStats;
  monthlySeries: (months?: number) => MonthlyPoint[];
  smartAlerts: () => SmartAlert[];
  maintenanceByCategory: () => { category: string; count: number }[];
  propertyComparison: () => { property: Property; income: number; expenses: number; profit: number; occupancy: number }[];
  // actions (all log to the audit trail)
  addProperty: (input: Omit<Property, "id" | "createdAt">) => void;
  addBuilding: (input: Omit<Building, "id">) => void;
  addUnit: (input: Omit<Unit, "id" | "statusChangedAt">) => void;
  updateUnit: (id: string, patch: Partial<Unit>, actor?: string) => void;
  addTenant: (input: Omit<Tenant, "id">) => Tenant;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  moveOutTenant: (tenantId: string, opts?: { damages?: number; unpaidUtilities?: number; reason?: string }) => void;
  addLease: (input: Omit<Lease, "id">) => void;
  terminateLease: (id: string, actor?: string) => void;
  addInvoice: (input: Omit<Invoice, "id" | "createdAt">) => void;
  waiveInvoice: (id: string, actor?: string) => void;
  recordPayment: (input: PaymentInput, actor?: string) => Payment;
  addExpense: (input: Omit<Expense, "id">) => void;
  addTicket: (input: Omit<MaintenanceTicket, "id" | "number" | "reportedAt">) => MaintenanceTicket;
  updateTicket: (id: string, patch: Partial<MaintenanceTicket>, actor?: string) => void;
  addMeterReading: (input: Omit<MeterReading, "id">) => void;
  addAnnouncement: (input: Omit<Announcement, "id" | "createdAt">) => void;
  addComplaint: (input: Omit<Complaint, "id" | "createdAt">) => void;
  updateComplaint: (id: string, patch: Partial<Complaint>) => void;
  addVisitor: (input: Omit<Visitor, "id">) => void;
  checkoutVisitor: (id: string) => void;
  addInspection: (input: Omit<Inspection, "id">) => void;
  addStaff: (input: Omit<Staff, "id">) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  logAudit: (actor: string, action: string, detail: string) => void;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DomainState>(SEED_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // corrupted cache → keep seed
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const set = (fn: (s: DomainState) => DomainState) => setState((s) => fn(s));

  const log = (actor: string, action: string, detail: string) =>
    set((s) => ({
      ...s,
      auditLog: [{ id: nid("aud"), actor, action, detail, date: new Date().toISOString() }, ...s.auditLog].slice(0, 200),
    }));

  // ---------- computed helpers ----------
  const invoiceStates = (tenantId: string): InvoiceState[] => {
    const invs = state.invoices
      .filter((i) => i.tenantId === tenantId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    let pool = state.payments
      .filter((p) => p.tenantId === tenantId)
      .reduce((sum, p) => sum + p.amount, 0);
    const today = todayISO();
    return invs.map((inv) => {
      if (inv.waived) return { ...inv, paidAmount: 0, status: "waived" as InvoiceStatus };
      const total = inv.amount + inv.penaltyAmount;
      const paidAmount = Math.min(total, Math.max(0, pool));
      pool -= paidAmount;
      let status: InvoiceStatus;
      if (inv.disputed) status = "disputed";
      else if (paidAmount >= total) status = "paid";
      else if (inv.dueDate < today) status = "overdue";
      else if (paidAmount > 0) status = "partial";
      else status = "unpaid";
      return { ...inv, paidAmount, status };
    });
  };

  const tenantBalance = (tenantId: string): number => {
    const states = invoiceStates(tenantId);
    return states.reduce((sum, s) => sum + (s.status === "waived" ? 0 : s.amount + s.penaltyAmount - s.paidAmount), 0);
  };

  const activeTenants = state.tenants.filter((t) => t.status !== "moved_out");

  const financeStats = (propertyId?: string): FinanceStats => {
    const period = currentPeriod();
    const today = todayISO();
    const inProp = (id: string) => !propertyId || id === propertyId;
    const tenants = activeTenants.filter((t) => inProp(t.propertyId));
    const tenantIds = new Set(tenants.map((t) => t.id));
    const monthInvoices = state.invoices.filter((i) => i.period === period && tenantIds.has(i.tenantId));
    const expected = monthInvoices.reduce((s, i) => s + i.amount + i.penaltyAmount, 0);
    const collected = state.payments
      .filter((p) => p.date.startsWith(period) && tenantIds.has(p.tenantId))
      .reduce((s, p) => s + p.amount, 0);
    let outstanding = 0;
    let overdue = 0;
    for (const t of tenants) {
      for (const inv of invoiceStates(t.id)) {
        const due = inv.status === "waived" ? 0 : inv.amount + inv.penaltyAmount - inv.paidAmount;
        outstanding += due;
        if (due > 0 && inv.dueDate < today) overdue += due;
      }
    }
    const expensesThisMonth = state.expenses
      .filter((e) => e.date.startsWith(period) && inProp(e.propertyId))
      .reduce((s, e) => s + e.amount, 0);
    const units = state.units.filter((u) => inProp(u.propertyId));
    const depositsHeld = state.deposits
      .filter((d) => d.status === "held" && tenants.some((t) => t.id === d.tenantId))
      .reduce((s, d) => s + d.amount - d.deductions.reduce((x, y) => x + y.amount, 0) - d.refundedAmount, 0);
    const in30 = new Date(Date.now() + 30 * MS_DAY).toISOString().slice(0, 10);
    return {
      expectedThisMonth: expected,
      collectedThisMonth: collected,
      outstanding,
      overdue,
      depositsHeld,
      expensesThisMonth,
      netIncome: collected - expensesThisMonth,
      collectionRate: expected > 0 ? Math.round((collected / expected) * 100) : 100,
      activeTenants: tenants.length,
      newTenantsThisMonth: tenants.filter((t) => t.moveInDate.startsWith(period)).length,
      moveOutsThisMonth: state.tenants.filter((t) => t.moveOutDate?.startsWith(period) && inProp(t.propertyId)).length,
      leasesExpiringSoon: state.leases.filter(
        (l) => l.status === "active" && l.endDate >= today && l.endDate <= in30 && tenants.some((t) => t.id === l.tenantId),
      ).length,
      openTickets: state.tickets.filter((t) => inProp(t.propertyId) && !["completed", "rejected", "cancelled"].includes(t.status)).length,
      ...(units.length ? {} : {}),
    };
  };

  const occupancyStats = (propertyId?: string): OccupancyStats => {
    const units = state.units.filter((u) => !propertyId || u.propertyId === propertyId);
    const count = (s: string) => units.filter((u) => u.status === s).length;
    const occupied = count("occupied") + count("notice");
    return {
      total: units.length,
      occupied,
      vacant: count("vacant"),
      reserved: count("reserved"),
      notice: count("notice"),
      maintenance: count("maintenance") + count("cleaning"),
      rate: units.length ? Math.round((occupied / units.length) * 100) : 0,
    };
  };

  const arrears = (propertyId?: string): ArrearEntry[] => {
    const today = todayISO();
    return activeTenants
      .filter((t) => !propertyId || t.propertyId === propertyId)
      .map((t) => {
        const states = invoiceStates(t.id).filter((s) => s.status === "overdue" || ((s.status === "partial" || s.status === "unpaid") && s.amount + s.penaltyAmount - s.paidAmount > 0));
        const amountOwed = tenantBalance(t.id);
        const overdueInvs = states.filter((s) => s.dueDate < today);
        const oldest = overdueInvs.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const tenantPayments = state.payments.filter((p) => p.tenantId === t.id).sort((a, b) => b.date.localeCompare(a.date));
        return {
          tenant: t,
          unit: state.units.find((u) => u.id === t.unitId) ?? null,
          amountOwed,
          daysOverdue: oldest ? Math.max(0, Math.floor((Date.now() - new Date(oldest.dueDate).getTime()) / MS_DAY)) : 0,
          lastPaymentDate: tenantPayments[0]?.date,
        };
      })
      .filter((a) => a.amountOwed > 0)
      .sort((a, b) => b.amountOwed - a.amountOwed);
  };

  const monthlySeries = (months = 6): MonthlyPoint[] => {
    const out: MonthlyPoint[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = d.toISOString().slice(0, 7);
      out.push({
        month: d.toLocaleString("en", { month: "short" }),
        income: state.payments.filter((p) => p.date.startsWith(period)).reduce((s, p) => s + p.amount, 0),
        expenses: state.expenses.filter((e) => e.date.startsWith(period)).reduce((s, e) => s + e.amount, 0),
      });
    }
    return out;
  };

  const smartAlerts = (): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const today = new Date();
    for (const u of state.units) {
      if (u.status === "vacant") {
        const days = Math.floor((today.getTime() - new Date(u.statusChangedAt).getTime()) / MS_DAY);
        if (days >= 21) alerts.push({ id: `vac-${u.id}`, severity: "warning", message: `Unit ${u.label} has been vacant for ${days} days.` });
      }
      if (u.status === "maintenance") {
        const days = Math.floor((today.getTime() - new Date(u.statusChangedAt).getTime()) / MS_DAY);
        if (days >= 14) alerts.push({ id: `mnt-${u.id}`, severity: "info", message: `Unit ${u.label} has been under maintenance for ${days} days.` });
      }
    }
    const arr = arrears();
    if (arr.length > 0) {
      const total = arr.reduce((s, a) => s + a.amountOwed, 0);
      alerts.push({ id: "arrears", severity: "critical", message: `${arr.length} tenant${arr.length > 1 ? "s have" : " has"} overdue rent totalling KES ${total.toLocaleString()}.` });
    }
    const fin = financeStats();
    if (fin.leasesExpiringSoon > 0) alerts.push({ id: "leases", severity: "warning", message: `${fin.leasesExpiringSoon} lease${fin.leasesExpiringSoon > 1 ? "s" : ""} expire within 30 days.` });
    const series = monthlySeries(2);
    if (series.length === 2 && series[1].income < series[0].income * 0.9) {
      const drop = Math.round((1 - series[1].income / Math.max(1, series[0].income)) * 100);
      alerts.push({ id: "collection", severity: "warning", message: `Rent collection is ${drop}% lower than last month.` });
    }
    const urgent = state.tickets.filter((t) => ["urgent", "emergency"].includes(t.priority) && !["completed", "cancelled"].includes(t.status));
    if (urgent.length > 0) alerts.push({ id: "urgent", severity: "critical", message: `${urgent.length} urgent maintenance request${urgent.length > 1 ? "s" : ""} need attention.` });
    return alerts;
  };

  const maintenanceByCategory = () => {
    const map = new Map<string, number>();
    for (const t of state.tickets) map.set(t.category, (map.get(t.category) ?? 0) + 1);
    return [...map.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  };

  const propertyComparison = () =>
    state.properties.map((p) => {
      const income = state.payments.filter((x) => x.tenantId && state.tenants.find((t) => t.id === x.tenantId)?.propertyId === p.id).reduce((s, x) => s + x.amount, 0);
      const expenses = state.expenses.filter((e) => e.propertyId === p.id).reduce((s, e) => s + e.amount, 0);
      return { property: p, income, expenses, profit: income - expenses, occupancy: occupancyStats(p.id).rate };
    });

  // ---------- actions ----------
  const value: DataContextType = {
    ...state,
    hydrated,

    getProperty: (id) => state.properties.find((p) => p.id === id),
    getBuilding: (id) => state.buildings.find((b) => b.id === id),
    getUnit: (id) => state.units.find((u) => u.id === id),
    getTenant: (id) => state.tenants.find((t) => t.id === id),
    unitLabel: (unitId) => state.units.find((u) => u.id === unitId)?.label ?? "—",
    tenantUnit: (tenantId) => state.units.find((u) => u.id === state.tenants.find((t) => t.id === tenantId)?.unitId),
    tenantLease: (tenantId) => state.leases.find((l) => l.tenantId === tenantId && l.status === "active"),
    buildingUnits: (buildingId) => state.units.filter((u) => u.buildingId === buildingId),
    propertyBuildings: (propertyId) => state.buildings.filter((b) => b.propertyId === propertyId),
    propertyUnits: (propertyId) => state.units.filter((u) => u.propertyId === propertyId),
    propertyTenants: (propertyId) => state.tenants.filter((t) => t.propertyId === propertyId && t.status !== "moved_out"),

    invoiceStates,
    tenantBalance,
    tenantPayments: (tenantId) => state.payments.filter((p) => p.tenantId === tenantId).sort((a, b) => b.date.localeCompare(a.date)),
    tenantDeposit: (tenantId) => state.deposits.find((d) => d.tenantId === tenantId),
    arrears,
    financeStats,
    occupancyStats,
    monthlySeries,
    smartAlerts,
    maintenanceByCategory,
    propertyComparison,

    addProperty: (input) =>
      set((s) => ({ ...s, properties: [...s.properties, { ...input, id: nid("prop"), createdAt: todayISO() }] })),
    addBuilding: (input) => set((s) => ({ ...s, buildings: [...s.buildings, { ...input, id: nid("bld") }] })),
    addUnit: (input) =>
      set((s) => ({ ...s, units: [...s.units, { ...input, id: nid("unit"), statusChangedAt: todayISO() }] })),
    updateUnit: (id, patch, actor = "Landlord") =>
      set((s) => ({
        ...s,
        units: s.units.map((u) => (u.id === id ? { ...u, ...patch, ...(patch.status && patch.status !== u.status ? { statusChangedAt: todayISO() } : {}) } : u)),
        auditLog: patch.status
          ? [{ id: nid("aud"), actor, action: "Unit status changed", detail: `Unit ${s.units.find((u) => u.id === id)?.label} → ${patch.status}`, date: new Date().toISOString() }, ...s.auditLog]
          : s.auditLog,
      })),
    addTenant: (input) => {
      const tenant: Tenant = { ...input, id: nid("tnt") };
      set((s) => ({ ...s, tenants: [...s.tenants, tenant] }));
      return tenant;
    },
    updateTenant: (id, patch) =>
      set((s) => ({ ...s, tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    moveOutTenant: (tenantId, opts = {}) => {
      const tenant = state.tenants.find((t) => t.id === tenantId);
      if (!tenant) return;
      const deposit = state.deposits.find((d) => d.tenantId === tenantId && d.status === "held");
      const damages = opts.damages ?? 0;
      const utils = opts.unpaidUtilities ?? 0;
      set((s) => ({
        ...s,
        tenants: s.tenants.map((t) => (t.id === tenantId ? { ...t, status: "moved_out", moveOutDate: todayISO() } : t)),
        units: s.units.map((u) => (u.id === tenant.unitId ? { ...u, status: "vacant", statusChangedAt: todayISO() } : u)),
        leases: s.leases.map((l) => (l.tenantId === tenantId && l.status === "active" ? { ...l, status: "terminated" } : l)),
        deposits: deposit
          ? s.deposits.map((d) => {
              if (d.id !== deposit.id) return d;
              const deductions = [...d.deductions];
              if (damages > 0) deductions.push({ amount: damages, reason: opts.reason ?? "Damages", date: todayISO() });
              if (utils > 0) deductions.push({ amount: utils, reason: "Unpaid utilities", date: todayISO() });
              const refund = Math.max(0, d.amount - deductions.reduce((x, y) => x + y.amount, 0));
              return { ...d, deductions, refundedAmount: refund, refundDate: todayISO(), status: deductions.length ? "partially_refunded" : "refunded" };
            })
          : s.deposits,
        auditLog: [
          { id: nid("aud"), actor: "Landlord", action: "Tenant moved out", detail: `${tenant.name} vacated ${state.units.find((u) => u.id === tenant.unitId)?.label ?? "unit"}${deposit ? `; deposit refund KES ${Math.max(0, deposit.amount - damages - utils).toLocaleString()}` : ""}`, date: new Date().toISOString() },
          ...s.auditLog,
        ],
      }));
    },
    addLease: (input) => set((s) => ({ ...s, leases: [...s.leases, { ...input, id: nid("lease") }] })),
    terminateLease: (id, actor = "Landlord") =>
      set((s) => ({
        ...s,
        leases: s.leases.map((l) => (l.id === id ? { ...l, status: "terminated" } : l)),
        auditLog: [{ id: nid("aud"), actor, action: "Lease terminated", detail: `Lease ${id} terminated`, date: new Date().toISOString() }, ...s.auditLog],
      })),
    addInvoice: (input) => set((s) => ({ ...s, invoices: [...s.invoices, { ...input, id: nid("inv"), createdAt: todayISO() }] })),
    waiveInvoice: (id, actor = "Landlord") =>
      set((s) => ({
        ...s,
        invoices: s.invoices.map((i) => (i.id === id ? { ...i, waived: true } : i)),
        auditLog: [{ id: nid("aud"), actor, action: "Invoice waived", detail: `Invoice ${id} waived`, date: new Date().toISOString() }, ...s.auditLog],
      })),
    recordPayment: (input, actor = "Landlord") => {
      const tenant = state.tenants.find((t) => t.id === input.tenantId);
      const payment: Payment = {
        id: nid("pay"),
        tenantId: input.tenantId,
        unitId: tenant?.unitId ?? "",
        amount: input.amount,
        date: input.date ?? new Date().toISOString(),
        method: input.method,
        reference: input.reference ?? "",
        receiptNo: `RCPT-${String(state.paymentSeq + 1).padStart(4, "0")}`,
        receivedBy: input.receivedBy ?? actor,
        note: input.note,
      };
      set((s) => ({
        ...s,
        payments: [payment, ...s.payments],
        paymentSeq: s.paymentSeq + 1,
        auditLog: [
          { id: nid("aud"), actor, action: "Payment recorded", detail: `KES ${input.amount.toLocaleString()} from ${tenant?.name ?? "tenant"} (${payment.receiptNo})`, date: new Date().toISOString() },
          ...s.auditLog,
        ],
      }));
      return payment;
    },
    addExpense: (input) => set((s) => ({ ...s, expenses: [{ ...input, id: nid("exp") }, ...s.expenses] })),
    addTicket: (input) => {
      const ticket: MaintenanceTicket = {
        ...input,
        id: nid("mnt"),
        number: `MNT-${String(state.ticketSeq + 1).padStart(5, "0")}`,
        reportedAt: new Date().toISOString(),
      };
      set((s) => ({ ...s, tickets: [ticket, ...s.tickets], ticketSeq: s.ticketSeq + 1 }));
      return ticket;
    },
    updateTicket: (id, patch, actor = "Caretaker") =>
      set((s) => ({
        ...s,
        tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch, ...(patch.status === "completed" ? { completedAt: todayISO() } : {}) } : t)),
        auditLog: patch.status
          ? [{ id: nid("aud"), actor, action: "Ticket updated", detail: `${s.tickets.find((t) => t.id === id)?.number ?? id} → ${patch.status}`, date: new Date().toISOString() }, ...s.auditLog]
          : s.auditLog,
      })),
    addMeterReading: (input) => set((s) => ({ ...s, meterReadings: [{ ...input, id: nid("mtr") }, ...s.meterReadings] })),
    addAnnouncement: (input) =>
      set((s) => ({ ...s, announcements: [{ ...input, id: nid("ann"), createdAt: new Date().toISOString() }, ...s.announcements] })),
    addComplaint: (input) =>
      set((s) => ({ ...s, complaints: [{ ...input, id: nid("cmp"), createdAt: new Date().toISOString() }, ...s.complaints] })),
    updateComplaint: (id, patch) =>
      set((s) => ({ ...s, complaints: s.complaints.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    addVisitor: (input) => set((s) => ({ ...s, visitors: [{ ...input, id: nid("vis") }, ...s.visitors] })),
    checkoutVisitor: (id) =>
      set((s) => ({ ...s, visitors: s.visitors.map((v) => (v.id === id ? { ...v, exitTime: new Date().toISOString() } : v)) })),
    addInspection: (input) => set((s) => ({ ...s, inspections: [{ ...input, id: nid("ins") }, ...s.inspections] })),
    addStaff: (input) => set((s) => ({ ...s, staff: [...s.staff, { ...input, id: nid("stf") }] })),
    updateSettings: (patch) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    logAudit: log,
    resetDemoData: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(SEED_STATE);
    },
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoed = useMemo(() => value, [state, hydrated]);

  return <DataContext.Provider value={memoed}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
