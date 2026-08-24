import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Building2, LogOut, BarChart3, Building, Grid3X3, Users, FileText,
  Wallet, CreditCard, Receipt, Wrench, Megaphone, LineChart, Settings,
} from "lucide-react";
import { OverviewTab } from "@/components/landlord/OverviewTab";
import { ReportsTab } from "@/components/landlord/ReportsTab";
import { PropertiesTab } from "@/components/landlord/PropertiesTab";
import { UnitsTab } from "@/components/landlord/UnitsTab";
import { TenantsTab } from "@/components/landlord/TenantsTab";
import { LeasesTab } from "@/components/landlord/LeasesTab";
import { RentTab } from "@/components/landlord/RentTab";
import { PaymentsTab } from "@/components/landlord/PaymentsTab";
import { ExpensesTab } from "@/components/landlord/ExpensesTab";
import { MaintenanceTab } from "@/components/landlord/MaintenanceTab";
import { AnnouncementsTab } from "@/components/landlord/AnnouncementsTab";
import { SettingsTab } from "@/components/landlord/SettingsTab";

type Tab =
  | "overview" | "properties" | "units" | "tenants" | "leases"
  | "rent" | "payments" | "expenses" | "maintenance"
  | "announcements" | "reports" | "settings";

const LandlordDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { apartmentName } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "properties", label: "Properties", icon: Building },
    { id: "units", label: "Units", icon: Grid3X3 },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "leases", label: "Leases", icon: FileText },
    { id: "rent", label: "Rent", icon: Wallet },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "announcements", label: "Comms", icon: Megaphone },
    { id: "reports", label: "Reports", icon: LineChart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero p-4 pb-6 text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-heading text-lg font-bold">NyumbaLink</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="font-heading text-xl font-bold">Landlord Dashboard</h1>
          <p className="text-primary-foreground/80 text-sm">{apartmentName} — Portfolio Overview</p>
        </div>
      </header>

      <nav className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-6xl mx-auto flex gap-1 p-2 overflow-x-auto">
          {navItems.map(item => (
            <Button
              key={item.id}
              variant={tab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(item.id)}
              className={`gap-2 flex-shrink-0 ${tab === item.id ? "gradient-primary text-primary-foreground" : ""}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <main className="p-4 animate-fade-in">
        {tab === "overview" && <OverviewTab />}
        {tab === "properties" && <PropertiesTab />}
        {tab === "units" && <UnitsTab />}
        {tab === "tenants" && <TenantsTab />}
        {tab === "leases" && <LeasesTab />}
        {tab === "rent" && <RentTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "expenses" && <ExpensesTab />}
        {tab === "maintenance" && <MaintenanceTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
};

export default LandlordDashboard;
