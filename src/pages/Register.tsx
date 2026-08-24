import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagementPanel } from "@/components/ManagementPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Eye, EyeOff } from "lucide-react";

const FLOORS = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor"];

const Register: React.FC = () => {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", nationalId: "",
    floor: "", doorNumber: "", password: "", confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordValid = form.password.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast({ title: "Weak password", description: "At least 6 characters with one special character.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
          national_id: form.nationalId,
          floor: form.floor,
          door_number: form.doorNumber,
        },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        toast({ title: "Email already exists", description: "Please log in instead. Redirecting..." });
        setTimeout(() => navigate({ to: "/login" }), 2000);
      } else {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Welcome to NyumbaLink!", description: "Registration successful." });
      navigate({ to: "/dashboard" });
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <ManagementPanel />
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold text-foreground">NyumbaLink</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">Create Account</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">Join your apartment community</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={e => update("fullName", e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="nationalId">National ID</Label>
              <Input id="nationalId" value={form.nationalId} onChange={e => update("nationalId", e.target.value)} required className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Floor</Label>
                <Select value={form.floor} onValueChange={v => update("floor", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {FLOORS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doorNumber">Door Number</Label>
                <Input id="doorNumber" placeholder="e.g. A5" value={form.doorNumber} onChange={e => update("doorNumber", e.target.value)} required className="mt-1" />
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => update("password", e.target.value)}
                required
                className="mt-1 pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-9 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {form.password && (
                <p className={`text-xs mt-1 ${passwordValid ? "text-success" : "text-destructive"}`}>
                  {passwordValid ? "✓ Strong password" : "Min 6 chars with 1 special character"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} required className="mt-1" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground font-semibold">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
