import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, MessagesSquare, ShieldCheck, Heart, Bell } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Retreiva works" },
      { name: "description", content: "Three small steps from lost to reunited — with smart matching, private chat, and gentle moderation." },
      { property: "og:title", content: "How Retreiva works" },
      { property: "og:description", content: "Three small steps from lost to reunited." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">A kinder Lost &amp; Found.</h1>
        <p className="mt-4 text-lg text-muted-foreground">No noisy feeds, no shouting into the void. Just a calm space designed around one outcome: getting your stuff back.</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-3">
        {[
          { icon: Search, t: "Post in 60 seconds", d: "Photo, category, location. We auto-tag the rest." },
          { icon: Sparkles, t: "We do the matching", d: "Smart pairing surfaces likely lost↔found candidates as they're posted." },
          { icon: MessagesSquare, t: "Chat privately", d: "Confirm details inside Retreiva. No emails or phone numbers leave the app." },
          { icon: Bell, t: "Real-time notifications", d: "We ping you the moment a possible match appears." },
          { icon: ShieldCheck, t: "Gentle moderation", d: "A real team reviews flagged content. Spam doesn't survive long here." },
          { icon: Heart, t: "Designed to be kind", d: "Warm copy, calm visuals, and a built-in thank-you flow when items return home." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-3xl border border-border/70 bg-card p-8 shadow-[var(--shadow-soft)]">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><Icon className="h-5 w-5" /></div>
            <h3 className="mt-5 font-display text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 text-center sm:px-6">
        <Button asChild variant="hero" size="xl"><Link to="/report/lost">Post your first item</Link></Button>
      </section>
      <SiteFooter />
    </div>
  );
}