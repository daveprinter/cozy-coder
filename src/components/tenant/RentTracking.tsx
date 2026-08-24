import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";

const MONTHS = [
  { month: "April 2024", amount: 15000, paid: false, dueDate: "2024-04-05" },
  { month: "March 2024", amount: 15000, paid: true, dueDate: "2024-03-05", paidDate: "2024-03-03" },
  { month: "February 2024", amount: 15000, paid: true, dueDate: "2024-02-05", paidDate: "2024-02-04" },
  { month: "January 2024", amount: 15000, paid: true, dueDate: "2024-01-05", paidDate: "2024-01-02" },
];

const RentTracking: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
            <CreditCard className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Month</p>
            <p className="text-2xl font-bold text-foreground font-heading">KES 15,000</p>
            <p className="text-xs text-destructive font-medium">Unpaid • Due Apr 5</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-heading">Payment History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MONTHS.map(m => (
              <div key={m.month} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {m.paid ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">{m.month}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.paid ? `Paid on ${m.paidDate}` : `Due ${m.dueDate}`}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-foreground text-sm">KES {m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentTracking;
