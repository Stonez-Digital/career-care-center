import PageHero from '@/components/PageHero';

const sections = [
  ['Information we collect', 'We collect information you provide when creating an account, applying for a programme, registering for an event, volunteering, donating, contacting us, or subscribing to updates. This may include your name, email address, phone number, profile details, career interests, application responses, and payment reference information.'],
  ['How we use information', 'We use this information to deliver Career Care Center programmes, manage mentorship and virtual meetings, review applications, communicate updates, process donations through our payment provider, improve our services, and protect the platform from misuse.'],
  ['Sharing and storage', 'We share information only with service providers and authorized team members who need it to operate the platform. Authentication and application data are stored using Supabase, payments are handled by Paystack, and the website is hosted through Vercel. We do not sell personal information.'],
  ['Your choices', 'You may update your profile from your dashboard, unsubscribe from newsletters, or ask us to access, correct, or delete personal information, subject to legal and operational retention requirements.'],
  ['Contact us', 'For privacy questions or requests, email info@careercarecenter.com.ng. We may update this notice when our services or legal obligations change.'],
] as const;

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" description="How Career Care Center collects, uses, and protects your information." />
      <section className="section-padding bg-white">
        <div className="container-page max-w-3xl">
          <p className="text-sm font-medium text-ink-500">Last updated: August 8, 2026</p>
          <div className="mt-8 space-y-8">
            {sections.map(([title, body]) => (
              <article key={title}>
                <h2 className="font-heading text-xl font-bold text-ink-900">{title}</h2>
                <p className="mt-3 leading-7 text-ink-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
