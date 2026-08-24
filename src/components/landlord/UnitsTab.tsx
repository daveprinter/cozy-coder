import React, { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import type { Unit, UnitStatus, UnitType } from "@/lib/domain/types";
import { UNIT_STATUS_LABELS, UNIT_TYPE_LABELS, formatKES } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ALL = "__all__";

const UNIT_STATUSES: UnitStatus[] = ["occupied", "vacant", "reserved", "notice", "maintenance", "cleaning", "unavailable"];
const UNIT_TYPES: UnitType[] = ["bedsitter", "single_room", "one_bedroom", "two_bedroom", "three_bedroom", "shared_room", "commercial"];
const FLOORS = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"];

const statusClasses: Record<UnitStatus, string> = {
  occupied: "bg-success/10 text-success",
  vacant: "bg-muted text-muted-foreground",
  reserved: "bg-info/10 text-info",
  notice: "bg-warning/10 text-warning",
  maintenance: "bg-destructive/10 text-destructive",
  cleaning: "bg-destructive/10 text-destructive",
  unavailable: "bg-muted text-muted-foreground",
};

const AddUnitDialog: React.FC = () => {
  const { properties, buildings, addUnit } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [buildingId, setBuildingId] = useState("");
  const [label, setLabel] = useState("");
  const [floor, setFloor] = useState(FLOORS[0]);
  const [type, setType] = useState<UnitType>("bedsitter");
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [maxOccupants, setMaxOccupants] = useState(1);
  const [furnished, setFurnished] = useState(false);
  const [internet, setInternet] = useState(false);
  const [waterMeter, setWaterMeter] = useState("");
  const [electricityMeter, setElectricityMeter] = useState("");

  const reset = () => {
    setBuildingId("");
    setLabel("");
    setFloor(FLOORS[0]);
    setType("bedsitter");
    setRent(0);
    setDeposit(0);
    setMaxOccupants(1);
    setFurnished(false);
    setInternet(false);
    setWaterMeter("");
    setElectricityMeter("");
  };

  const submit = () => {
    const building = buildings.find((b) => b.id === buildingId);
    if (!building || !label.trim()) {
      toast({ title: "Building and label are required", variant: "destructive" });
      return;
    }
    addUnit({
      propertyId: building.propertyId,
      buildingId: building.id,
      label,
      floor,
      type,
      rent: Number(rent),
      deposit: Number(deposit),
      maxOccupants: Number(maxOccupants),
      furnished,
      internet,
      waterMeter,
      electricityMeter,
      status: "vacant" as const,
    });
    toast({ title: "Unit added", description: `${label} was created.` });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">Add Unit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Unit</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Building</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <React.Fragment key={p.id}>
                    {buildings
                      .filter((b) => b.propertyId === p.id)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {p.name} — {b.name}
                        </SelectItem>
                      ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="A-204" />
          </div>
          <div>
            <Label>Floor</Label>
            <Select value={floor} onValueChange={setFloor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOORS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as UnitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {UNIT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rent (KES)</Label>
            <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
          </div>
          <div>
            <Label>Deposit (KES)</Label>
            <Input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
          </div>
          <div>
            <Label>Max Occupants</Label>
            <Input type="number" value={maxOccupants} onChange={(e) => setMaxOccupants(Number(e.target.value))} />
          </div>
          <div>
            <Label>Water Meter</Label>
            <Input value={waterMeter} onChange={(e) => setWaterMeter(e.target.value)} />
          </div>
          <div>
            <Label>Electricity Meter</Label>
            <Input value={electricityMeter} onChange={(e) => setElectricityMeter(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Furnished</Label>
            <Switch checked={furnished} onCheckedChange={setFurnished} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Internet</Label>
            <Switch checked={internet} onCheckedChange={setInternet} />
          </div>
        </div>
        <DialogFooter>
          <Button className="gradient-primary text-primary-foreground" onClick={submit}>
            Save Unit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UnitSheet: React.FC<{ unit: Unit; onClose: () => void }> = ({ unit, onClose }) => {
  const { tenants, tickets, tenantBalance, updateUnit, getBuilding } = useData();
  const { toast } = useToast();
  const [status, setStatus] = useState<UnitStatus>(unit.status);
  const [rent, setRent] = useState(unit.rent);

  const tenant = tenants.find((t) => t.unitId === unit.id && t.status !== "moved_out");
  const unitTickets = tickets.filter((t) => t.unitId === unit.id);
  const building = getBuilding(unit.buildingId);

  const saveStatus = (v: UnitStatus) => {
    setStatus(v);
    updateUnit(unit.id, { status: v });
    toast({ title: "Status updated", description: `${unit.label} is now ${UNIT_STATUS_LABELS[v]}.` });
  };

  const saveRent = () => {
    updateUnit(unit.id, { rent: Number(rent) });
    toast({ title: "Rent updated", description: `${unit.label} rent set to ${formatKES(rent)}.` });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{unit.label}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-muted-foreground">Building</p>
            <p>{building?.name ?? "—"}</p>
            <p className="text-muted-foreground">Floor</p>
            <p>{unit.floor}</p>
            <p className="text-muted-foreground">Type</p>
            <p>{UNIT_TYPE_LABELS[unit.type]}</p>
            <p className="text-muted-foreground">Rent</p>
            <p>{formatKES(unit.rent)}</p>
            <p className="text-muted-foreground">Deposit</p>
            <p>{formatKES(unit.deposit)}</p>
            <p className="text-muted-foreground">Max Occupants</p>
            <p>{unit.maxOccupants}</p>
            <p className="text-muted-foreground">Furnished</p>
            <p>{unit.furnished ? "Yes" : "No"}</p>
            <p className="text-muted-foreground">Internet</p>
            <p>{unit.internet ? "Yes" : "No"}</p>
            <p className="text-muted-foreground">Water Meter</p>
            <p>{unit.waterMeter || "—"}</p>
            <p className="text-muted-foreground">Electricity Meter</p>
            <p>{unit.electricityMeter || "—"}</p>
            <p className="text-muted-foreground">Status Since</p>
            <p>{unit.statusChangedAt}</p>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-heading mb-2">Current Tenant</p>
            {tenant ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{tenant.name}</p>
                <p className="text-muted-foreground">{tenant.phone}</p>
                <p>Balance: {formatKES(tenantBalance(tenant.id))}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No current tenant.</p>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-heading mb-2">Maintenance History</p>
            {unitTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets for this unit.</p>
            ) : (
              <div className="space-y-2">
                {unitTickets.map((t) => (
                  <div key={t.id} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.number}</span>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                    <p>{t.title}</p>
                    {t.actualCost != null && <p className="text-muted-foreground">Cost: {formatKES(t.actualCost)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Change Status</Label>
            <Select value={status} onValueChange={(v) => saveStatus(v as UnitStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {UNIT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Edit Rent</Label>
            <div className="flex gap-2">
              <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
              <Button onClick={saveRent}>Save</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const UnitsTab: React.FC = () => {
  const { properties, buildings, units, tenants } = useData();
  const [propertyId, setPropertyId] = useState(ALL);
  const [buildingId, setBuildingId] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const filteredBuildings = useMemo(
    () => (propertyId === ALL ? buildings : buildings.filter((b) => b.propertyId === propertyId)),
    [buildings, propertyId],
  );

  const filteredUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          (propertyId === ALL || u.propertyId === propertyId) &&
          (buildingId === ALL || u.buildingId === buildingId) &&
          (statusFilter === ALL || u.status === statusFilter),
      ),
    [units, propertyId, buildingId, statusFilter],
  );

  const grouped = useMemo(() => {
    const byBuilding = new Map<string, Unit[]>();
    for (const u of filteredUnits) {
      const arr = byBuilding.get(u.buildingId) ?? [];
      arr.push(u);
      byBuilding.set(u.buildingId, arr);
    }
    return byBuilding;
  }, [filteredUnits]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-heading">Units</h2>
        <AddUnitDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={propertyId}
          onValueChange={(v) => {
            setPropertyId(v);
            setBuildingId(ALL);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={buildingId} onValueChange={setBuildingId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Buildings</SelectItem>
            {filteredBuildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {UNIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {UNIT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.size === 0 ? (
        <p className="text-sm text-muted-foreground">No units match these filters.</p>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([bId, bUnits]) => {
            const building = buildings.find((b) => b.id === bId);
            const occupied = bUnits.filter((u) => u.status === "occupied" || u.status === "notice").length;
            const byFloor = new Map<string, Unit[]>();
            for (const u of bUnits) {
              const arr = byFloor.get(u.floor) ?? [];
              arr.push(u);
              byFloor.set(u.floor, arr);
            }
            return (
              <Card key={bId} className="p-4 space-y-4">
                <h3 className="font-heading text-lg">
                  {building?.name ?? "Unknown Building"} — {occupied}/{bUnits.length} occupied
                </h3>
                {[...byFloor.entries()].map(([floor, fUnits]) => {
                  const fOccupied = fUnits.filter((u) => u.status === "occupied" || u.status === "notice").length;
                  return (
                    <div key={floor} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {floor} — {fOccupied}/{fUnits.length} occupied
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {fUnits.map((u) => {
                          const t = tenants.find((tn) => tn.unitId === u.id && tn.status !== "moved_out");
                          return (
                            <Card
                              key={u.id}
                              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedUnit(u)}
                            >
                              <p className="font-heading text-lg">{u.label}</p>
                              <p className="text-xs text-muted-foreground">{UNIT_TYPE_LABELS[u.type]}</p>
                              <p className="text-sm mt-1">{formatKES(u.rent)}</p>
                              <Badge className={`mt-2 ${statusClasses[u.status]}`} variant="outline">
                                {UNIT_STATUS_LABELS[u.status]}
                              </Badge>
                              {t && <p className="text-xs text-muted-foreground mt-1 truncate">{t.name}</p>}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}

      {selectedUnit && <UnitSheet unit={selectedUnit} onClose={() => setSelectedUnit(null)} />}
    </div>
  );
};
