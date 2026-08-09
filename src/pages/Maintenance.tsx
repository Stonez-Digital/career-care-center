import { Mail, Wrench } from 'lucide-react';

export default function Maintenance() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 px-6 py-16">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-400/15 blur-3xl" />
      <section className="relative w-full max-w-xl text-center">
        <img
          src="/career-care-logo.png?v=6"
          alt="Career Care Center — uplifting talents to make a meaningful impact"
          className="mx-auto h-32 w-auto"
        />
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md">
          <Wrench className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-secondary-300">Scheduled maintenance</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">We’ll be back soon</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-primary-100 sm:text-lg">
          Career Care Center is undergoing scheduled stabilization and quality checks. Our team is working carefully to restore full access.
        </p>
        <a href="mailto:info@careercarecenter.com.ng" className="btn-white btn-lg mt-8 inline-flex">
          <Mail className="h-4 w-4" aria-hidden="true" /> Contact Support
        </a>
      </section>
    </main>
  );
}
