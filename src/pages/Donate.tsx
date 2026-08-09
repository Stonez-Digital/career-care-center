import { useState } from 'react';
import { Heart, Handshake, Send, CheckCircle2, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import { formatCurrency, cn } from '@/lib/utils';

const presets = [5000, 10000, 25000, 50000, 100000];

export default function Donate() {
  const [tab, setTab] = useState<'donate' | 'partner'>('donate');

  const [donation, setDonation] = useState({
    donor_name: '', donor_email: '', amount: 10000, frequency: 'one_time' as 'one_time' | 'monthly' | 'yearly', message: '',
  });
  const [customAmount, setCustomAmount] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const donating = false;
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);

  const [partner, setPartner] = useState({ name: '', email: '', organization: '', partnership_type: '', message: '' });
  const [partnering, setPartnering] = useState(false);
  const [partnerSuccess, setPartnerSuccess] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const submitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setDonationError(null);
    const amount = customAmount ? Number(customAmount) : donation.amount;
    const subject = encodeURIComponent('Donation transfer notification');
    const body = encodeURIComponent(
      `Hello Career Care Center,\n\nI have made a bank transfer donation.\n\nName: ${anonymous ? 'Anonymous donor' : donation.donor_name}\nEmail: ${anonymous ? 'Not provided' : donation.donor_email}\nAmount: NGN ${amount.toLocaleString()}\nFrequency: ${donation.frequency.replace('_', ' ')}\nMessage: ${donation.message || 'None'}\n\nPlease confirm receipt.`,
    );
    window.location.href = `mailto:info@careercarecenter.com.ng?subject=${subject}&body=${body}`;
  };

  const submitPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartnering(true);
    setPartnerError(null);
    const { error } = await supabase.from('partners').insert(partner);
    setPartnering(false);
    if (error) setPartnerError(error.message);
    else {
      setPartnerSuccess(true);
      setPartner({ name: '', email: '', organization: '', partnership_type: '', message: '' });
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Support Us"
        title="Invest in Nigeria's Future"
        description="Your support helps us empower more young Nigerians with the skills, mentorship, and opportunities they need to build successful careers."
      />

      <section className="section">
        <div className="container-narrow">
          <div className="mb-8 flex justify-center gap-2 rounded-xl bg-ink-100 p-1.5">
            <button
              onClick={() => setTab('donate')}
              className={cn('flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all', tab === 'donate' ? 'bg-white text-primary-700 shadow-soft' : 'text-ink-600')}
            >
              <Heart className="mr-2 inline h-4 w-4" /> Donate
            </button>
            <button
              onClick={() => setTab('partner')}
              className={cn('flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all', tab === 'partner' ? 'bg-white text-primary-700 shadow-soft' : 'text-ink-600')}
            >
              <Handshake className="mr-2 inline h-4 w-4" /> Become a Partner
            </button>
          </div>

          {tab === 'donate' ? (
            <div className="card p-8">
              {donationSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
                  <h2 className="mt-4 heading-3">Thank You for Your Support!</h2>
                  <p className="mt-2 text-ink-600">
                    {anonymous
                      ? 'Thank you for your anonymous donation. Your generosity is greatly appreciated.'
                      : 'Your donation will help transform young lives across Nigeria.'}
                  </p>
                  <button onClick={() => setDonationSuccess(false)} className="btn-ghost mt-6">Make Another Donation</button>
                </div>
              ) : (
                <>
                  <h2 className="heading-3">Make a Donation</h2>
                  <p className="mt-2 text-sm text-ink-600">Every contribution counts. For just ₦15,000, you can sponsor one youth's registration, materials, and access to mentorship at our workshops.</p>
                  <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Official donation account</p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-ink-500">Account name</dt>
                        <dd className="mt-1 font-semibold text-ink-900">Career Care Centre for Youth Development Initiative</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500">Bank</dt>
                        <dd className="mt-1 font-semibold text-ink-900">Premium Trust Bank</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500">Account number</dt>
                        <dd className="mt-1 font-heading text-xl font-bold tracking-wider text-primary-700">0040261768</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-xs leading-5 text-ink-600">Make your transfer through your banking app, then complete the form below and notify us so the organization can confirm receipt.</p>
                  </div>
                  <form onSubmit={submitDonation} className="mt-6 space-y-5">
                    {donationError && <Alert type="error" message={donationError} />}

                    {/* Anonymous toggle */}
                    <label className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      anonymous ? 'border-secondary-600 bg-secondary-50' : 'border-ink-200 hover:border-ink-300'
                    )}>
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="h-5 w-5 rounded border-ink-300 text-secondary-600 focus:ring-secondary-600"
                      />
                      <div className="flex items-center gap-2">
                        <EyeOff className={cn('h-5 w-5', anonymous ? 'text-secondary-600' : 'text-ink-400')} />
                        <div>
                          <p className="text-sm font-semibold text-ink-900">Donate Anonymously</p>
                          <p className="text-xs text-ink-500">Your personal information will not be collected or displayed.</p>
                        </div>
                      </div>
                    </label>

                    {/* Personal info fields — only shown when not anonymous */}
                    {!anonymous && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="label">Full Name *</label>
                          <input className="input" required value={donation.donor_name} onChange={(e) => setDonation({ ...donation, donor_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Email *</label>
                          <input type="email" className="input" required value={donation.donor_email} onChange={(e) => setDonation({ ...donation, donor_email: e.target.value })} />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="label">Amount (NGN) *</label>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {presets.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => { setDonation({ ...donation, amount: amt }); setCustomAmount(''); }}
                            className={cn('rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all',
                              !customAmount && donation.amount === amt ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600 hover:border-primary-300')}
                          >
                            ₦{amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        className="input mt-2"
                        placeholder="Or enter custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Frequency</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['one_time', 'monthly', 'yearly'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setDonation({ ...donation, frequency: f })}
                            className={cn('rounded-xl border-2 px-3 py-2.5 text-sm font-semibold capitalize transition-all',
                              donation.frequency === f ? 'border-primary-700 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600 hover:border-primary-300')}
                          >
                            {f.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Message (optional)</label>
                      <textarea className="input min-h-[80px]" placeholder="Leave a message of support..." value={donation.message} onChange={(e) => setDonation({ ...donation, message: e.target.value })} />
                    </div>
                    <div className="rounded-xl bg-primary-50 p-4 text-center">
                      <p className="text-sm text-ink-600">You are donating</p>
                      <p className="font-heading text-2xl font-bold text-primary-700">
                        {formatCurrency(customAmount ? Number(customAmount) : donation.amount)}
                      </p>
                      <p className="text-sm text-ink-500 capitalize">{donation.frequency.replace('_', ' ')}</p>
                      {anonymous && <p className="mt-1 text-xs font-medium text-secondary-600">Anonymous donation</p>}
                    </div>
                    <button type="submit" disabled={donating} className="btn-secondary w-full">
                      {donating ? <Spinner /> : <><Heart className="h-4 w-4" /> Notify Us After Transfer</>}
                    </button>
                    <p className="text-center text-xs text-ink-400">Bank transfers are confirmed manually by the Career Care Center team.</p>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="card p-8">
              {partnerSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
                  <h2 className="mt-4 heading-3">Partnership Request Received!</h2>
                  <p className="mt-2 text-ink-600">Our team will reach out to discuss partnership opportunities.</p>
                  <button onClick={() => setPartnerSuccess(false)} className="btn-ghost mt-6">Submit Another Request</button>
                </div>
              ) : (
                <>
                  <h2 className="heading-3">Become a Partner</h2>
                  <p className="mt-2 text-sm text-ink-600">Partner with CCC to empower Nigerian youth at scale.</p>
                  <form onSubmit={submitPartner} className="mt-6 space-y-4">
                    {partnerError && <Alert type="error" message={partnerError} />}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">Your Name *</label>
                        <input className="input" required value={partner.name} onChange={(e) => setPartner({ ...partner, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Email *</label>
                        <input type="email" className="input" required value={partner.email} onChange={(e) => setPartner({ ...partner, email: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Organization</label>
                      <input className="input" value={partner.organization} onChange={(e) => setPartner({ ...partner, organization: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Partnership Type</label>
                      <select className="input" value={partner.partnership_type} onChange={(e) => setPartner({ ...partner, partnership_type: e.target.value })}>
                        <option value="">Select type...</option>
                        <option value="corporate">Corporate Sponsorship</option>
                        <option value="program">Program Partnership</option>
                        <option value="media">Media Partnership</option>
                        <option value="academic">Academic Partnership</option>
                        <option value="government">Government Partnership</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Message *</label>
                      <textarea className="input min-h-[120px]" required placeholder="Tell us about your organization and how you'd like to partner..." value={partner.message} onChange={(e) => setPartner({ ...partner, message: e.target.value })} />
                    </div>
                    <button type="submit" disabled={partnering} className="btn-primary w-full">
                      {partnering ? <Spinner /> : <><Send className="h-4 w-4" /> Submit Partnership Request</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
