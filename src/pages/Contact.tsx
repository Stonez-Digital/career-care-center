import { useState } from 'react';
import { Mail, Phone, MapPin, Send, ChevronDown, Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import { cn } from '@/lib/utils';
import { WHATSAPP_URL } from '@/lib/contact';

const faqs = [
  { q: 'How do I apply for a CCC program?', a: 'Visit our Apply page, fill out the application form, and select your program of interest. You will receive a confirmation email and can track your application status in your dashboard.' },
  { q: 'Are CCC programs free?', a: 'Most of our programs are free for Nigerian youth. Some specialized training may have a nominal fee, but we work to ensure cost is never a barrier to participation.' },
  { q: 'Do I need to be a student to participate?', a: 'No. Our programs serve students, graduates, job seekers, and young professionals. Each program has specific eligibility criteria listed on its page.' },
  { q: 'How can I become a volunteer?', a: 'Visit our Volunteer page and submit the volunteer application form. Our team will review your application and reach out with opportunities that match your skills.' },
  { q: 'How can my organization partner with CCC?', a: 'We welcome partnerships with organizations committed to youth development. Visit our Donate page and fill out the partnership form, or email us directly.' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: requestError } = await supabase.functions.invoke('contact-form', {
      body: form,
    });
    setSubmitting(false);
    if (requestError) setError(requestError.message);
    else if (data?.error) setError(data.error);
    else {
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Contact Us"
        title="Get in Touch"
        description="Have a question or want to learn more? We'd love to hear from you."
      />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="heading-3">Send Us a Message</h2>
            {success ? (
              <div className="mt-6">
                <Alert type="success" message="Thank you for reaching out! We'll get back to you within 48 hours." />
                <button onClick={() => setSuccess(false)} className="btn-ghost mt-4">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input className="input" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea className="input min-h-[140px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Spinner /> : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="heading-3">Contact Information</h2>
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-700"><MapPin className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-ink-900">Address</h3>
                  <p className="mt-1 text-sm text-ink-600">Maryland, Lagos, Nigeria</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary-50 text-secondary-600"><Mail className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-ink-900">Email</h3>
                  <a href="mailto:info@careercarecenter.com" className="mt-1 block text-sm text-primary-700 hover:underline">info@careercarecenter.com</a>
                  <a href="mailto:partnership@careercarecenter.com.ng" className="mt-1 block text-sm text-primary-700 hover:underline">partnership@careercarecenter.com.ng</a>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-600"><Phone className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-ink-900">Phone</h3>
                  <p className="mt-1 text-sm text-ink-600">+234 815 124 6752</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-success-600 hover:underline">
                    <MessageCircle className="h-4 w-4" /> Join our WhatsApp Jobs Group
                  </a>
                </div>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="grid h-48 place-items-center bg-ink-100 text-ink-400">
                <MapPin className="h-10 w-10" />
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-ink-900">Follow Us</h3>
              <p className="mt-1 text-sm text-ink-500">Stay connected on social media</p>
              <div className="mt-4 flex gap-3">
                <a href="https://www.facebook.com/careercarecenter" target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600 transition-all hover:bg-primary-700 hover:text-white hover:-translate-y-0.5" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/careercarecenter" target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600 transition-all hover:bg-primary-700 hover:text-white hover:-translate-y-0.5" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative" target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600 transition-all hover:bg-primary-700 hover:text-white hover:-translate-y-0.5" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600 transition-all hover:bg-success-600 hover:text-white hover:-translate-y-0.5" aria-label="Join the Career Care Center Jobs WhatsApp group">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-ink-100/50">
        <div className="container-narrow">
          <h2 className="text-center heading-3">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-ink-900">{f.q}</span>
                  <ChevronDown className={cn('h-5 w-5 text-ink-400 transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-ink-600 leading-relaxed animate-fade-in">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
