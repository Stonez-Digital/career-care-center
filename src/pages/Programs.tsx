import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Program, ProgramCategory } from '@/lib/supabase';
import ProgramCard from '@/components/ProgramCard';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import { cn } from '@/lib/utils';

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filter, setFilter] = useState<ProgramCategory | 'All'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('programs').select('*').eq('is_active', true).order('title');
      setPrograms((data as Program[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories: (ProgramCategory | 'All')[] = ['All', ...Array.from(new Set(programs.map((p) => p.category)))];
  const filtered = filter === 'All' ? programs : programs.filter((p) => p.category === filter);

  return (
    <div>
      <PageHero
        eyebrow="Our Programs"
        title="Pathways to Career Success"
        description="Our programs provide free platforms and opportunities for career development, skills optimization, and entrepreneurship support for young Nigerians."
      />

      <section className="section">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  filter === c
                    ? 'bg-primary-700 text-white shadow-soft'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <PageLoader />
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-ink-500">No programs in this category yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
          )}

          <div className="mt-16 rounded-3xl bg-gradient-to-br from-primary-700 to-primary-800 p-10 text-center sm:p-14">
            <h2 className="heading-3 text-white">Not Sure Which Program Is Right for You?</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-100">
              Take our free Career Assessment and we'll recommend the best program for your goals.
            </p>
            <Link to="/apply" className="btn-accent mt-6">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
