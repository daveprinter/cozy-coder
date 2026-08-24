import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Eye, EyeOff } from "lucide-react";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast({ title: "Invalid link", description: "This reset link is invalid or expired.", variant: "destructive" });
    }
  }, []);

  const passwordValid = password.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast({ title: "Weak password", description: "Min 6 chars with 1 special character.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You can now log in." });
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold text-foreground">NyumbaLink</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-6">Set New Password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-9 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {password && (
                <p className={`text-xs mt-1 ${passwordValid ? "text-success" : "text-destructive"}`}>
                  {passwordValid ? "✓ Strong password" : "Min 6 chars with 1 special character"}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground font-semibold">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
