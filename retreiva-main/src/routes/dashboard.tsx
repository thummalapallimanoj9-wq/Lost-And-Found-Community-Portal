import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, PackageOpen, Plus } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/site/item-card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { ItemRow } from "@/lib/items";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Retreiva" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["my-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ItemRow[];
    },
    enabled: !!user,
  });

  const active = items?.filter((i) => i.status === "active") ?? [];
  const reunited = items?.filter((i) => i.status === "recovered" || i.status === "returned") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
            <p className="mt-2 text-muted-foreground">Your posts, conversations, and reunited items.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="soft" className="rounded-full"><Link to="/messages">Messages</Link></Button>
            <Button asChild variant="hero" className="rounded-full"><Link to="/report/lost"><Plus className="h-4 w-4" /> New post</Link></Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Active posts" value={active.length} />
          <Stat label="Reunited" value={reunited.length} />
          <Stat label="Total posts" value={items?.length ?? 0} />
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold">Active posts</h2>
        {isLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : active.length === 0 ? (
          <Empty />
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((it) => <ItemCard key={it.id} item={{ ...it, owner_name: profile?.full_name ?? null }} />)}
          </div>
        )}

        {reunited.length > 0 && (
          <>
            <h2 className="mt-12 font-display text-2xl font-semibold">Reunited</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reunited.map((it) => <ItemCard key={it.id} item={{ ...it, owner_name: profile?.full_name ?? null }} />)}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="mt-4 grid place-items-center gap-3 rounded-3xl border border-dashed border-border/70 bg-card py-16 text-center">
      <PackageOpen className="h-8 w-8 text-muted-foreground" />
      <p className="text-muted-foreground">No active posts yet.</p>
      <div className="flex gap-2">
        <Button asChild variant="hero" size="sm" className="rounded-full"><Link to="/report/lost">Report lost</Link></Button>
        <Button asChild variant="soft" size="sm" className="rounded-full"><Link to="/report/found">Post found</Link></Button>
      </div>
    </div>
  );
}