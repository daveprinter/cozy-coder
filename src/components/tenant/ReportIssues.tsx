import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

const CATEGORIES = ["Noise Complaint", "Security Concern", "Water Issue", "Parking", "Other"];

const ReportIssues: React.FC = () => {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [reports, setReports] = useState<Array<{ id: string; category: string; description: string; date: string }>>([]);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!category || !description.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    setReports(prev => [{ id: crypto.randomUUID(), category, description, date: new Date().toISOString().split("T")[0] }, ...prev]);
    setCategory("");
    setDescription("");
    toast({ title: "Issue reported", description: "Management has been notified." });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Report an Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" placeholder="Describe the issue..." />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">Submit Report</Button>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-sm">Your Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 rounded-lg border border-border">
                  <p className="font-medium text-foreground text-sm">{r.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportIssues;
