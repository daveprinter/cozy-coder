import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Shield, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ManagementPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "pin" | "roleSelect" | "caretakerCode" | "landlordCode">("menu");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [roleCode, setRoleCode] = useState("");
  const { managementCode, caretakerCodes, landlordCodes } = useApp();
  const { setRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      const next = document.getElementById(`pin-${index + 1}`);
      next?.focus();
    }
    if (newPin.every(d => d !== "") && newPin.join("") === managementCode) {
      setTimeout(() => setStep("roleSelect"), 300);
    } else if (newPin.every(d => d !== "")) {
      toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
      setPin(["", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    }
  };

  const handleRoleLogin = (role: "caretaker" | "landlord") => {
    const codes = role === "caretaker" ? caretakerCodes : landlordCodes;
    if (codes.includes(roleCode)) {
      setRole(role);
      setOpen(false);
      resetState();
      navigate({ to: role === "caretaker" ? "/caretaker" : "/landlord" });
    } else {
      toast({ title: "Invalid code", description: `Wrong ${role} code.`, variant: "destructive" });
      setRoleCode("");
    }
  };

  const resetState = () => {
    setStep("menu");
    setPin(["", "", "", ""]);
    setRoleCode("");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-card">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">NyumbaLink</SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {step === "menu" && (
            <Button
              onClick={() => setStep("pin")}
              className="w-full justify-start gap-3 h-14 gradient-primary text-primary-foreground"
            >
              <Shield className="h-5 w-5" />
              Management
            </Button>
          )}

          {step === "pin" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-muted-foreground">Enter management access code</p>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <Input
                    key={i}
                    id={`pin-${i}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-bold"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>
          )}

          {step === "roleSelect" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-muted-foreground font-medium">Select your role</p>
              <Button
                onClick={() => setStep("caretakerCode")}
                variant="outline"
                className="w-full h-14 justify-start gap-3 border-primary/30 hover:bg-accent"
              >
                <KeyRound className="h-5 w-5 text-primary" />
                Login as Caretaker
              </Button>
              <Button
                onClick={() => setStep("landlordCode")}
                variant="outline"
                className="w-full h-14 justify-start gap-3 border-secondary/30 hover:bg-accent"
              >
                <KeyRound className="h-5 w-5 text-secondary" />
                Login as Landlord
              </Button>
            </div>
          )}

          {(step === "caretakerCode" || step === "landlordCode") && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-muted-foreground">
                Enter {step === "caretakerCode" ? "caretaker" : "landlord"} code
              </p>
              <Input
                type="password"
                value={roleCode}
                onChange={e => setRoleCode(e.target.value)}
                placeholder="Enter code"
                className="h-12"
                autoFocus
              />
              <Button
                onClick={() => handleRoleLogin(step === "caretakerCode" ? "caretaker" : "landlord")}
                className="w-full h-12 gradient-primary text-primary-foreground"
                disabled={!roleCode}
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
