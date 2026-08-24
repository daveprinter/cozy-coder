import React, { useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import type { Property, PropertyType } from "@/lib/domain/types";
import { formatKES } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "hostel",
  "student_hostel",
  "bedsitter_block",
  "single_rooms",
  "maisonette",
  "house",
  "commercial",
  "mixed_use",
];

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  hostel: "Hostel",
  student_hostel: "Student Hostel",
  bedsitter_block: "Bedsitter Block",
  single_rooms: "Single Rooms",
  maisonette: "Maisonette",
  house: "House",
  commercial: "Commercial",
  mixed_use: "Mixed Use",
};

const emptyProperty = {
  name: "",
  code: "",
  type: "apartment" as PropertyType,
  address: "",
  county: "",
  town: "",
  nearbySchool: "",
  constructionYear: new Date().getFullYear(),
  managerName: "",
  caretakerName: "",
  phone: "",
  description: "",
  amenities: "",
};

const AddPropertyDialog: React.FC = () => {
  const { addProperty } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyProperty);

  const set = (k: keyof typeof emptyProperty, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast({ title: "Name and code are required", variant: "destructive" });
      return;
    }
    addProperty({
      name: form.name,
      code: form.code,
      type: form.type,
      address: form.address,
      county: form.county,
      town: form.town,
      nearbySchool: form.nearbySchool,
      constructionYear: Number(form.constructionYear),
      managerName: form.managerName,
      caretakerName: form.caretakerName,
      phone: form.phone,
      description: form.description,
      amenities: form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    });
    toast({ title: "Property added", description: `${form.name} was created.` });
    setForm(emptyProperty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">Add Property</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Property</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <Label>County</Label>
            <Input value={form.county} onChange={(e) => set("county", e.target.value)} />
          </div>
          <div>
            <Label>Town</Label>
            <Input value={form.town} onChange={(e) => set("town", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Nearby School</Label>
            <Input value={form.nearbySchool} onChange={(e) => set("nearbySchool", e.target.value)} />
          </div>
          <div>
            <Label>Construction Year</Label>
            <Input
              type="number"
              value={form.constructionYear}
              onChange={(e) => set("constructionYear", e.target.value)}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label>Manager Name</Label>
            <Input value={form.managerName} onChange={(e) => set("managerName", e.target.value)} />
          </div>
          <div>
            <Label>Caretaker Name</Label>
            <Input value={form.caretakerName} onChange={(e) => set("caretakerName", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Amenities (comma-separated)</Label>
            <Input value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Wifi, Parking, CCTV" />
          </div>
        </div>
        <DialogFooter>
          <Button className="gradient-primary text-primary-foreground" onClick={submit}>
            Save Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddBuildingDialog: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const { addBuilding } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [floors, setFloors] = useState(1);

  const submit = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    addBuilding({ propertyId, name, code, floors: Number(floors) });
    toast({ title: "Building added", description: `${name} was created.` });
    setName("");
    setCode("");
    setFloors(1);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Building
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add Building</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label>Floors</Label>
            <Input type="number" value={floors} onChange={(e) => setFloors(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button className="gradient-primary text-primary-foreground" onClick={submit}>
            Save Building
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { occupancyStats, propertyBuildings, buildingUnits, propertyUnits } = useData();
  const stats = occupancyStats(property.id);
  const rentRoll = propertyUnits(property.id)
    .filter((u) => u.status === "occupied" || u.status === "notice")
    .reduce((s, u) => s + u.rent, 0);
  const buildings = propertyBuildings(property.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="font-heading text-lg">{property.name}</CardTitle>
              <Badge variant="secondary">{property.code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{PROPERTY_TYPE_LABELS[property.type]}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            {property.town}, {property.county}
          </p>
          <p>Near: {property.nearbySchool || "—"}</p>
          <p>Phone: {property.phone}</p>
          <p>
            Manager: {property.managerName || "—"} · Caretaker: {property.caretakerName || "—"}
          </p>
        </div>
        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.map((a) => (
              <Badge key={a} variant="outline">
                {a}
              </Badge>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center">
          <div>
            <p className="text-lg font-heading">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Units</p>
          </div>
          <div>
            <p className="text-lg font-heading">{stats.rate}%</p>
            <p className="text-xs text-muted-foreground">Occupied</p>
          </div>
          <div>
            <p className="text-lg font-heading">{stats.vacant}</p>
            <p className="text-xs text-muted-foreground">Vacant</p>
          </div>
        </div>
        <p className="text-sm font-medium">Rent roll: {formatKES(rentRoll)}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-heading">Buildings</p>
            <AddBuildingDialog propertyId={property.id} />
          </div>
          {buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No buildings yet.</p>
          ) : (
            <div className="space-y-1">
              {buildings.map((b) => {
                const units = buildingUnits(b.id);
                const occupied = units.filter((u) => u.status === "occupied" || u.status === "notice").length;
                return (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{b.name}</span>{" "}
                      <span className="text-muted-foreground">({b.code})</span>
                    </div>
                    <div className="text-muted-foreground">
                      {b.floors} floors · {occupied}/{units.length} occupied
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PropertiesTab: React.FC = () => {
  const { properties } = useData();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading">Properties</h2>
        <AddPropertyDialog />
      </div>
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties yet. Add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};
