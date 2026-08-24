import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

const ARREARS = [
  { month: "April 2024", amount: 15000, status: "overdue", daysLate: 6 },
];

const RentArrearsView: React.FC = () => {
  const totalArrears = ARREARS.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-4">
      <Card className={totalArrears > 0 ? "border-destructive/30" : "border-success/30"}>
        <CardContent className="p-4 text-center">
          {totalArrears > 0 ? (
            <>
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-3xl font-bold text-destructive font-heading">KES {totalArrears.toLocaleString()}</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <p className="text-lg font-bold text-success font-heading">All Clear!</p>
              <p className="text-sm text-muted-foreground">No outstanding payments</p>
            </>
          )}
        </CardContent>
      </Card>

      {ARREARS.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading">Arrears Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ARREARS.map(a => (
                <div key={a.month} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm">{a.month}</p>
                    <span className="font-bold text-destructive">KES {a.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-destructive mt-1">{a.daysLate} days overdue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RentArrearsView;
