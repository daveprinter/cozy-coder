import { createFileRoute } from "@tanstack/react-router";
import IndexPage from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NyumbaLink — Rental Property Management Made Simple" },
      {
        name: "description",
        content:
          "NyumbaLink connects tenants, caretakers, and landlords. Track rent, report maintenance issues, and manage your rental property in one place.",
      },
      { property: "og:title", content: "NyumbaLink — Rental Property Management Made Simple" },
      {
        property: "og:description",
        content:
          "Track rent, report maintenance issues, and manage your rental property in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});
