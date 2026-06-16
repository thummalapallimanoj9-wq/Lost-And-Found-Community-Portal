import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getThread, listMessages, markThreadRead, sendMessage } from "@/lib/messaging";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({ meta: [{ title: "Conversation — Retreiva" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: thread } = useQuery({ queryKey: ["thread", threadId], queryFn: () => getThread(threadId), enabled: !!user });
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => listMessages(threadId),
    enabled: !!user,
    refetchInterval: 4000,
  });

  useEffect(() => { if (user) markThreadRead(threadId); }, [threadId, user, messages?.length]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages?.length]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`thread-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", threadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, user, qc]);

  const send = useMutation({
    mutationFn: () => sendMessage(threadId, body),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["messages", threadId] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 self-start"><Link to="/messages"><ArrowLeft className="h-4 w-4" /> All messages</Link></Button>

        <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4">
          <Link to="/item/$id" params={{ id: thread?.item_id ?? "" }} className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-secondary">
              {thread?.item_image ? <img src={thread.item_image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <div className="font-medium">{thread?.item_title ?? "Item"}</div>
              <div className="text-xs text-muted-foreground">with {thread?.other_name ?? "member"}</div>
            </div>
          </Link>
        </div>

        <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-card p-4" style={{ maxHeight: "60vh" }}>
          {isLoading ? (
            <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (messages?.length ?? 0) === 0 ? (
            <div className="grid place-items-center py-16 text-sm text-muted-foreground">Say hello — be kind and clear.</div>
          ) : (
            messages!.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(); }}
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            maxLength={4000}
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" variant="hero" size="lg" className="rounded-full" disabled={send.isPending || !body.trim()}>
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </section>
    </div>
  );
}