import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-xl font-semibold">Retreiva</div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A kinder way to reunite people with their things. Built for campuses, transit, and tight-knit communities.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/browse" className="hover:text-foreground text-muted-foreground">Browse items</Link></li>
            <li><Link to="/report/lost" className="hover:text-foreground text-muted-foreground">Report lost</Link></li>
            <li><Link to="/report/found" className="hover:text-foreground text-muted-foreground">Post found</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/how-it-works" className="hover:text-foreground text-muted-foreground">How it works</Link></li>
            <li><Link to="/auth" className="hover:text-foreground text-muted-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Retreiva. Made with care.
      </div>
    </footer>
  );
}