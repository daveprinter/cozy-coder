import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ManagementPanel } from "@/components/ManagementPanel";
import { Building2, ArrowRight } from "lucide-react";

const Index: React.FC = () => {
  const navigate = useNavigate();

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

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-fade-in space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-lg">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground leading-tight">
            NyumbaLink
          </h1>
          <p className="text-muted-foreground text-lg">
            Your smart apartment rental management platform. Pay rent, request maintenance, and stay connected with your community.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="h-14 text-lg font-semibold gradient-primary text-primary-foreground gap-2"
            >
              Log In <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate({ to: "/register" })}
              variant="outline"
              className="h-14 text-lg font-semibold border-primary/30 text-primary hover:bg-accent"
            >
              Create Account
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border">
        NyumbaLink © {new Date().getFullYear()} • Smart Living, Simplified
      </footer>
    </div>
  );
};

export default Index;
