import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ShieldCheck, MessagesSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ItemCard } from "@/components/site/item-card";
import { listItems } from "@/lib/items";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retreiva — Lost & Found, made human" },
      { name: "description", content: "Report lost items, post found ones, and get reunited faster — a warm, community-powered Lost & Found." },
      { property: "og:title", content: "Retreiva — Lost & Found, made human" },
      { property: "og:description", content: "Report lost items, post found ones, and get reunited faster." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured = [] } = useQuery({ queryKey: ["items", "featured"], queryFn: () => listItems({ limit: 6 }) });
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)]" />
        <div className="absolute -top-32 -right-32 -z-10 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-accent/30 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pt-24 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" /> Now reuniting items in 30+ communities
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Lost something? <br />
              <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">Let's find it together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Retreiva is a warm, community-first home for Lost &amp; Found. Post what you've lost or found in seconds, and let smart matching, in-app messaging, and kind strangers do the rest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/report/lost">Report a lost item <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="soft" size="xl" className="rounded-full">
                <Link to="/report/found">I found something</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div>
                <div className="font-display text-2xl font-semibold text-foreground">12,400+</div>
                <div>items reunited</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="font-display text-2xl font-semibold text-foreground">48 hrs</div>
                <div>avg. recovery time</div>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <div className="font-display text-2xl font-semibold text-foreground">96%</div>
                <div>kindness rate</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[image:var(--gradient-primary)] opacity-10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-[var(--shadow-elevated)]">
              <img src={heroImg} alt="A paper plane carrying a key, gently delivering lost things home" width={1536} height={1152} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border/60 bg-card/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">✓</div>
                <div>
                  <div className="text-sm font-medium">Wallet reunited</div>
                  <div className="text-xs text-muted-foreground">Returned in 6 hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mx-auto -mt-6 max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/browse" }); }}
            className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search for a wallet, phone, keys…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 sm:w-64">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="rounded-2xl">Search</Button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Three small steps, one big reunion.</h2>
          <p className="mt-4 text-muted-foreground">No accounts to babysit. No clutter. Just a kind, focused path from lost to found.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Post in 60 seconds", desc: "Snap a photo, add a few details. We'll handle the rest with smart suggestions.", n: "01" },
            { icon: Sparkles, title: "We match it for you", desc: "Our matching surfaces likely pairs from nearby found items, instantly.", n: "02" },
            { icon: MessagesSquare, title: "Chat safely, reunite", desc: "Confirm with private in-app chat. No emails, no phone numbers shared.", n: "03" },
          ].map((step) => (
            <div key={step.n} className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
              <div className="absolute -right-6 -top-6 font-display text-7xl font-semibold text-accent/40">{step.n}</div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured items */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Recently shared</div>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Recent lost &amp; found</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/browse">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
              No posts yet — be the first to share something lost or found.
            </div>
          ) : featured.map((it) => <ItemCard key={it.id} item={it} />)}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[image:var(--gradient-hero)] p-10 sm:p-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <ShieldCheck className="h-3 w-3 text-success" /> Privacy-first by design
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Safe to use. Lovely to use.</h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                We never reveal your email or phone number. Verified communities, gentle moderation, and a real human team behind every report.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg" className="rounded-full">
                  <Link to="/auth">Create your account</Link>
                </Button>
                <Button asChild variant="soft" size="lg" className="rounded-full">
                  <Link to="/browse">Browse first</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "Verified posts", v: "Photo + location checks" },
                { k: "Private chat", v: "No personal info shared" },
                { k: "Smart matching", v: "AI pairs lost ↔ found" },
                { k: "Recovery rate", v: "3× higher than DMs" },
              ].map((b) => (
                <div key={b.k} className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur">
                  <div className="text-sm font-semibold">{b.k}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{b.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
