import { createFileRoute } from "@tanstack/react-router";
import LandlordDashboardPage from "@/pages/LandlordDashboard";

export const Route = createFileRoute("/landlord")({
  head: () => ({
    meta: [
      { title: "Landlord Dashboard — NyumbaLink" },
      {
        name: "description",
        content: "Oversee rent collection, property performance, and caretaker activity from your NyumbaLink landlord dashboard.",
      },
      { property: "og:title", content: "Landlord Dashboard — NyumbaLink" },
      {
        property: "og:description",
        content: "Oversee rent collection, property performance, and caretaker activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandlordDashboardPage,
});
