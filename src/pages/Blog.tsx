import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });
      setPosts((data as BlogPost[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Blog"
        title="Insights & Resources"
        description="Career advice, workshop reports, and updates from the Career Care Center community."
      />

      <section className="section">
        <div className="container-page">
          {loading ? (
            <PageLoader />
          ) : posts.length === 0 ? (
            <p className="py-20 text-center text-ink-500">No articles published yet. Check back soon!</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="card group overflow-hidden transition-all hover:shadow-lift">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={p.cover_image_url ?? 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <Badge variant="secondary">{p.category}</Badge>
                    <h3 className="mt-3 font-heading text-lg font-semibold text-ink-900 line-clamp-2 group-hover:text-primary-700">{p.title}</h3>
                    <p className="mt-2 text-sm text-ink-600 line-clamp-2">{p.excerpt}</p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {p.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.published_at ?? p.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section bg-gradient-to-br from-primary-800 to-primary-900">
        <div className="container-page text-center">
          <h2 className="heading-2 text-white">Never Miss an Article</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-100">Join our community and get the latest career insights delivered to you.</p>
          <Link to="/signup" className="btn-accent mt-6">Join CCC <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
