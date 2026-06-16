import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Gift, ImageOff } from "lucide-react";
import { displayStatus, timeAgo, type ItemWithOwner } from "@/lib/items";

const statusStyles = {
  lost: "bg-destructive/10 text-destructive border border-destructive/20",
  found: "bg-success/15 text-success border border-success/20",
  reunited: "bg-accent/40 text-foreground border border-accent/40",
} as const;

const statusLabel = { lost: "Lost", found: "Found", reunited: "Reunited" } as const;

export function ItemCard({ item }: { item: ItemWithOwner }) {
  const status = displayStatus(item);
  const image = item.images?.[0];
  return (
    <Link
      to="/item/$id"
      params={{ id: item.id }}
      className="group block overflow-hidden rounded-3xl bg-card border border-border/70 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {image ? (
          <img src={image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
        )}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${statusStyles[status]}`}>
          {statusLabel[status]}
        </span>
        {item.reward ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur border border-border/60">
            <Gift className="h-3 w-3 text-primary" /> ${item.reward}
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{item.category}</div>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}