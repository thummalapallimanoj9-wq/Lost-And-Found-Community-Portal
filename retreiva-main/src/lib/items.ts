import { supabase } from "@/integrations/supabase/client";

export type ItemKind = "lost" | "found";
export type ItemStatus = "active" | "recovered" | "returned" | "closed";

export interface ItemRow {
  id: string;
  user_id: string;
  kind: ItemKind;
  status: ItemStatus;
  title: string;
  category: string;
  description: string;
  location: string;
  event_date: string | null;
  reward: number | null;
  tags: string[];
  images: string[];
  contact_info: string | null;
  held_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithOwner extends ItemRow {
  owner_name: string | null;
}

export function displayStatus(item: Pick<ItemRow, "kind" | "status">): "lost" | "found" | "reunited" {
  if (item.status === "recovered" || item.status === "returned") return "reunited";
  return item.kind;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export async function listItems(filters?: { kind?: ItemKind; category?: string; q?: string; limit?: number }): Promise<ItemWithOwner[]> {
  let q = supabase
    .from("items")
    .select("*, profiles!items_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 60);
  if (filters?.kind) q = q.eq("kind", filters.kind);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.q) q = q.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);

  // Fallback: the FK alias may differ; try a plain select if relation embed fails.
  const { data, error } = await q;
  if (error) {
    const { data: plain, error: e2 } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 60);
    if (e2) throw e2;
    return (plain ?? []).map((r) => ({ ...(r as ItemRow), owner_name: null }));
  }
  return (data ?? []).map((r: any) => ({ ...r, owner_name: r.profiles?.full_name ?? null }));
}

export async function getItem(id: string): Promise<ItemWithOwner | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*, profiles!items_user_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    const { data: plain } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
    if (!plain) return null;
    return { ...(plain as ItemRow), owner_name: null };
  }
  return { ...(data as any), owner_name: (data as any).profiles?.full_name ?? null };
}

export async function uploadItemImages(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("item-images").upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = await supabase.storage.from("item-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }
  return urls;
}

export interface CreateItemInput {
  kind: ItemKind;
  title: string;
  category: string;
  description: string;
  location: string;
  event_date?: string | null;
  reward?: number | null;
  tags?: string[];
  images?: string[];
  contact_info?: string | null;
  held_at?: string | null;
}

export async function createItem(input: CreateItemInput): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You must be signed in to post.");
  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userData.user.id,
      kind: input.kind,
      title: input.title,
      category: input.category,
      description: input.description,
      location: input.location,
      event_date: input.event_date || null,
      reward: input.reward ?? null,
      tags: input.tags ?? [],
      images: input.images ?? [],
      contact_info: input.contact_info ?? null,
      held_at: input.held_at ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 5;