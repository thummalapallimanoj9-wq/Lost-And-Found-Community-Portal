import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Camera, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — Retreiva" },
      { name: "description", content: "Sign in to Retreiva to post lost items, claim found ones, and message safely." },
      { property: "og:title", content: "Sign in or join Retreiva" },
      { property: "og:description", content: "Join the kindest lost & found community." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(true);
  const [avatar, setAvatar] = useState<{ file: File; preview: string } | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  useEffect(() => () => { if (avatar) URL.revokeObjectURL(avatar.preview); }, [avatar]);

  const validate = (): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "signup") {
      if (!fullName.trim()) return "Please enter your full name.";
      if (password !== confirmPassword) return "Passwords do not match.";
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return "Password needs an uppercase letter and a number.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate({ to: "/" });
      } else {
        await signUp({ email, password, fullName: fullName.trim(), avatarFile: avatar?.file ?? null });
        toast.success("Account created — you're in!");
        navigate({ to: "/" });
      }
    } catch (e: any) {
      const msg = e?.message ?? "Something went wrong.";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        toast.error("An account with this email already exists. Try signing in.");
      } else if (msg.toLowerCase().includes("invalid login")) {
        toast.error("Invalid email or password.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try { await signInWithGoogle(); }
    catch (e: any) { toast.error(e?.message ?? "Google sign-in failed."); setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3 text-primary" /> Join a kinder community</div>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">Welcome to Retreiva.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">A calm, private place to reunite lost things with their people. No noise, no spam, no shared contact details.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {["Privacy-first", "Smart matching", "Real humans", "No spam"].map((b) => (
              <div key={b} className="rounded-2xl border border-border/70 bg-card p-4 text-sm font-medium">{b}</div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-[var(--shadow-elevated)] sm:p-10">
          <div className="flex rounded-full bg-secondary p-1 text-sm">
            <button onClick={() => setMode("signin")} className={`flex-1 rounded-full px-4 py-2 transition-colors ${mode === "signin" ? "bg-card shadow-[var(--shadow-soft)]" : "text-muted-foreground"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`flex-1 rounded-full px-4 py-2 transition-colors ${mode === "signup" ? "bg-card shadow-[var(--shadow-soft)]" : "text-muted-foreground"}`}>Create account</button>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <Input label="Full name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <div>
                  <span className="text-sm font-medium">Profile photo (optional)</span>
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" onClick={() => avatarRef.current?.click()} className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-dashed border-border bg-secondary text-muted-foreground hover:text-foreground">
                      {avatar ? <img src={avatar.preview} alt="" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5" />}
                    </button>
                    {avatar && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}><X className="h-4 w-4" /> Remove</Button>
                    )}
                    <input
                      ref={avatarRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                        setAvatar({ file: f, preview: URL.createObjectURL(f) });
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <Input label="Email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            {mode === "signup" && (
              <Input label="Confirm password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            )}
            {mode === "signin" && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-border" />
                Remember me
              </label>
            )}
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signin" ? "Sign in" : "Create account")}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our <Link to="/" className="underline">Terms</Link> and <Link to="/" className="underline">Privacy</Link>.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input {...rest} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
    </label>
  );
}