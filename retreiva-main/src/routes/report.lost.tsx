import { createFileRoute } from "@tanstack/react-router";
import { ReportForm } from "@/components/site/report-form";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const Route = createFileRoute("/report/lost")({
  head: () => ({
    meta: [
      { title: "Report a lost item — Retreiva" },
      { name: "description", content: "Lost something? Post it in under a minute and let smart matching surface possible reunions." },
      { property: "og:title", content: "Report a lost item — Retreiva" },
      { property: "og:description", content: "Post a lost item in under a minute." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <ReportForm mode="lost" />
      <SiteFooter />
    </div>
  ),
});