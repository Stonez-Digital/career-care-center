import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).maybeSingle();
      setPost(data as BlogPost | null);
      if (data) {
        const { data: rel } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .neq('id', (data as BlogPost).id)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelated((rel as BlogPost[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <PageLoader />;
  if (!post) {
    return (
      <div className="container-page py-32 text-center">
        <h1 className="heading-2">Article Not Found</h1>
        <Link to="/blog" className="btn-primary mt-6">Back to Blog</Link>
      </div>
    );
  }

  const paragraphs = post.content.split('\n\n');

  return (
    <div>
      <article>
        <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
          <img src={post.cover_image_url ?? 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />
          <div className="absolute bottom-0 container-page pb-8">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
          </div>
        </div>

        <div className="container-narrow py-12">
          <Badge variant="secondary">{post.category}</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold text-ink-900 sm:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-500">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(post.published_at ?? post.created_at)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {Math.ceil(post.content.length / 1000)} min read</span>
          </div>

          <div className="mt-8 space-y-4 text-lg leading-relaxed text-ink-700">
            {paragraphs.map((para, i) => {
              if (para.startsWith('## ')) {
                return <h2 key={i} className="mt-8 font-heading text-2xl font-semibold text-ink-900">{para.slice(3)}</h2>;
              }
              if (para.startsWith('# ')) {
                return <h1 key={i} className="mt-8 font-heading text-3xl font-bold text-ink-900">{para.slice(2)}</h1>;
              }
              return <p key={i}>{para}</p>;
            })}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section bg-ink-100/50">
          <div className="container-page">
            <h2 className="heading-3">Related Articles</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="card group overflow-hidden transition-all hover:shadow-lift">
                  <div className="h-40 overflow-hidden">
                    <img src={r.cover_image_url ?? 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary">{r.category}</Badge>
                    <h3 className="mt-2 font-heading font-semibold text-ink-900 line-clamp-2 group-hover:text-primary-700">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
