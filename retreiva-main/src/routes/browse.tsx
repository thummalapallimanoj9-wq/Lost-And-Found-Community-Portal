import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ItemCard } from "@/components/site/item-card";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-items";
import { listItems, displayStatus } from "@/lib/items";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse lost & found items — Retreiva" },
      { name: "description", content: "Search recent lost and found items in your community. Filter by category, status, and location." },
      { property: "og:title", content: "Browse lost & found items — Retreiva" },
      { property: "og:description", content: "Filter and search the community's recent posts." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "lost" | "found" | "reunited">("all");
  const [cat, setCat] = useState<string>("all");

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["items", "all"],
    queryFn: () => listItems({ limit: 100 }),
  });

  const items = useMemo(() => {
    return all.filter((i) => {
      const display = displayStatus(i);
      if (status !== "all" && display !== status) return false;
      if (cat !== "all" && i.category !== cat) return false;
      if (q && !`${i.title} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [all, q, status, cat]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="border-b border-border/60 bg-[image:var(--gradient-hero)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Browse the board</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Every post here is real, recent, and from someone hoping for a kind stranger.</p>

          <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items, tags, or descriptions" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 sm:w-56">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Location" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {(["all", "lost", "found", "reunited"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="mx-2 h-5 w-px bg-border" />
          <button onClick={() => setCat("all")} className={`rounded-full border px-4 py-1.5 text-sm ${cat === "all" ? "border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>All categories</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${cat === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-16 text-center">
            <h3 className="font-display text-2xl font-semibold">Nothing here yet</h3>
            <p className="mt-2 text-muted-foreground">Try a different filter, or be the first to post.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="hero" className="rounded-full"><Link to="/report/lost">Report lost</Link></Button>
              <Button asChild variant="soft" className="rounded-full"><Link to="/report/found">Post found</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => <ItemCard key={it.id} item={it} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}