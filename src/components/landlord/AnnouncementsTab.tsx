import React, { useMemo, useState } from "react";
import { useData } from "@/lib/domain/DataContext";
import { COMPLAINT_CATEGORIES } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Audience = "all" | "property" | "building" | "unit";
type AnnPriority = "normal" | "urgent" | "emergency";

const PRIORITY_BORDER: Record<AnnPriority, string> = {
  emergency: "border-l-4 border-l-destructive",
  urgent: "border-l-4 border-l-warning",
  normal: "border-l-4 border-l-primary",
};

export const AnnouncementsTab: React.FC = () => {
  const {
    announcements,
    complaints,
    auditLog,
    properties,
    buildings,
    units,
    unitLabel,
    getTenant,
    addAnnouncement,
    updateComplaint,
  } = useData();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<AnnPriority>("normal");
  const [audience, setAudience] = useState<Audience>("all");
  const [targetId, setTargetId] = useState<string>("");

  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const targetOptions = useMemo(() => {
    if (audience === "property") return properties.map((p) => ({ id: p.id, label: p.name }));
    if (audience === "building") return buildings.map((b) => ({ id: b.id, label: b.name }));
    if (audience === "unit") return units.map((u) => ({ id: u.id, label: u.label }));
    return [];
  }, [audience, properties, buildings, units]);

  const handleSend = () => {
    if (!title || !message) return;
    addAnnouncement({
      title,
      message,
      priority,
      audience,
      targetId: audience === "all" ? undefined : targetId || undefined,
    });
    toast({ title: "Announcement sent" });
    setTitle("");
    setMessage("");
    setPriority("normal");
    setAudience("all");
    setTargetId("");
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sortedAudit = [...auditLog].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-xl font-heading font-semibold text-foreground">Announcements &amp; Communication</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water shutdown notice" />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as AnnPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Audience</Label>
              <Select
                value={audience}
                onValueChange={(v) => {
                  setAudience(v as Audience);
                  setTargetId("");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience !== "all" && (
              <div className="space-y-1">
                <Label>Target</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                  <SelectContent>
                    {targetOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button className="gradient-primary text-primary-foreground" onClick={handleSend}>
            Send Announcement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Announcements Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedAnnouncements.map((a) => (
            <div key={a.id} className={cn("bg-muted/40 rounded-md p-3", PRIORITY_BORDER[a.priority])}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-foreground mt-1">{a.message}</p>
              <span className="text-xs text-muted-foreground capitalize">Audience: {a.audience}</span>
            </div>
          ))}
          {sortedAnnouncements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No announcements yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Complaints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {complaints.map((c) => {
            const tenant = getTenant(c.tenantId);
            return (
              <div key={c.id} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium text-foreground">{tenant?.name ?? "Unknown Tenant"}</span>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">{c.category}</Badge>
                    <Badge variant="secondary" className="capitalize">{c.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.status !== "resolved" && (
                    <div className="flex gap-2">
                      {c.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateComplaint(c.id, { status: "investigating" })}>
                          Investigate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="gradient-primary text-primary-foreground"
                        onClick={() => {
                          setResolveOpen(c.id);
                          setResolution("");
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
                {c.resolution && (
                  <p className="text-xs text-success">Resolution: {c.resolution}</p>
                )}
              </div>
            );
          })}
          {complaints.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No complaints.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedAudit.map((e) => (
              <div key={e.id} className="text-sm text-muted-foreground border-b border-border pb-2 last:border-0">
                <span className="text-foreground font-medium">{e.actor}</span> — {e.action}: {e.detail}
                <span className="block text-xs">{new Date(e.date).toLocaleString()}</span>
              </div>
            ))}
            {sortedAudit.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No activity recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!resolveOpen} onOpenChange={(o) => !o && setResolveOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                if (resolveOpen) updateComplaint(resolveOpen, { status: "resolved", resolution });
                setResolveOpen(null);
              }}
            >
              Save Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
