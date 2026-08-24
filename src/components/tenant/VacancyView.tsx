import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, UserCheck } from "lucide-react";

const UNITS = [
  { door: "A1", floor: "Ground Floor", occupied: true, tenant: "John Kamau" },
  { door: "A2", floor: "Ground Floor", occupied: true, tenant: "Grace Akinyi" },
  { door: "A5", floor: "Ground Floor", occupied: true, tenant: "You" },
  { door: "B3", floor: "1st Floor", occupied: true, tenant: "Mary Wanjiku" },
  { door: "C1", floor: "2nd Floor", occupied: true, tenant: "Peter Ochieng" },
  { door: "D2", floor: "3rd Floor", occupied: false, tenant: null },
  { door: "D4", floor: "3rd Floor", occupied: false, tenant: null },
];

const VacancyView: React.FC = () => {
  const occupied = UNITS.filter(u => u.occupied);
  const vacant = UNITS.filter(u => !u.occupied);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Occupied Units ({occupied.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {occupied.map(u => (
              <div key={u.door} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm">{u.door}</p>
                  <p className="text-xs text-muted-foreground">{u.floor}</p>
                </div>
                <span className="text-xs text-muted-foreground">{u.tenant}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Home className="h-5 w-5 text-success" />
            Vacant Units ({vacant.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vacant.length === 0 ? (
            <p className="text-muted-foreground text-sm">All units are occupied</p>
          ) : (
            <div className="space-y-2">
              {vacant.map(u => (
                <div key={u.door} className="flex items-center justify-between p-3 rounded-lg border border-success/20 bg-success/5">
                  <div>
                    <p className="font-medium text-foreground text-sm">{u.door}</p>
                    <p className="text-xs text-muted-foreground">{u.floor}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">Available</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-heading text-sm">Current Caretaker</CardTitle></CardHeader>
        <CardContent>
          <p className="text-foreground font-medium">Mr. James Mwangi</p>
          <p className="text-muted-foreground text-sm">Available Mon-Sat, 7am-6pm</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VacancyView;
