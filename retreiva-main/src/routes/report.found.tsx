import { createFileRoute } from "@tanstack/react-router";
import { ReportForm } from "@/components/site/report-form";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/report/found")({
  head: () => ({
    meta: [
      { title: "Post a found item — Retreiva" },
      { name: "description", content: "Found something? Post it and help reunite it with its person." },
      { property: "og:title", content: "Post a found item — Retreiva" },
      { property: "og:description", content: "Post a found item and help reunite it." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <ReportForm mode="found" />
      <SiteFooter />
    </div>
  ),
});