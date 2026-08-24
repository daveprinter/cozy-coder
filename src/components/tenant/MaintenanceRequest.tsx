import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Clock, CheckCircle, Loader2 } from "lucide-react";

const ISSUE_TYPES = ["Plumbing", "Electricity", "Door Lock", "Paint"];

interface Request {
  id: string;
  type: string;
  description: string;
  photo?: string;
  status: "pending" | "in_progress" | "done";
  date: string;
}

const MaintenanceRequest: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([
    { id: "1", type: "Plumbing", description: "Leaking tap in kitchen", status: "in_progress", date: "2024-04-08" },
  ]);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!issueType) {
      toast({ title: "Select an issue type", variant: "destructive" });
      return;
    }
    const newReq: Request = {
      id: crypto.randomUUID(),
      type: issueType,
      description,
      photo: photo || undefined,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    };
    setRequests(prev => [newReq, ...prev]);
    setIssueType("");
    setDescription("");
    setPhoto(null);
    toast({ title: "Request submitted", description: "Your maintenance request has been filed." });
  };

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-warning" />;
    if (status === "in_progress") return <Loader2 className="h-4 w-4 text-info animate-spin" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="font-heading">New Request</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Issue Type</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select issue" /></SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" placeholder="Describe the issue..." />
          </div>
          <div>
            <Label>Attach Photo (optional)</Label>
            <div className="mt-1">
              <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{photo ? "Photo attached ✓" : "Choose a photo"}</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              {photo && <img src={photo} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">Submit Request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-heading">Your Requests</CardTitle></CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{r.type}</span>
                    <div className="flex items-center gap-1">
                      {statusIcon(r.status)}
                      <span className="text-xs text-muted-foreground capitalize">{r.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{r.date}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceRequest;
