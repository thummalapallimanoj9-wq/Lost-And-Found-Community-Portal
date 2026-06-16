import { supabase } from "@/integrations/supabase/client";

export interface Thread {
  id: string;
  item_id: string;
  owner_id: string;
  requester_id: string;
  last_message_at: string;
  created_at: string;
}

export interface ThreadWithMeta extends Thread {
  item_title: string | null;
  item_image: string | null;
  other_name: string | null;
  other_id: string;
  last_body: string | null;
  unread: number;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export async function getOrCreateThread(itemId: string, ownerId: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user;
  if (!me) throw new Error("Sign in to message.");
  if (me.id === ownerId) throw new Error("You can't message your own post.");

  const { data: existing } = await supabase
    .from("threads")
    .select("id")
    .eq("item_id", itemId)
    .eq("requester_id", me.id)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("threads")
    .insert({ item_id: itemId, owner_id: ownerId, requester_id: me.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listMyThreads(): Promise<ThreadWithMeta[]> {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user;
  if (!me) return [];
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .or(`owner_id.eq.${me.id},requester_id.eq.${me.id}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  const threads = (data ?? []) as Thread[];
  if (threads.length === 0) return [];

  const itemIds = [...new Set(threads.map((t) => t.item_id))];
  const otherIds = [...new Set(threads.map((t) => (t.owner_id === me.id ? t.requester_id : t.owner_id)))];

  const [{ data: items }, { data: profs }] = await Promise.all([
    supabase.from("items").select("id, title, images").in("id", itemIds),
    supabase.from("profiles").select("id, full_name").in("id", otherIds),
  ]);
  const itemMap = new Map((items ?? []).map((i: any) => [i.id, i]));
  const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));

  // last messages + unread counts
  const { data: lastMsgs } = await supabase
    .from("messages")
    .select("thread_id, body, sender_id, read_at, created_at")
    .in("thread_id", threads.map((t) => t.id))
    .order("created_at", { ascending: false });
  const lastByThread = new Map<string, any>();
  const unreadByThread = new Map<string, number>();
  for (const m of lastMsgs ?? []) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    if (!m.read_at && m.sender_id !== me.id) {
      unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1);
    }
  }

  return threads.map((t) => {
    const otherId = t.owner_id === me.id ? t.requester_id : t.owner_id;
    const it = itemMap.get(t.item_id);
    return {
      ...t,
      item_title: it?.title ?? null,
      item_image: it?.images?.[0] ?? null,
      other_id: otherId,
      other_name: profMap.get(otherId)?.full_name ?? null,
      last_body: lastByThread.get(t.id)?.body ?? null,
      unread: unreadByThread.get(t.id) ?? 0,
    };
  });
}

export async function getThread(threadId: string): Promise<ThreadWithMeta | null> {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user;
  if (!me) return null;
  const { data: t } = await supabase.from("threads").select("*").eq("id", threadId).maybeSingle();
  if (!t) return null;
  const otherId = t.owner_id === me.id ? t.requester_id : t.owner_id;
  const [{ data: item }, { data: prof }] = await Promise.all([
    supabase.from("items").select("id, title, images").eq("id", t.item_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", otherId).maybeSingle(),
  ]);
  return {
    ...(t as Thread),
    item_title: item?.title ?? null,
    item_image: (item?.images as string[] | undefined)?.[0] ?? null,
    other_id: otherId,
    other_name: prof?.full_name ?? null,
    last_body: null,
    unread: 0,
  };
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(threadId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to send messages.");
  const { error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: userData.user.id, body: trimmed.slice(0, 4000) });
  if (error) throw error;
}

export async function markThreadRead(threadId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .is("read_at", null)
    .neq("sender_id", userData.user.id);
}

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function listNotifications(limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function unreadNotificationCount(): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
}