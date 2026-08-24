import React, { useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { useApp } from "@/contexts/AppContext";
import { formatKES, type Staff } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type StaffRole = Staff["role"];

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, staff, properties, getProperty, addStaff, resetDemoData } = useData();
  const { caretakerCodes, landlordCodes, addCaretakerCode, addLandlordCode } = useApp();
  const { toast } = useToast();

  const [rentDueDay, setRentDueDay] = useState(settings.rentDueDay);
  const [graceDays, setGraceDays] = useState(settings.graceDays);
  const [penaltyType, setPenaltyType] = useState(settings.penaltyType);
  const [penaltyValue, setPenaltyValue] = useState(settings.penaltyValue);

  const [staffOpen, setStaffOpen] = useState(false);
  const [sName, setSName] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sRole, setSRole] = useState<StaffRole>("caretaker");
  const [sSalary, setSSalary] = useState("");
  const [sPropertyId, setSPropertyId] = useState(properties[0]?.id ?? "");
  const [sSchedule, setSSchedule] = useState("");

  const [newCaretakerCode, setNewCaretakerCode] = useState("");
  const [newLandlordCode, setNewLandlordCode] = useState("");

  const saveRentSettings = () => {
    updateSettings({ rentDueDay, graceDays, penaltyType, penaltyValue });
    toast({ title: "Rent settings updated" });
  };

  const exampleRent = 8000;
  const examplePenalty =
    penaltyType === "fixed"
      ? penaltyValue
      : penaltyType === "percentage"
      ? Math.round((exampleRent * penaltyValue) / 100)
      : penaltyValue * 3;

  const handleAddStaff = () => {
    if (!sName || !sPropertyId) return;
    addStaff({
      name: sName,
      phone: sPhone,
      role: sRole,
      salary: Number(sSalary) || 0,
      propertyId: sPropertyId,
      schedule: sSchedule,
    });
    setSName("");
    setSPhone("");
    setSRole("caretaker");
    setSSalary("");
    setSSchedule("");
    setStaffOpen(false);
  };

  const handleReset = () => {
    resetDemoData();
    toast({ title: "Demo data reset" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-xl font-heading font-semibold text-foreground">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Rent Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Rent Due Day</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={rentDueDay}
                onChange={(e) => setRentDueDay(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Grace Days</Label>
              <Input type="number" value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Penalty Type</Label>
              <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v as typeof penaltyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Penalty Value</Label>
              <Input type="number" value={penaltyValue} onChange={(e) => setPenaltyValue(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Example: rent {formatKES(exampleRent)}, grace {graceDays} days, penalty {formatKES(examplePenalty)}
          </p>
          <Button className="gradient-primary text-primary-foreground" onClick={saveRentSettings}>
            Save Rent Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading">Staff</CardTitle>
          <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground" size="sm">Add Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={sName} onChange={(e) => setSName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={sPhone} onChange={(e) => setSPhone(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select value={sRole} onValueChange={(v) => setSRole(v as StaffRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["caretaker", "security", "cleaner", "maintenance", "manager", "accountant"] as StaffRole[]).map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Salary</Label>
                    <Input type="number" value={sSalary} onChange={(e) => setSSalary(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Property</Label>
                  <Select value={sPropertyId} onValueChange={setSPropertyId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Schedule</Label>
                  <Input value={sSchedule} onChange={(e) => setSSchedule(e.target.value)} placeholder="e.g. Mon-Sat, 8am-5pm" />
                </div>
              </div>
              <DialogFooter>
                <Button className="gradient-primary text-primary-foreground" onClick={handleAddStaff}>
                  Add Staff
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{s.role}</Badge></TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{getProperty(s.propertyId)?.name ?? "—"}</TableCell>
                  <TableCell>{formatKES(s.salary)}</TableCell>
                  <TableCell>{s.schedule}</TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No staff yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Access Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Caretaker Codes</Label>
            <div className="flex flex-wrap gap-2">
              {caretakerCodes.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCaretakerCode} onChange={(e) => setNewCaretakerCode(e.target.value)} placeholder="New caretaker code" />
              <Button
                variant="outline"
                onClick={() => {
                  if (newCaretakerCode) {
                    addCaretakerCode(newCaretakerCode);
                    setNewCaretakerCode("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Landlord Codes</Label>
            <div className="flex flex-wrap gap-2">
              {landlordCodes.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newLandlordCode} onChange={(e) => setNewLandlordCode(e.target.value)} placeholder="New landlord code" />
              <Button
                variant="outline"
                onClick={() => {
                  if (newLandlordCode) {
                    addLandlordCode(newLandlordCode);
                    setNewLandlordCode("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base font-heading text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive">
                Reset Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase all local changes and restore the original seed data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
