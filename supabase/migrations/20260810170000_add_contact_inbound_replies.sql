/* Store customer email replies received through Resend without exposing them publicly. */

CREATE TABLE IF NOT EXISTS public.contact_message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  provider_message_id text NOT NULL,
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  body_text text NOT NULL,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_message_replies_provider_message_id_key UNIQUE (provider_message_id)
);

CREATE INDEX IF NOT EXISTS contact_message_replies_contact_created_idx
  ON public.contact_message_replies (contact_message_id, created_at);

ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_message_replies_admin_read" ON public.contact_message_replies;
CREATE POLICY "contact_message_replies_admin_read"
  ON public.contact_message_replies FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.contact_message_replies IS
  'Audited inbound and outbound messages belonging to a contact-form conversation.';

