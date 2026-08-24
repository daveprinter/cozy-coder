import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";

export type AppRole = "admin" | "landlord" | "caretaker" | "tenant";

/**
 * Guards a dashboard so only users holding one of `allow` roles can view it.
 *
 * Roles are read from the backend `user_roles` table (never from client
 * storage). Until a user has been granted a role there, we fall back to the
 * locally selected demo role so existing demo accounts keep working.
 */
export const RoleGuard: React.FC<{
  allow: AppRole[];
  children: React.ReactNode;
}> = ({ allow, children }) => {
  const { user, loading, role: demoRole } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    let active = true;
    if (loading) return;

    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!active) return;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const effective: AppRole[] = roles.length > 0 ? roles : [demoRole as AppRole];
      setGranted(effective.some((r) => allow.includes(r) || r === "admin"));
      setChecking(false);
    })();

    return () => {
      active = false;
    };
  }, [user, loading, demoRole, allow, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!granted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="glow-card border-0 max-w-md w-full p-8 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 mx-auto text-secondary" />
          <h1 className="font-heading text-xl font-bold text-foreground">Access restricted</h1>
          <p className="text-sm text-muted-foreground">
            Your account does not have permission to open this dashboard. Contact your
            landlord or the system administrator if you believe this is a mistake.
          </p>
          <Button className="gradient-primary text-primary-foreground" onClick={() => navigate({ to: "/" })}>
            Back to home
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
