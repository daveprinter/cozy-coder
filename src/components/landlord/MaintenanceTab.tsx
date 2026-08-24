import React, { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import {
  formatKES,
  MAINTENANCE_CATEGORIES,
  TICKET_STATUS_LABELS,
  type Priority,
  type TicketStatus,
  type MaintenanceTicket,
} from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wrench, AlertTriangle, CheckCircle2, Wallet } from "lucide-react";

const CLOSED: TicketStatus[] = ["completed", "rejected", "cancelled"];

const PRIORITY_BADGE: Record<Priority, string> = {
  emergency: "text-destructive",
  urgent: "text-destructive",
  high: "text-warning",
  normal: "text-info",
  low: "text-muted-foreground",
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export const MaintenanceTab: React.FC = () => {
  const {
    tickets,
    properties,
    units,
    tenants,
    getUnit,
    unitLabel,
    getProperty,
    addTicket,
    updateTicket,
    maintenanceByCategory,
  } = useData();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceTicket | null>(null);

  // new ticket form
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(MAINTENANCE_CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>("normal");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const openTickets = tickets.filter((t) => !CLOSED.includes(t.status));
  const urgentOpen = openTickets.filter((t) => t.priority === "urgent" || t.priority === "emergency");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const completedThisMonth = tickets.filter(
    (t) => t.status === "completed" && (t.completedAt ?? "").startsWith(thisMonth),
  );
  const totalSpend = tickets
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + (t.actualCost ?? 0), 0);

  const filtered = tickets
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const chartData = maintenanceByCategory();

  const resetForm = () => {
    setUnitId("");
    setTitle("");
    setCategory(MAINTENANCE_CATEGORIES[0]);
    setPriority("normal");
    setDescription("");
    setEstimatedCost("");
  };

  const handleCreate = () => {
    if (!unitId || !title) return;
    const unit = getUnit(unitId);
    if (!unit) return;
    const tenant = tenants.find((t) => t.unitId === unitId && t.status !== "moved_out");
    addTicket({
      unitId,
      propertyId: unit.propertyId,
      tenantId: tenant?.id,
      title,
      category,
      priority,
      description,
      status: "new",
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    });
    resetForm();
    setNewOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-heading font-semibold text-foreground">Maintenance</h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">New Ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Maintenance Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <React.Fragment key={p.id}>
                        {units
                          .filter((u) => u.propertyId === p.id)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {p.name} — {u.label}
                            </SelectItem>
                          ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking tap" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "normal", "high", "urgent", "emergency"] as Priority[]).map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Estimated Cost (KES)</Label>
                <Input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="gradient-primary text-primary-foreground" onClick={handleCreate}>
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Open Tickets</span>
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-heading font-semibold text-foreground">{openTickets.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Urgent + Emergency</span>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-xl font-heading font-semibold text-foreground">{urgentOpen.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed This Month</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <span className="text-xl font-heading font-semibold text-foreground">{completedThisMonth.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Spend</span>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-heading font-semibold text-foreground">{formatKES(totalSpend)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {(["low", "normal", "high", "urgent", "emergency"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filtered.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelected(t)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.number}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.reportedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{t.title}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={PRIORITY_BADGE[t.priority]}>
                        {t.priority}
                      </Badge>
                      <Badge variant="secondary">{TICKET_STATUS_LABELS[t.status]}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
                    <span>{unitLabel(t.unitId)} · {t.category}</span>
                    <span>
                      {t.assignedTo ? `Assigned: ${t.assignedTo}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Est: {t.estimatedCost ? formatKES(t.estimatedCost) : "—"} · Actual: {t.actualCost ? formatKES(t.actualCost) : "—"}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tickets match filters.</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <TicketDetailSheet
        ticket={selected}
        onClose={() => setSelected(null)}
        unitLabel={unitLabel}
        updateTicket={updateTicket}
      />
    </div>
  );
};

const TicketDetailSheet: React.FC<{
  ticket: MaintenanceTicket | null;
  onClose: () => void;
  unitLabel: (id: string | null | undefined) => string;
  updateTicket: ReturnType<typeof useData>["updateTicket"];
}> = ({ ticket, onClose, unitLabel, updateTicket }) => {
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState(ticket?.notes ?? "");

  React.useEffect(() => {
    setNotes(ticket?.notes ?? "");
    setAssignee(ticket?.assignedTo ?? "");
  }, [ticket?.id]);

  if (!ticket) return null;

  const complete = () => {
    const cost = window.prompt("Actual cost (KES)?", String(ticket.estimatedCost ?? ""));
    if (cost === null) return;
    updateTicket(ticket.id, {
      status: "completed",
      actualCost: Number(cost) || 0,
      completedAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Sheet open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{ticket.number} — {ticket.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <span>Unit</span><span className="text-foreground">{unitLabel(ticket.unitId)}</span>
            <span>Category</span><span className="text-foreground">{ticket.category}</span>
            <span>Priority</span><span className="text-foreground">{ticket.priority}</span>
            <span>Status</span><span className="text-foreground">{TICKET_STATUS_LABELS[ticket.status]}</span>
            <span>Reported</span><span className="text-foreground">{new Date(ticket.reportedAt).toLocaleString()}</span>
            <span>Est. Cost</span><span className="text-foreground">{ticket.estimatedCost ? formatKES(ticket.estimatedCost) : "—"}</span>
            <span>Actual Cost</span><span className="text-foreground">{ticket.actualCost ? formatKES(ticket.actualCost) : "—"}</span>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-foreground mt-1">{ticket.description}</p>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <div className="flex gap-2">
              <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Staff name" />
              <Button
                variant="outline"
                onClick={() => updateTicket(ticket.id, { status: "assigned", assignedTo: assignee })}
              >
                Assign
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => updateTicket(ticket.id, { status: "in_progress" })}>
              Start Work
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateTicket(ticket.id, { status: "waiting_parts" })}>
              Waiting for Parts
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={complete}>
              Complete
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateTicket(ticket.id, { status: "rejected" })}>
              Reject
            </Button>
            <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => updateTicket(ticket.id, { status: "cancelled" })}>
              Cancel
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <Button size="sm" variant="outline" onClick={() => updateTicket(ticket.id, { notes })}>
              Save Notes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
