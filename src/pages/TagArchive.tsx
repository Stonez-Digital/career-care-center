import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleFromSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function TagArchive() {
  const { tag = '' } = useParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const topic = titleFromSlug(tag);
  const normalizedTag = toSlug(tag);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!active) return;

      if (error) {
        setPosts([]);
        setLoadError(true);
        setLoading(false);
        return;
      }

      const publishedPosts = (data as BlogPost[]) ?? [];
      // This schema stores a category rather than a separate tags array.
      // Match both an exact category slug and a single-word tag such as
      // /tag/web against a category like "Web Development".
      setPosts(
        publishedPosts.filter((post) => {
          const categorySlug = toSlug(post.category ?? '');
          return categorySlug === normalizedTag || categorySlug.split('-').includes(normalizedTag);
        })
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [normalizedTag]);

  return (
    <div>
      <PageHero
        eyebrow="Blog Topic"
        title={topic || 'Blog Topic'}
        description={`Explore published articles filed under ${topic || 'this topic'}.`}
      />

      <section className="section">
        <div className="container-page">
          {loading ? (
            <PageLoader />
          ) : loadError ? (
            <div className="py-20 text-center">
              <h2 className="heading-3">Articles could not be loaded</h2>
              <p className="mt-3 text-ink-500">
                Please try again shortly, or browse all articles.
              </p>
              <Link to="/blog" className="btn-primary mt-6">Browse all articles</Link>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="heading-3">No articles found</h2>
              <p className="mt-3 text-ink-500">
                There are no published articles filed under this topic yet.
              </p>
              <Link to="/blog" className="btn-primary mt-6">Browse all articles</Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-ink-500">
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="card group overflow-hidden transition-all hover:shadow-lift"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.cover_image_url ?? 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary">{post.category}</Badge>
                      <h2 className="mt-3 font-heading text-lg font-semibold text-ink-900 line-clamp-2 group-hover:text-primary-700">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm text-ink-600 line-clamp-2">{post.excerpt}</p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(post.published_at ?? post.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
