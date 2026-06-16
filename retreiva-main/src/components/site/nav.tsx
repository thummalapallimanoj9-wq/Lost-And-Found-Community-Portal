import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, MessageCircle, Bell, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { listNotifications, markAllNotificationsRead } from "@/lib/messaging";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function SiteNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);

  const { data: notifs, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(10),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unread = (notifs ?? []).filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/retreive.logo"
            alt="Retreiva logo"
            className="h-8 w-8 rounded-xl object-contain"
          />
          <span className="font-display text-lg font-semibold tracking-tight">Retreiva</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/browse" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Browse</Link>
          <Link to="/report/lost" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Report lost</Link>
          <Link to="/report/found" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Post found</Link>
          <Link to="/how-it-works" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>How it works</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/messages"><MessageCircle className="h-4 w-4" /></Link>
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={async () => { setOpenNotif((v) => !v); if (unread > 0) { await markAllNotificationsRead(); refetch(); } }}>
                  <Bell className="h-4 w-4" />
                  {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">{unread}</span>}
                </Button>
                {openNotif && (
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-elevated)]">
                    <div className="border-b border-border/70 px-4 py-3 text-sm font-medium">Notifications</div>
                    {(notifs?.length ?? 0) === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
                    ) : (
                      <ul className="max-h-80 divide-y divide-border/70 overflow-y-auto">
                        {notifs!.map((n) => (
                          <li key={n.id}>
                            <button
                              onClick={() => { setOpenNotif(false); if (n.link) navigate({ to: n.link }); }}
                              className="block w-full px-4 py-3 text-left text-sm hover:bg-secondary/40"
                            >
                              <div className="font-medium">{n.title}</div>
                              {n.body && <div className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</div>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> {profile?.full_name?.split(" ")[0] ?? "Me"}</Link>
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
              <Button asChild variant="hero" size="sm" className="rounded-full">
                <Link to="/report/lost">Post item</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="rounded-full">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}