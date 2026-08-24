import { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { formatKES, type Lease } from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "renewed", label: "Renewed" },
];

const statusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  if (status === "active") return "default";
  if (status === "renewed") return "secondary";
  if (status === "terminated") return "destructive";
  return "outline";
};

const daysTo = (dateStr: string) => Math.floor((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

const todayISO = () => new Date().toISOString().slice(0, 10);

export function LeasesTab() {
  const { leases, getTenant, unitLabel, terminateLease, addLease } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [renewLease, setRenewLease] = useState<Lease | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [newRent, setNewRent] = useState("");
  const [terminateTarget, setTerminateTarget] = useState<Lease | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leases.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      const tenantName = getTenant(l.tenantId)?.name.toLowerCase() ?? "";
      return tenantName.includes(q);
    });
  }, [leases, search, statusFilter, getTenant]);

  const summary = useMemo(() => {
    const today = todayISO();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      active: leases.filter((l) => l.status === "active").length,
      expiringSoon: leases.filter((l) => l.status === "active" && l.endDate >= today && l.endDate <= in30).length,
      expired: leases.filter((l) => l.status === "expired" || (l.status === "active" && l.endDate < today)).length,
      terminated: leases.filter((l) => l.status === "terminated").length,
    };
  }, [leases]);

  const openRenew = (lease: Lease) => {
    setRenewLease(lease);
    const end = new Date(lease.endDate);
    end.setFullYear(end.getFullYear() + 1);
    setNewEndDate(end.toISOString().slice(0, 10));
    setNewRent(String(lease.rent));
  };

  const handleRenew = () => {
    if (!renewLease || !newEndDate) return;
    terminateLease(renewLease.id);
    addLease({
      tenantId: renewLease.tenantId,
      unitId: renewLease.unitId,
      startDate: todayISO(),
      endDate: newEndDate,
      rent: newRent ? Number(newRent) : renewLease.rent,
      deposit: renewLease.deposit,
      paymentFrequency: renewLease.paymentFrequency,
      status: "active",
      signedAt: todayISO(),
    });
    toast({ title: "Lease renewed", description: `New lease created until ${newEndDate}.` });
    setRenewLease(null);
  };

  const handleTerminate = () => {
    if (!terminateTarget) return;
    terminateLease(terminateTarget.id);
    toast({ title: "Lease terminated" });
    setTerminateTarget(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h2 className="font-heading text-xl font-semibold text-foreground">Leases</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-heading text-2xl font-semibold text-foreground">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Expiring in 30 days</p>
            <p className="font-heading text-2xl font-semibold text-warning">{summary.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className="font-heading text-2xl font-semibold text-destructive">{summary.expired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Terminated</p>
            <p className="font-heading text-2xl font-semibold text-foreground">{summary.terminated}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input placeholder="Search by tenant name..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const days = daysTo(l.endDate);
                return (
                  <TableRow key={l.id}>
                    <TableCell>{getTenant(l.tenantId)?.name ?? "—"}</TableCell>
                    <TableCell>{unitLabel(l.unitId)}</TableCell>
                    <TableCell>{l.startDate}</TableCell>
                    <TableCell>{l.endDate}</TableCell>
                    <TableCell>{formatKES(l.rent)}</TableCell>
                    <TableCell>{formatKES(l.deposit)}</TableCell>
                    <TableCell className="capitalize">{l.paymentFrequency}</TableCell>
                    <TableCell>
                      <span className={days <= 30 ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openRenew(l)} disabled={l.status !== "active"}>
                          Renew
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setTerminateTarget(l)}
                          disabled={l.status !== "active"}
                        >
                          Terminate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    No leases found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!renewLease} onOpenChange={(o) => !o && setRenewLease(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Renew Lease</DialogTitle>
          </DialogHeader>
          {renewLease && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tenant: {getTenant(renewLease.tenantId)?.name} · Unit {unitLabel(renewLease.unitId)}
              </p>
              <div className="space-y-1">
                <Label>New End Date</Label>
                <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>New Rent (optional)</Label>
                <Input type="number" value={newRent} onChange={(e) => setNewRent(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewLease(null)}>
              Cancel
            </Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleRenew}>
              Confirm Renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!terminateTarget} onOpenChange={(o) => !o && setTerminateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Terminate Lease</DialogTitle>
          </DialogHeader>
          {terminateTarget && (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to terminate the lease for{" "}
              <span className="font-medium text-foreground">{getTenant(terminateTarget.tenantId)?.name}</span> (Unit{" "}
              {unitLabel(terminateTarget.unitId)})? This action cannot be undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTerminate}>
              Terminate Lease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
