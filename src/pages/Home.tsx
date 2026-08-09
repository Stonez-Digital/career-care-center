import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, GraduationCap, Briefcase, HeartHandshake, Calendar, Sparkles, Star, Play, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Program, CCCEvent, Testimonial } from '@/lib/supabase';
import Counter from '@/components/Counter';
import ProgramCard from '@/components/ProgramCard';
import EventCard from '@/components/EventCard';

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<CCCEvent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const [p, e, t] = await Promise.all([
        supabase.from('programs').select('*').eq('is_active', true).limit(6),
        supabase.from('events').select('*').order('event_date', { ascending: true }).limit(3),
        supabase.from('testimonials').select('*').eq('approved', true).limit(3),
      ]);
      setPrograms((p.data as Program[]) ?? []);
      setEvents((e.data as CCCEvent[]) ?? []);
      setTestimonials((t.data as Testimonial[]) ?? []);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'url(https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-secondary-500/15 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-accent-400/15 blur-3xl animate-pulse-soft" />

        <div className="container-page relative py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-50 backdrop-blur-md ring-1 ring-white/20 animate-fade-in animate-fill-back">
              <Sparkles className="h-4 w-4 text-accent-400" />
              Career Care Center For Youth Development Initiative
            </span>
            <h1 className="mt-8 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl animate-fade-in-up animate-fill-back">
              We Care For Your Career.
              <br className="hidden sm:block" /> We{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                  Nurture Talents
                </span>
              </span>
              {' '}For Greater Purposes.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-primary-100 text-pretty sm:text-xl animate-fade-in-up animate-fill-back animate-delay-100">
              We equip talents with the skills, networks, knowledge, opportunities and tools
              needed to navigate the professional world and excel in their chosen career.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up animate-fill-back animate-delay-200">
              <Link to="/signup" className="btn-accent btn-lg w-full sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/apply" className="btn-white btn-lg w-full sm:w-auto">
                Apply Now
              </Link>
              <Link to="/programs" className="btn btn-lg w-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 sm:w-auto">
                <Play className="h-4 w-4" /> Explore Programs
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </section>

      {/* Impact Counters */}
      <section className="relative -mt-px bg-gradient-to-br from-primary-800 to-primary-900 py-20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container-page relative">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow text-secondary-300">Our Impact</span>
            <h2 className="mt-3 font-heading text-2xl font-bold text-white sm:text-3xl">
              Reducing Unemployment. Building Futures.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:grid-cols-5">
            <Counter end={500} suffix="+" label="Youth Reached" icon={<Users className="h-7 w-7" />} />
            <Counter end={20} suffix="+" label="Workshops & Webinars" icon={<Calendar className="h-7 w-7" />} />
            <Counter end={50} suffix="+" label="Mentorship Sessions" icon={<Briefcase className="h-7 w-7" />} />
            <Counter end={100} suffix="+" label="Community Members" icon={<HeartHandshake className="h-7 w-7" />} />
            <Counter end={30} suffix="+" label="Volunteers & Partners" icon={<GraduationCap className="h-7 w-7" />} />
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Our Programs</span>
            <h2 className="mt-3 heading-2">Pathways to Your Career Success</h2>
            <p className="mt-4 text-lg text-ink-600 text-pretty">
              Our programs provide free platforms and opportunities for career development,
              skills optimization, and entrepreneurship support for young Nigerians.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/programs" className="btn-primary btn-lg">
              View All Programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="section bg-ink-100/60">
          <div className="container-page">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <span className="eyebrow">Upcoming Events</span>
                <h2 className="mt-3 heading-2">Join Our Next Gathering</h2>
                <p className="mt-4 text-lg text-ink-600 text-pretty">
                  Workshops, webinars, and training sessions to accelerate your career journey.
                </p>
              </div>
              <Link to="/events" className="btn-outline shrink-0">
                All Events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Success Stories</span>
              <h2 className="mt-3 heading-2">Real Stories, Real Impact</h2>
              <p className="mt-4 text-lg text-ink-600 text-pretty">
                Hear from those whose careers and lives have been impacted through CCC programs.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <article key={t.id} className="card-hover group relative p-7">
                  <div className="absolute right-6 top-6 text-6xl font-heading font-bold text-ink-100 transition-colors group-hover:text-primary-50">
                    "
                  </div>
                  <div className="relative">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent-400 text-accent-400" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-700">{t.quote}</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
                      <img
                        src={t.image_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0F4C81&color=fff`}
                        alt={t.name}
                        loading="lazy"
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-ink-100"
                      />
                      <div>
                        <p className="font-semibold text-ink-900">{t.name}</p>
                        <p className="text-sm text-ink-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/success-stories" className="btn-outline btn-lg">
                Read More Stories <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl" />

        <div className="container-page relative section">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-50 backdrop-blur-md ring-1 ring-white/20">
              <TrendingUp className="h-4 w-4 text-accent-400" />
              Join Our Community
            </span>
            <h2 className="mt-6 heading-2 text-white">Ready to Start Your Journey?</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-primary-100 text-pretty">
              Join the Career Care Center community. Apply today and take the first step toward
              building a smarter future for yourself and Nigeria.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/apply" className="btn-accent btn-lg w-full sm:w-auto">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/donate" className="btn-white btn-lg w-full sm:w-auto">
                Support Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
