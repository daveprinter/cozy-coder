import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import AdminDashboard from "@/pages/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin Console — NyumbaLink" },
      {
        name: "description",
        content: "Manage accounts, assign roles, monitor system activity and search the whole rental portfolio.",
      },
      { property: "og:title", content: "Super Admin Console — NyumbaLink" },
      { property: "og:description", content: "Accounts, roles, activity and portfolio-wide search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <AdminDashboard />
    </RoleGuard>
  ),
});
