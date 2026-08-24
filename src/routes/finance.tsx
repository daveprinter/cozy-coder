import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import AccountantDashboard from "@/pages/AccountantDashboard";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance Dashboard — NyumbaLink" },
      {
        name: "description",
        content: "Track rent collections, expenses, profit by property and arrears, and export the ledger to CSV.",
      },
      { property: "og:title", content: "Finance Dashboard — NyumbaLink" },
      { property: "og:description", content: "Collections, expenses, profit and arrears in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["landlord", "admin"]}>
      <AccountantDashboard />
    </RoleGuard>
  ),
});
