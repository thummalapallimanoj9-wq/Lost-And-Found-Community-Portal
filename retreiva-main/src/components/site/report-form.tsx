import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, MapPin, Tag, Gift, Calendar, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/mock-items";
import { useAuth } from "@/lib/auth";
import { createItem, uploadItemImages, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES } from "@/lib/items";
import { toast } from "sonner";

interface PickedImage { file: File; preview: string }

export function ReportForm({ mode }: { mode: "lost" | "found" }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<PickedImage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0] as string,
    description: "",
    location: "",
    event_date: "",
    tags: "",
    reward: "",
    contact_info: "",
    held_at: "With me",
  });

  useEffect(() => {
    return () => images.forEach((i) => URL.revokeObjectURL(i.preview));
  }, [images]);

  if (!loading && !user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Sign in to post.</h1>
        <p className="mt-3 text-muted-foreground">You need an account so people can safely reach out about your item.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="hero" className="rounded-full"><Link to="/auth">Sign in or create account</Link></Button>
          <Button asChild variant="soft" className="rounded-full"><Link to="/browse">Browse instead</Link></Button>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Posted with care.</h1>
        <p className="mt-3 text-muted-foreground">Your post is live and visible to the community.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => navigate({ to: "/item/$id", params: { id: submitted.id } })} variant="hero" className="rounded-full">View your post</Button>
          <Button asChild variant="soft" className="rounded-full"><Link to="/browse">Browse the board</Link></Button>
        </div>
      </section>
    );
  }

  const isLost = mode === "lost";

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: PickedImage[] = [];
    for (const file of arr) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, WEBP allowed`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: max 5MB`);
        continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages((prev) => {
      const next = [...prev, ...valid].slice(0, MAX_IMAGES);
      if (prev.length + valid.length > MAX_IMAGES) toast.error(`Max ${MAX_IMAGES} images`);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast.error("Please fill in title, description, and location.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length) {
        toast.info(`Uploading ${images.length} image${images.length > 1 ? "s" : ""}…`);
        imageUrls = await uploadItemImages(user.id, images.map((i) => i.file));
      }
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const id = await createItem({
        kind: mode,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        event_date: form.event_date || null,
        reward: isLost && form.reward ? Number(form.reward) : null,
        tags,
        images: imageUrls,
        contact_info: form.contact_info.trim() || null,
        held_at: !isLost ? form.held_at : null,
      });
      toast.success("Posted!");
      setSubmitted({ id });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">{isLost ? "Report lost" : "Post found"}</div>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {isLost ? "Tell us what you lost." : "Tell us what you found."}
      </h1>
      <p className="mt-3 text-muted-foreground">The more detail you add, the better our matching works. A clear photo helps the most.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
        {/* Image picker */}
        <div>
          <label className="text-sm font-medium">Photos</label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="mt-2 grid place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center transition-colors hover:bg-secondary/70 cursor-pointer"
          >
            <Camera className="h-6 w-6 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">Drop photos or click to upload</div>
            <div className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP — up to {MAX_IMAGES}, max 5MB each</div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
          </div>
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" onClick={() => inputRef.current?.click()} className="grid aspect-square place-items-center rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground"><ImagePlus className="h-5 w-5" /></button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Item name" placeholder="e.g. Black leather wallet" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <SelectField label="Category" options={CATEGORIES as readonly string[]} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        </div>

        <FieldArea
          label="Description"
          placeholder={isLost ? "Describe distinguishing details — stickers, scratches, contents…" : "Describe how and where you found it — and where it's safely held."}
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={isLost ? "Last seen location" : "Found location"} icon={MapPin} placeholder="e.g. Central Library, 2nd floor" required value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label={isLost ? "Date lost" : "Date found"} icon={Calendar} type="date" value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tags (comma-separated)" icon={Tag} placeholder="brown, stitching, monogram" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
          {isLost ? (
            <Field label="Reward (optional)" icon={Gift} type="number" placeholder="0" value={form.reward} onChange={(v) => setForm({ ...form, reward: v })} />
          ) : (
            <SelectField label="Where it's held" options={["With me", "Held at the venue", "Local police", "Other"]} value={form.held_at} onChange={(v) => setForm({ ...form, held_at: v })} />
          )}
        </div>

        <Field label="Contact note (optional)" placeholder="Best way to reach you (visible only after match)" value={form.contact_info} onChange={(v) => setForm({ ...form, contact_info: v })} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">By posting, you agree to our community guidelines. Your contact details stay private until you choose to share them.</p>
          <Button type="submit" variant="hero" size="lg" className="rounded-full" disabled={submitting}>
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>) : (isLost ? "Post lost item" : "Post found item")}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, icon: Icon, value, onChange, ...rest }: { label: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30">
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" {...rest} />
      </div>
    </label>
  );
}

function FieldArea({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30">
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground" {...rest} />
      </div>
    </label>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 rounded-2xl border border-border bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm outline-none">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </label>
  );
}