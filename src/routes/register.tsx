import { createFileRoute } from "@tanstack/react-router";
import RegisterPage from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — NyumbaLink" },
      {
        name: "description",
        content: "Register as a tenant, caretaker, or landlord on NyumbaLink and start managing your rental property today.",
      },
      { property: "og:title", content: "Create Account — NyumbaLink" },
      {
        property: "og:description",
        content: "Register as a tenant, caretaker, or landlord on NyumbaLink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});
