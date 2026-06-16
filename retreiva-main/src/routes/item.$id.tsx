import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Gift, MessageCircle, Share2, Flag, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { getItem, displayStatus, timeAgo } from "@/lib/items";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateThread } from "@/lib/messaging";
import { toast } from "sonner";

export const Route = createFileRoute("/item/$id")({
  head: () => ({
    meta: [
      { title: "Item — Retreiva" },
      { name: "description", content: "View item details on Retreiva." },
    ],
  }),
  component: ItemPage,
  notFoundComponent: NotFound,
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Something went sideways.</h1>
        <Button asChild variant="hero" className="mt-4 rounded-full"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  ),
});

function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-semibold">Item not found</h1>
        <p className="mt-3 text-muted-foreground">It may have been removed or marked reunited.</p>
        <Button asChild variant="hero" className="mt-6 rounded-full"><Link to="/browse">Back to browse</Link></Button>
      </div>
    </div>
  );
}

function ItemPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: item, isLoading } = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });

  if (isLoading) return (
    <div className="min-h-screen bg-background"><SiteNav /><div className="grid place-items-center py-32 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div></div>
  );
  if (!item) return <NotFound />;

  const status = displayStatus(item);
  const statusLabel = status === "reunited" ? "Reunited" : status[0].toUpperCase() + status.slice(1);
  const isOwner = user?.id === item.user_id;
  const ownerFirst = item.owner_name?.split(" ")[0] ?? "the poster";

  const handleResolve = async () => {
    const next = item.kind === "lost" ? "recovered" : "returned";
    const { error } = await supabase.from("items").update({ status: next }).eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    toast.success(item.kind === "lost" ? "Marked as recovered 💛" : "Marked as returned 💛");
    qc.invalidateQueries({ queryKey: ["item", id] });
    qc.invalidateQueries({ queryKey: ["items"] });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Post deleted");
    qc.invalidateQueries({ queryKey: ["items"] });
    navigate({ to: "/browse" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    catch { toast.error("Could not copy"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/browse"><ArrowLeft className="h-4 w-4" /> Back to browse</Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] w-full bg-secondary" />
              )}
            </div>
            {item.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {item.images.slice(1).map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-2xl border border-border/70 bg-card">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status === "lost" ? "bg-destructive/10 text-destructive" : status === "found" ? "bg-success/15 text-success" : "bg-accent/40 text-foreground"}`}>{statusLabel}</span>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{item.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">{item.category} · Posted {timeAgo(item.created_at)}</div>

            <div className="mt-6 space-y-3 rounded-2xl border border-border/70 bg-card p-5">
              <Row icon={MapPin} label="Location" value={item.location} />
              {item.event_date ? <Row icon={Calendar} label={item.kind === "lost" ? "Lost on" : "Found on"} value={new Date(item.event_date).toLocaleDateString()} /> : null}
              {item.reward ? <Row icon={Gift} label="Reward" value={`$${item.reward}`} /> : null}
              {item.held_at ? <Row icon={MapPin} label="Held at" value={item.held_at} /> : null}
            </div>

            <p className="mt-6 text-foreground/90 leading-relaxed">{item.description}</p>

            {item.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((t) => <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">#{t}</span>)}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {isOwner ? (
                <>
                  {status !== "reunited" && (
                    <Button onClick={handleResolve} variant="hero" size="lg" className="rounded-full"><CheckCircle2 className="h-4 w-4" /> Mark {item.kind === "lost" ? "recovered" : "returned"}</Button>
                  )}
                  <Button onClick={handleDelete} variant="ghost" size="lg" className="rounded-full text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
                </>
              ) : (
                <Button
                  onClick={async () => {
                    if (!user) { navigate({ to: "/auth" }); return; }
                    try {
                      const tid = await getOrCreateThread(item.id, item.user_id);
                      navigate({ to: "/messages/$threadId", params: { threadId: tid } });
                    } catch (e: any) {
                      toast.error(e?.message ?? "Could not start conversation");
                    }
                  }}
                  variant="hero" size="lg" className="rounded-full"
                ><MessageCircle className="h-4 w-4" /> Message {ownerFirst}</Button>
              )}
              <Button onClick={handleShare} variant="soft" size="lg" className="rounded-full"><Share2 className="h-4 w-4" /> Share</Button>
              <Button variant="ghost" size="lg" className="rounded-full text-muted-foreground"><Flag className="h-4 w-4" /> Report</Button>
            </div>

            {item.contact_info && (
              <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/40 p-5 text-sm">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Contact note</div>
                <div className="mt-1 text-foreground">{item.contact_info}</div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/40 p-5 text-sm text-muted-foreground">
              Your contact details are never shared. All conversations happen privately inside Retreiva.
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}