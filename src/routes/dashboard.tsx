import { createFileRoute } from "@tanstack/react-router";
import TenantDashboardPage from "@/pages/TenantDashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tenant Dashboard — NyumbaLink" },
      {
        name: "description",
        content: "Track your rent payments, view arrears, and report maintenance issues from your NyumbaLink tenant dashboard.",
      },
      { property: "og:title", content: "Tenant Dashboard — NyumbaLink" },
      {
        property: "og:description",
        content: "Track rent, view arrears, and report maintenance issues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TenantDashboardPage,
});
