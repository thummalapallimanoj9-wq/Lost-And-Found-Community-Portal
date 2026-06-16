import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { listMyThreads } from "@/lib/messaging";
import { timeAgo } from "@/lib/items";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Retreiva" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: listMyThreads,
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 text-muted-foreground">Private conversations about items you've posted or replied to.</p>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card">
          {isLoading ? (
            <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !threads || threads.length === 0 ? (
            <div className="grid place-items-center gap-3 py-16 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet.</p>
              <Button asChild variant="hero" size="sm" className="rounded-full"><Link to="/browse">Browse items</Link></Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link to="/messages/$threadId" params={{ threadId: t.id }} className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {t.item_image ? <img src={t.item_image} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium">{t.item_title ?? "Item"}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">{timeAgo(t.last_message_at)}</div>
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        <span className="text-foreground/80">{t.other_name ?? "Member"}</span>
                        {t.last_body ? ` · ${t.last_body}` : " · Start the conversation"}
                      </div>
                    </div>
                    {t.unread > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{t.unread}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}