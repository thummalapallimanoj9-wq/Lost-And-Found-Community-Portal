-- THREADS
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, requester_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY threads_select_participants ON public.threads FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = requester_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY threads_insert_requester ON public.threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND requester_id <> owner_id);
CREATE POLICY threads_update_participants ON public.threads FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = requester_id);
CREATE POLICY threads_delete_admin ON public.threads FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_participants ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id
    AND (auth.uid() = t.owner_id OR auth.uid() = t.requester_id OR has_role(auth.uid(), 'admin'))));
CREATE POLICY messages_insert_participants ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id
    AND (auth.uid() = t.owner_id OR auth.uid() = t.requester_id)));
CREATE POLICY messages_update_own ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id
    AND (auth.uid() = t.owner_id OR auth.uid() = t.requester_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id
    AND (auth.uid() = t.owner_id OR auth.uid() = t.requester_id)));

CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);
CREATE INDEX idx_threads_owner ON public.threads(owner_id);
CREATE INDEX idx_threads_requester ON public.threads(requester_id);

-- Update last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_thread_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.threads SET last_message_at = NEW.created_at WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_bump_thread AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_thread_last_message();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_insert_self ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Auto-create notification on new message (for the other participant)
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.threads%ROWTYPE;
  recipient uuid;
  item_title text;
BEGIN
  SELECT * INTO t FROM public.threads WHERE id = NEW.thread_id;
  recipient := CASE WHEN NEW.sender_id = t.owner_id THEN t.requester_id ELSE t.owner_id END;
  SELECT title INTO item_title FROM public.items WHERE id = t.item_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (recipient, 'message', 'New message about ' || COALESCE(item_title, 'an item'),
          left(NEW.body, 140), '/messages/' || t.id::text);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();
