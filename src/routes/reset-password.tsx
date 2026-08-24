import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordPage from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — NyumbaLink" },
      {
        name: "description",
        content: "Choose a new password for your NyumbaLink account.",
      },
      { property: "og:title", content: "Reset Password — NyumbaLink" },
      {
        property: "og:description",
        content: "Choose a new password for your NyumbaLink account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});
