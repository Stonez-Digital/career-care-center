/* Track transactional reply acceptance and final Resend delivery outcomes. */

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS reply_message_id text,
  ADD COLUMN IF NOT EXISTS reply_delivery_status text,
  ADD COLUMN IF NOT EXISTS reply_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reply_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS replied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_reply_delivery_status_check;
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_reply_delivery_status_check
  CHECK (
    reply_delivery_status IS NULL OR
    reply_delivery_status IN ('sent', 'delivered', 'bounced', 'complained', 'failed')
  );

CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_reply_message_id_key
  ON public.contact_messages (reply_message_id)
  WHERE reply_message_id IS NOT NULL;

COMMENT ON COLUMN public.contact_messages.reply_message_id IS
  'Resend provider message ID returned after the reply is accepted.';
COMMENT ON COLUMN public.contact_messages.reply_delivered_at IS
  'Timestamp supplied by the signed Resend email.delivered webhook.';
