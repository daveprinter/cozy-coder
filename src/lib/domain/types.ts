// NyumbaLink domain model — shared by all dashboards.
// Mirrors supabase/migrations/20260824000001_nyumbalink_schema.sql.

export type UnitStatus =
  | "occupied"
  | "vacant"
  | "reserved"
  | "notice"
  | "maintenance"
  | "cleaning"
  | "unavailable";

export type UnitType =
  | "bedsitter"
  | "single_room"
  | "one_bedroom"
  | "two_bedroom"
  | "three_bedroom"
  | "shared_room"
  | "commercial";

export type PropertyType =
  | "apartment"
  | "hostel"
  | "student_hostel"
  | "bedsitter_block"
  | "single_rooms"
  | "maisonette"
  | "house"
  | "commercial"
  | "mixed_use";

export type TenantStatus = "active" | "notice" | "moved_out";
export type LeaseStatus = "active" | "expired" | "terminated" | "renewed";
export type PaymentMethod = "mpesa" | "bank" | "cash" | "card" | "other";
export type TicketStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "waiting_parts"
  | "completed"
  | "rejected"
  | "cancelled";
export type Priority = "low" | "normal" | "high" | "urgent" | "emergency";
export type InvoiceStatus = "paid" | "partial" | "unpaid" | "overdue" | "waived" | "disputed";

export interface Property {
  id: string;
  name: string;
  code: string;
  type: PropertyType;
  address: string;
  county: string;
  town: string;
  nearbySchool: string;
  constructionYear: number;
  managerName: string;
  caretakerName: string;
  phone: string;
  amenities: string[];
  description: string;
  createdAt: string;
}

export interface Building {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  floors: number; // number of floors including ground
}

export interface Unit {
  id: string;
  propertyId: string;
  buildingId: string;
  label: string; // e.g. "A-204"
  floor: string; // e.g. "2nd Floor"
  type: UnitType;
  rent: number;
  deposit: number;
  status: UnitStatus;
  maxOccupants: number;
  furnished: boolean;
  internet: boolean;
  waterMeter: string;
  electricityMeter: string;
  statusChangedAt: string; // ISO date — used for "vacant for N days" alerts
}

export interface Tenant {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  isStudent: boolean;
  school: string;
  course: string;
  regNumber: string;
  yearOfStudy: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  unitId: string | null;
  propertyId: string;
  moveInDate: string;
  moveOutDate?: string;
  status: TenantStatus;
}

export interface Lease {
  id: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  paymentFrequency: "monthly" | "quarterly" | "semester";
  status: LeaseStatus;
  signedAt?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  unitId: string;
  period: string; // "2026-08"
  amount: number;
  penaltyAmount: number;
  dueDate: string; // ISO date
  createdAt: string;
  waived?: boolean;
  disputed?: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  date: string; // ISO datetime
  method: PaymentMethod;
  reference: string;
  receiptNo: string;
  receivedBy: string;
  note?: string;
}

export interface DepositDeduction {
  amount: number;
  reason: string;
  date: string;
}

export interface Deposit {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  datePaid: string;
  reference: string;
  deductions: DepositDeduction[];
  refundedAmount: number;
  refundDate?: string;
  status: "held" | "partially_refunded" | "refunded" | "forfeited";
}

export interface Expense {
  id: string;
  propertyId: string;
  buildingId?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  payee?: string;
}

export interface MaintenanceTicket {
  id: string;
  number: string; // MNT-00034
  tenantId?: string;
  unitId: string;
  propertyId: string;
  title: string;
  category: string; // Plumbing, Electrical, ...
  priority: Priority;
  description: string;
  status: TicketStatus;
  reportedAt: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: string;
  notes?: string;
}

export interface MeterReading {
  id: string;
  unitId: string;
  type: "water" | "electricity";
  previous: number;
  current: number;
  date: string;
  cost: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: "all" | "property" | "building" | "unit";
  targetId?: string;
  priority: "normal" | "urgent" | "emergency";
  createdAt: string;
}

export interface Complaint {
  id: string;
  tenantId: string;
  category: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  createdAt: string;
  resolution?: string;
}

export interface Visitor {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  entryTime: string;
  exitTime?: string;
  idRef?: string;
  vehicleReg?: string;
}

export interface Inspection {
  id: string;
  unitId: string;
  type: "move_in" | "move_out" | "routine" | "emergency" | "safety" | "maintenance";
  date: string;
  inspector: string;
  condition: "excellent" | "good" | "fair" | "poor";
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: "caretaker" | "security" | "cleaner" | "maintenance" | "manager" | "accountant";
  salary: number;
  propertyId: string;
  schedule: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  detail: string;
  date: string;
}

export interface Settings {
  rentDueDay: number; // day of month
  graceDays: number;
  penaltyType: "fixed" | "percentage" | "daily";
  penaltyValue: number;
  currency: string;
}

// ---- Selector result shapes ----

export interface OccupancyStats {
  total: number;
  occupied: number;
  vacant: number;
  reserved: number;
  notice: number;
  maintenance: number;
  rate: number; // 0-100
}

export interface FinanceStats {
  expectedThisMonth: number;
  collectedThisMonth: number;
  outstanding: number;
  overdue: number;
  depositsHeld: number;
  expensesThisMonth: number;
  netIncome: number;
  collectionRate: number; // 0-100
  activeTenants: number;
  newTenantsThisMonth: number;
  moveOutsThisMonth: number;
  leasesExpiringSoon: number; // within 30 days
  openTickets: number;
}

export interface ArrearEntry {
  tenant: Tenant;
  unit: Unit | null;
  amountOwed: number;
  daysOverdue: number;
  lastPaymentDate?: string;
}

export interface MonthlyPoint {
  month: string; // "May"
  income: number;
  expenses: number;
}

export interface SmartAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface InvoiceState extends Invoice {
  paidAmount: number;
  status: InvoiceStatus;
}

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  reserved: "Reserved",
  notice: "Notice Given",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
  unavailable: "Unavailable",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_parts: "Waiting for Parts",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  bedsitter: "Bedsitter",
  single_room: "Single Room",
  one_bedroom: "1 Bedroom",
  two_bedroom: "2 Bedroom",
  three_bedroom: "3 Bedroom",
  shared_room: "Shared Room",
  commercial: "Commercial",
};

export const EXPENSE_CATEGORIES = [
  "Repairs",
  "Maintenance",
  "Security",
  "Cleaning",
  "Staff Salaries",
  "Electricity",
  "Water",
  "Internet",
  "Taxes",
  "Insurance",
  "Management Fees",
  "Supplies",
  "Garbage",
  "Other",
];

export const MAINTENANCE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Doors & Locks",
  "Water",
  "Painting",
  "Appliances",
  "Furniture",
  "Security",
  "Other",
];

export const COMPLAINT_CATEGORIES = [
  "Noise",
  "Security",
  "Water",
  "Electricity",
  "Cleanliness",
  "Neighbours",
  "Maintenance",
  "Staff",
  "Other",
];

export function formatKES(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString("en-KE")}`;
}
