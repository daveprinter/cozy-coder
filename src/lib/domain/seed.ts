import type {
  Announcement,
  AuditEntry,
  Building,
  Complaint,
  Deposit,
  Expense,
  Inspection,
  Invoice,
  Lease,
  MaintenanceTicket,
  MeterReading,
  Payment,
  Property,
  Settings,
  Staff,
  Tenant,
  Unit,
  UnitStatus,
  UnitType,
  Visitor,
} from "./types";

// Deterministic demo dataset: 3 student-focused properties around Nairobi/Juja/Machakos.
// "Today" for the demo is late August 2026.

export interface DomainState {
  properties: Property[];
  buildings: Building[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  invoices: Invoice[];
  payments: Payment[];
  deposits: Deposit[];
  expenses: Expense[];
  tickets: MaintenanceTicket[];
  meterReadings: MeterReading[];
  announcements: Announcement[];
  complaints: Complaint[];
  visitors: Visitor[];
  inspections: Inspection[];
  staff: Staff[];
  auditLog: AuditEntry[];
  settings: Settings;
  paymentSeq: number;
  ticketSeq: number;
}

const TENANT_NAMES = [
  "John Kamau", "Mary Wanjiku", "Peter Ochieng", "Grace Akinyi", "David Kiprop",
  "Faith Njeri", "Samuel Mwangi", "Ann Achieng", "Joseph Mutua", "Esther Chebet",
  "Daniel Otieno", "Lucy Wambui", "Brian Kiptoo", "Sharon Moraa", "Kevin Njoroge",
  "Alice Nyambura", "George Onyango", "Caroline Wafula", "Dennis Kibet", "Mercy Atieno",
  "Patrick Maina", "Rose Njoki", "Collins Omondi", "Beatrice Cherono", "Victor Mwendwa",
  "Naomi Wanjiru", "Felix Kiprono", "Jane Auma", "Moses Karanja", "Cynthia Awuor",
  "Anthony Njuguna", "Pauline Jepkorir", "Stephen Odhiambo", "Margaret Wairimu", "Evans Kiplagat",
  "Dorcas Muthoni", "Kenneth Barasa", "Sheila Njambi", "Francis Mburu", "Gladys Kerubo",
  "Henry Waiganjo", "Irene Nyokabi", "Julius Rotich", "Brenda Adhiambo", "Martin Githinji",
  "Agnes Wavinya", "Robert Kipkoech", "Lydia Wangeci",
];

const COURSES = [
  "BSc Computer Science", "BCom Commerce", "BA Economics", "BSc Nursing",
  "BEd Arts", "LLB Law", "BSc Civil Engineering", "BA Sociology",
];

const MPESA_REFS = [
  "QHX7K2LM9P", "RAB3T8ZK1Q", "SHM4W7ND2R", "TJP5X6QE3S", "UKQ2Y9RF4T",
  "VLR8Z1SG5U", "WMS6A3TH7V", "XNT1B8UJ9W", "YOU4C2VK6X", "ZPV7D5WL1Y",
  "AQW9E3RM2Z", "BER1F6SN4A", "CFS5G2TO8B", "DGT7H4UP3C", "EHU2I9VQ6D",
];

let seq = 0;
const uid = (prefix: string) => `${prefix}_${(++seq).toString(36).padStart(4, "0")}`;

function buildSeed(): DomainState {
  seq = 0;
  const properties: Property[] = [
    {
      id: "prop_amani", name: "Amani Apartments", code: "AMN", type: "apartment",
      address: "Moi Avenue, off University Way", county: "Nairobi", town: "Nairobi",
      nearbySchool: "University of Nairobi", constructionYear: 2018,
      managerName: "Peter Njoroge", caretakerName: "James Mwangi", phone: "0712345000",
      amenities: ["Wi-Fi", "CCTV", "Security", "Borehole", "Backup Generator", "Parking"],
      description: "Modern mid-rise apartments popular with UoN students and young professionals.",
      createdAt: "2026-01-05",
    },
    {
      id: "prop_seku", name: "SEKU Student Residences", code: "SEKU", type: "student_hostel",
      address: "Kwa Vonza, Kitui Road", county: "Machakos", town: "Machakos",
      nearbySchool: "South Eastern Kenya University", constructionYear: 2021,
      managerName: "Peter Njoroge", caretakerName: "Susan Kaluki", phone: "0722334455",
      amenities: ["Wi-Fi", "Study Room", "Water", "Security", "Laundry"],
      description: "Purpose-built student accommodation 1.2 km from the SEKU main gate.",
      createdAt: "2026-01-05",
    },
    {
      id: "prop_gch", name: "Green Court Hostel", code: "GCH", type: "hostel",
      address: "Juja, near JKUAT Gate B", county: "Kiambu", town: "Juja",
      nearbySchool: "JKUAT", constructionYear: 2019,
      managerName: "Peter Njoroge", caretakerName: "David Maina", phone: "0733445566",
      amenities: ["Wi-Fi", "CCTV", "Water", "Garbage Collection", "Common Room"],
      description: "Affordable hostel beds and single rooms walking distance from JKUAT.",
      createdAt: "2026-02-01",
    },
  ];

  const buildings: Building[] = [
    { id: "bld_amani_a", propertyId: "prop_amani", name: "A", code: "AMN-A", floors: 3 },
    { id: "bld_amani_b", propertyId: "prop_amani", name: "B", code: "AMN-B", floors: 2 },
    { id: "bld_seku_a", propertyId: "prop_seku", name: "A", code: "SEKU-A", floors: 2 },
    { id: "bld_seku_b", propertyId: "prop_seku", name: "B", code: "SEKU-B", floors: 2 },
    { id: "bld_seku_c", propertyId: "prop_seku", name: "C", code: "SEKU-C", floors: 2 },
    { id: "bld_gch_a", propertyId: "prop_gch", name: "A", code: "GCH-A", floors: 3 },
  ];

  const FLOOR_NAMES = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];
  const UNITS_PER_FLOOR = 4;

  // rent ranges per property
  const rentFor = (propertyId: string, type: UnitType, unitIdx: number): number => {
    if (propertyId === "prop_amani") return type === "one_bedroom" ? 16000 : type === "bedsitter" ? 12000 : 20000;
    if (propertyId === "prop_seku") return 6500 + (unitIdx % 3) * 1000;
    return 5000 + (unitIdx % 2) * 1500;
  };
  const typeFor = (propertyId: string, unitIdx: number): UnitType => {
    if (propertyId === "prop_amani") return (["bedsitter", "one_bedroom", "one_bedroom", "two_bedroom"] as UnitType[])[unitIdx % 4];
    if (propertyId === "prop_seku") return unitIdx % 4 === 3 ? "shared_room" : "bedsitter";
    return unitIdx % 4 === 0 ? "shared_room" : "single_room";
  };

  // Non-occupied units: deterministic picks. value = status
  const statusOverrides: Record<string, UnitStatus> = {
    "bld_amani_a:2:3": "vacant",
    "bld_amani_b:0:1": "reserved",
    "bld_amani_b:1:2": "maintenance",
    "bld_seku_a:1:0": "vacant",
    "bld_seku_b:0:2": "vacant",
    "bld_seku_b:1:3": "notice",
    "bld_seku_c:0:1": "vacant",
    "bld_seku_c:1:2": "reserved",
    "bld_gch_a:2:0": "vacant",
    "bld_gch_a:1:1": "maintenance",
    "bld_gch_a:0:3": "notice",
  };
  const vacantSince: Record<string, string> = {
    "bld_amani_a:2:3": "2026-07-20",
    "bld_seku_a:1:0": "2026-07-15",
    "bld_seku_b:0:2": "2026-08-10",
    "bld_seku_c:0:1": "2026-06-28",
    "bld_gch_a:2:0": "2026-08-05",
  };

  const units: Unit[] = [];
  for (const b of buildings) {
    for (let f = 0; f < b.floors; f++) {
      for (let u = 0; u < UNITS_PER_FLOOR; u++) {
        const key = `${b.id}:${f}:${u}`;
        const type = typeFor(b.propertyId, u + f);
        const rent = rentFor(b.propertyId, type, u + f);
        const status = statusOverrides[key] ?? "occupied";
        units.push({
          id: uid("unit"),
          propertyId: b.propertyId,
          buildingId: b.id,
          label: `${b.name}-${f}${u === 0 ? "0" : ""}${u + 1}`.replace(/-(\d)(\d)$/, "-$1$2").replace(/^([A-Z])-(\d)(\d)$/, "$1-$2$3"),
          floor: FLOOR_NAMES[f],
          type,
          rent,
          deposit: rent,
          status,
          maxOccupants: type === "shared_room" ? 4 : type === "single_room" || type === "bedsitter" ? 1 : 2,
          furnished: b.propertyId === "prop_gch",
          internet: true,
          waterMeter: `WM-${b.code}-${f}${u}`,
          electricityMeter: `EM-${b.code}-${f}${u}`,
          statusChangedAt: vacantSince[key] ?? "2026-01-10",
        });
      }
    }
  }
  // Fix labels to look like A-101, A-102 (floor+unit number)
  for (const unit of units) {
    const b = buildings.find((x) => x.id === unit.buildingId)!;
    const fIdx = FLOOR_NAMES.indexOf(unit.floor);
    const within = units.filter((x) => x.buildingId === unit.buildingId && x.floor === unit.floor).indexOf(unit);
    unit.label = `${b.name}-${fIdx}${String(within + 1).padStart(2, "0").slice(-1)}`;
  }

  // Tenants for occupied/notice units
  const tenants: Tenant[] = [];
  const leases: Lease[] = [];
  const deposits: Deposit[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  let paymentSeq = 0;
  let nameIdx = 0;

  // Tenants who owe money: unit labels with months unpaid (from June). Others fully paid through July; August split.
  const occupiedUnits = units.filter((u) => u.status === "occupied" || u.status === "notice");
  occupiedUnits.forEach((unit, i) => {
    const name = TENANT_NAMES[nameIdx % TENANT_NAMES.length];
    nameIdx++;
    const b = buildings.find((x) => x.id === unit.buildingId)!;
    const prop = properties.find((p) => p.id === unit.propertyId)!;
    const isStudent = prop.id !== "prop_amani" || i % 2 === 0;
    const moveIn = `2026-0${1 + (i % 4)}-${String(3 + (i % 20)).padStart(2, "0")}`;
    const tenant: Tenant = {
      id: uid("tnt"),
      name,
      nationalId: String(30000000 + i * 137913),
      phone: `07${String(10000000 + i * 7919).slice(0, 8)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`,
      isStudent,
      school: isStudent ? prop.nearbySchool : "",
      course: isStudent ? COURSES[i % COURSES.length] : "",
      regNumber: isStudent ? `${b.code}/S${String(1000 + i)}` : "",
      yearOfStudy: isStudent ? 1 + (i % 4) : 0,
      emergencyContactName: TENANT_NAMES[(nameIdx + 7) % TENANT_NAMES.length],
      emergencyContactPhone: `07${String(20000000 + i * 104729).slice(0, 8)}`,
      unitId: unit.id,
      propertyId: unit.propertyId,
      moveInDate: moveIn,
      status: unit.status === "notice" ? "notice" : "active",
    };
    tenants.push(tenant);

    // Lease: 12 months from move-in. Make a few expire soon (within 30 days of 2026-08-24).
    const expiresSoon = i % 13 === 4;
    leases.push({
      id: uid("lease"),
      tenantId: tenant.id,
      unitId: unit.id,
      startDate: moveIn,
      endDate: expiresSoon ? `2026-09-${String(5 + (i % 20)).padStart(2, "0")}` : `2027-0${1 + (i % 4)}-01`,
      rent: unit.rent,
      deposit: unit.deposit,
      paymentFrequency: "monthly",
      status: "active",
      signedAt: moveIn,
    });

    deposits.push({
      id: uid("dep"),
      tenantId: tenant.id,
      unitId: unit.id,
      amount: unit.deposit,
      datePaid: moveIn,
      reference: MPESA_REFS[i % MPESA_REFS.length],
      deductions: [],
      refundedAmount: 0,
      status: "held",
    });

    // Invoices for May–Aug 2026
    const periods = ["2026-05", "2026-06", "2026-07", "2026-08"];
    for (const period of periods) {
      const dueDate = `${period}-05`;
      const hasPenalty = period === "2026-07" && i % 11 === 3;
      invoices.push({
        id: uid("inv"),
        tenantId: tenant.id,
        unitId: unit.id,
        period,
        amount: unit.rent,
        penaltyAmount: hasPenalty ? 500 : 0,
        dueDate,
        createdAt: `${period}-01`,
      });
    }

    // Payments: everyone paid May & June. July: some unpaid. August: many unpaid (due Sep 5? no — due Aug 5).
    // Pattern by index: %9===2 → owes Jul+Aug; %7===5 → owes Aug; %17===9 → half paid Aug; else paid through Aug.
    const payMonths: { period: string; amount: number }[] = [
      { period: "2026-05", amount: unit.rent },
      { period: "2026-06", amount: unit.rent },
    ];
    if (i % 9 !== 2) payMonths.push({ period: "2026-07", amount: unit.rent + (i % 11 === 3 ? 500 : 0) });
    if (i % 9 !== 2 && i % 7 !== 5) {
      payMonths.push({ period: "2026-08", amount: i % 17 === 9 ? Math.round(unit.rent / 2) : unit.rent });
    }
    for (const pm of payMonths) {
      paymentSeq++;
      const day = String(2 + ((i + paymentSeq) % 12)).padStart(2, "0");
      payments.push({
        id: uid("pay"),
        tenantId: tenant.id,
        unitId: unit.id,
        amount: pm.amount,
        date: `${pm.period}-${day}T10:30:00`,
        method: i % 6 === 0 ? "cash" : i % 8 === 0 ? "bank" : "mpesa",
        reference: MPESA_REFS[(i + paymentSeq) % MPESA_REFS.length],
        receiptNo: `RCPT-${String(paymentSeq).padStart(4, "0")}`,
        receivedBy: i % 6 === 0 ? "Caretaker" : "M-Pesa",
      });
    }
  });

  const expenses: Expense[] = [];
  const expenseSeed: [string, string, number, string][] = [
    ["Security", "Night security guard services", 15000, "SecureHub Ltd"],
    ["Cleaning", "Common area cleaning", 8000, "Sparkle Cleaners"],
    ["Garbage", "Garbage collection", 2500, "County Waste"],
    ["Water", "Borehole pumping & water bill", 6000, "County Water"],
    ["Electricity", "Common area electricity", 4500, "KPLC"],
    ["Staff Salaries", "Caretaker salary", 18000, "Staff"],
    ["Internet", "Fibre internet", 5000, "Safaricom"],
  ];
  for (const prop of properties) {
    for (const period of ["2026-05", "2026-06", "2026-07", "2026-08"]) {
      for (const [cat, desc, base, payee] of expenseSeed) {
        const amount = prop.id === "prop_amani" ? base : prop.id === "prop_seku" ? Math.round(base * 1.2) : Math.round(base * 0.6);
        expenses.push({
          id: uid("exp"),
          propertyId: prop.id,
          category: cat,
          description: desc,
          amount,
          date: `${period}-${String(3 + (cat.length % 20)).padStart(2, "0")}`,
          payee,
        });
      }
    }
  }
  expenses.push(
    { id: uid("exp"), propertyId: "prop_amani", category: "Repairs", description: "Roof leak repair — Block B", amount: 12500, date: "2026-07-14", payee: "Fundi Masters" },
    { id: uid("exp"), propertyId: "prop_seku", category: "Repairs", description: "Water pump service", amount: 8200, date: "2026-08-02", payee: "AquaFix" },
    { id: uid("exp"), propertyId: "prop_gch", category: "Maintenance", description: "Repainting Block A corridor", amount: 6400, date: "2026-07-22", payee: "PaintPro" },
  );

  const ticketUnits = occupiedUnits.slice(0, 10);
  const ticketDefs: [string, string, "low" | "normal" | "high" | "urgent" | "emergency", MaintenanceTicket["status"], number?, number?][] = [
    ["Water leaking under sink", "Plumbing", "high", "completed", 1500, 1500],
    ["Socket sparking in kitchen area", "Electrical", "urgent", "in_progress", 2000],
    ["Door lock broken", "Doors & Locks", "high", "completed", 2200, 2000],
    ["No water since morning", "Water", "emergency", "assigned", 3500],
    ["Window glass cracked", "Other", "normal", "new"],
    ["Shower head blocked", "Plumbing", "normal", "completed", 800, 800],
    ["Corridor light not working", "Electrical", "low", "waiting_parts", 1200],
    ["Bed frame broken", "Furniture", "normal", "in_progress", 2500],
    ["Toilet flush not working", "Plumbing", "high", "new"],
    ["Gate remote not responding", "Security", "urgent", "assigned", 4000],
  ];
  const tickets: MaintenanceTicket[] = ticketDefs.map((t, i) => ({
    id: uid("mnt"),
    number: `MNT-${String(34 + i).padStart(5, "0")}`,
    tenantId: tenants.find((x) => x.unitId === ticketUnits[i].id)?.id,
    unitId: ticketUnits[i].id,
    propertyId: ticketUnits[i].propertyId,
    title: t[0],
    category: t[1],
    priority: t[2],
    description: `${t[0]} — reported by tenant.`,
    status: t[3],
    reportedAt: `2026-08-${String(2 + i * 2).padStart(2, "0")}T09:00:00`,
    assignedTo: t[3] === "new" ? undefined : "Fundi Masters",
    estimatedCost: t[4],
    actualCost: t[5],
    completedAt: t[3] === "completed" ? `2026-08-${String(5 + i * 2).padStart(2, "0")}` : undefined,
  }));

  const meterReadings: MeterReading[] = occupiedUnits.slice(0, 12).map((unit, i) => ({
    id: uid("mtr"),
    unitId: unit.id,
    type: "water",
    previous: 100 + i * 7,
    current: 108 + i * 7,
    date: "2026-08-01",
    cost: 400 + (i % 3) * 50,
  }));

  const announcements: Announcement[] = [
    { id: uid("ann"), title: "Water interruption — Saturday", message: "Water will be unavailable from 10:00 AM to 2:00 PM on Saturday due to tank cleaning. Please store enough water.", audience: "all", priority: "urgent", createdAt: "2026-08-21T08:00:00" },
    { id: uid("ann"), title: "August rent reminder", message: "Kindly note August rent was due on the 5th. A late penalty of KES 500 applies after the grace period.", audience: "all", priority: "normal", createdAt: "2026-08-10T08:00:00" },
    { id: uid("ann"), title: "Security notice", message: "Report any strangers loitering around Block B to the caretaker immediately. Keep gates locked at night.", audience: "property", targetId: "prop_amani", priority: "emergency", createdAt: "2026-08-18T18:30:00" },
  ];

  const complaints: Complaint[] = [
    { id: uid("cmp"), tenantId: tenants[3].id, category: "Noise", description: "Loud music from the unit above past midnight on weekends.", status: "investigating", createdAt: "2026-08-19T21:00:00" },
    { id: uid("cmp"), tenantId: tenants[8].id, category: "Water", description: "Hot water not reaching the 2nd floor showers.", status: "resolved", createdAt: "2026-08-11T07:30:00", resolution: "Solar heater valve replaced on 2026-08-13." },
    { id: uid("cmp"), tenantId: tenants[14].id, category: "Cleanliness", description: "Garbage piling near the back entrance of Block A.", status: "open", createdAt: "2026-08-22T10:15:00" },
  ];

  const visitors: Visitor[] = [
    { id: uid("vis"), tenantId: tenants[1].id, name: "Carol Wanjiru", phone: "0711223344", entryTime: "2026-08-24T09:15:00", idRef: "29887766" },
    { id: uid("vis"), tenantId: tenants[5].id, name: "Mark Oduor", phone: "0722334455", entryTime: "2026-08-24T11:40:00", vehicleReg: "KDJ 452T" },
    { id: uid("vis"), tenantId: tenants[9].id, name: "Sarah Naliaka", phone: "0733445566", entryTime: "2026-08-23T14:00:00", exitTime: "2026-08-23T17:30:00", idRef: "31234567" },
  ];

  const inspections: Inspection[] = [
    { id: uid("ins"), unitId: units.find((u) => u.status === "vacant")!.id, type: "move_out", date: "2026-08-11", inspector: "James Mwangi", condition: "fair", notes: "Wall stains near window; repainting needed before next tenant." },
    { id: uid("ins"), unitId: occupiedUnits[2].id, type: "routine", date: "2026-08-05", inspector: "Susan Kaluki", condition: "good", notes: "All fixtures working. Tenant reminded of waste disposal rules." },
  ];

  const staff: Staff[] = [
    { id: uid("stf"), name: "James Mwangi", phone: "0712345001", role: "caretaker", salary: 18000, propertyId: "prop_amani", schedule: "Mon–Sat, 7am–6pm" },
    { id: uid("stf"), name: "Susan Kaluki", phone: "0722334456", role: "caretaker", salary: 18000, propertyId: "prop_seku", schedule: "Mon–Sat, 7am–6pm" },
    { id: uid("stf"), name: "David Maina", phone: "0733445567", role: "caretaker", salary: 16000, propertyId: "prop_gch", schedule: "Mon–Sat, 7am–6pm" },
    { id: uid("stf"), name: "Otis Security (Kamau)", phone: "0744556677", role: "security", salary: 15000, propertyId: "prop_amani", schedule: "Nights, 6pm–6am" },
    { id: uid("stf"), name: "Esther Wambui", phone: "0755667788", role: "cleaner", salary: 12000, propertyId: "prop_seku", schedule: "Mon–Fri, 8am–2pm" },
  ];

  const auditLog: AuditEntry[] = [
    { id: uid("aud"), actor: "James Mwangi (Caretaker)", action: "Rent updated", detail: "Unit B-102 rent changed from KES 7,500 to KES 8,000", date: "2026-08-22T14:32:00" },
    { id: uid("aud"), actor: "Landlord", action: "Payment recorded", detail: "Cash payment KES 16,000 — A-101", date: "2026-08-21T11:05:00" },
    { id: uid("aud"), actor: "Susan Kaluki (Caretaker)", action: "Vacancy added", detail: "Unit C-101 marked vacant", date: "2026-08-10T09:12:00" },
    { id: uid("aud"), actor: "System", action: "Demo data seeded", detail: "NyumbaLink demo portfolio created", date: "2026-08-24T06:00:00" },
  ];

  return {
    properties,
    buildings,
    units,
    tenants,
    leases,
    invoices,
    payments,
    deposits,
    expenses,
    tickets,
    meterReadings,
    announcements,
    complaints,
    visitors,
    inspections,
    staff,
    auditLog,
    settings: { rentDueDay: 5, graceDays: 5, penaltyType: "fixed", penaltyValue: 500, currency: "KES" },
    paymentSeq,
    ticketSeq: 34 + ticketDefs.length - 1,
  };
}

export const SEED_STATE: DomainState = buildSeed();
