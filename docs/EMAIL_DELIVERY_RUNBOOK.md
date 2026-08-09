# Contact reply email delivery

Admin contact replies are sent through Resend from a protected Supabase Edge
Function. A message is marked `replied` only after a signed
`email.delivered` webhook is received.

## One-time Resend setup

1. Create the organization's Resend account.
2. Add `careercarecenter.com.ng` under **Domains**.
3. Add the SPF and DKIM records supplied by Resend to the domain's DNS.
4. Wait until Resend reports the domain as **Verified**.
5. Create a sending API key restricted to email sending.
6. In the linked Supabase project, add the key as the Edge Function secret
   `RESEND_API_KEY`. Never commit or share the key in chat.
7. Optionally add these Supabase secrets if different addresses are required:
   - `CONTACT_REPLY_FROM=Career Care Center <info@careercarecenter.com.ng>`
   - `CONTACT_REPLY_TO=info@careercarecenter.com.ng`

## Delivery webhook

1. In Resend, create a webhook for `email.sent`, `email.delivered`,
   `email.bounced`, and `email.complained`.
2. Use this endpoint, replacing `<project-ref>` with the production Supabase
   project reference:

   `https://<project-ref>.supabase.co/functions/v1/resend-webhook`

3. Copy the webhook signing secret directly into Supabase Edge Function
   secrets as `RESEND_WEBHOOK_SECRET`.
4. Send a reply to a controlled test contact message.
5. Confirm the admin record moves from `sent` to `delivered` and its status
   changes to `replied`.

## Troubleshooting

- `Email delivery is not configured`: `RESEND_API_KEY` is missing.
- Resend rejects the sender: the domain is not verified or the From address
  does not use the verified domain.
- Email remains `sent`: the Resend webhook or `RESEND_WEBHOOK_SECRET` is not
  configured correctly.
- `bounced` or `complained`: do not retry until the recipient address and
  consent are reviewed.
