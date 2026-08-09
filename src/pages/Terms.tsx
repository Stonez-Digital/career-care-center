import PageHero from '@/components/PageHero';

const sections = [
  ['Using the platform', 'You must provide accurate information, keep your login details secure, and use the platform only for lawful career-development, mentorship, volunteering, and community purposes. You are responsible for activity performed through your account.'],
  ['Programmes and opportunities', 'Submitting an application or registration does not guarantee selection, employment, funding, mentorship placement, or any particular outcome. Dates, availability, eligibility requirements, and programme content may change when operationally necessary.'],
  ['Meetings and community conduct', 'Virtual meeting links are for assigned participants and must not be shared without permission. Members must treat others respectfully and must not harass participants, disrupt sessions, impersonate others, or upload harmful or unlawful material.'],
  ['Donations and third-party services', 'Donations are currently made by direct bank transfer to the official organizational account displayed on the donation page and are confirmed manually by authorized team members. Donors should verify the account details before transferring funds and retain their transfer receipt. External links, including Microsoft Teams and social platforms, are governed by the relevant provider. Career Care Center is not responsible for third-party service availability.'],
  ['Account and content management', 'We may restrict or suspend access when needed to protect members, comply with law, enforce these terms, or maintain platform security. Content provided to us must be accurate and must not infringe another person’s rights.'],
  ['Contact', 'Questions about these terms may be sent to info@careercarecenter.com.ng. Continued use after an updated version is published means you accept the revised terms.'],
] as const;

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Use" description="The rules that help keep Career Care Center services safe and useful." />
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
