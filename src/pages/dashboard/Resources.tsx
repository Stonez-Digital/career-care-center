import { useEffect, useState } from 'react';
import { BookOpen, Bookmark, BookmarkCheck, FileText, Video, ExternalLink, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Resource, ResourceCategory, ResourceType } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Badge from '@/components/Badge';
import SafeImage from '@/components/SafeImage';
import { cn } from '@/lib/utils';
import { reportMutationError } from '@/lib/mutations';

const categories: (ResourceCategory | 'All')[] = ['All', 'Career Development', 'Entrepreneurship', 'Leadership', 'Employability', 'CV Writing', 'Interview Preparation'];

const typeIcon: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText, video: Video, article: BookOpen,
};

const resourceCoverFallback = '/resource-cover.svg';

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ResourceCategory | 'All'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [res, bms] = await Promise.all([
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        user ? supabase.from('resource_bookmarks').select('resource_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ]);
      setResources((res.data as Resource[]) ?? []);
      setBookmarks(new Set((bms.data ?? []).map((b: { resource_id: string }) => b.resource_id)));
      setLoading(false);
    })();
  }, [user]);

  const toggleBookmark = async (resourceId: string) => {
    if (!user) return;
    if (bookmarks.has(resourceId)) {
      const { error } = await supabase.from('resource_bookmarks').delete().eq('resource_id', resourceId).eq('user_id', user.id);
      if (reportMutationError('remove this bookmark', error)) return;
      setBookmarks((b) => { const n = new Set(b); n.delete(resourceId); return n; });
    } else {
      const { error } = await supabase.from('resource_bookmarks').insert({ resource_id: resourceId, user_id: user.id });
      if (reportMutationError('save this bookmark', error)) return;
      setBookmarks((b) => new Set(b).add(resourceId));
    }
  };

  const trackDownload = async (r: Resource) => {
    const { error } = await supabase.from('resources').update({ downloads: r.downloads + 1 }).eq('id', r.id);
    reportMutationError('record this download', error);
  };

  if (loading) return <PageLoader />;

  const filtered = filter === 'All' ? resources : resources.filter((r) => r.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink-900">Resource Center</h1>
        <p className="mt-1 text-ink-500">Learning materials to boost your career</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition-all',
              filter === c ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const Icon = typeIcon[r.type];
          const isBookmarked = bookmarks.has(r.id);
          return (
            <div key={r.id} className="card group overflow-hidden transition-all hover:shadow-lift">
              <div className="relative h-36 overflow-hidden bg-primary-900">
                <SafeImage
                  src={r.cover_image_url ?? resourceCoverFallback}
                  fallbackSrc={resourceCoverFallback}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={() => toggleBookmark(r.id)}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-600 backdrop-blur transition-colors hover:text-primary-700"
                  aria-label="Bookmark"
                >
                  {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary-700" /> : <Bookmark className="h-5 w-5" />}
                </button>
              </div>
              {r.type === 'video' && (
                <video
                  src={r.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full bg-black"
                  aria-label={r.title}
                >
                  Your browser does not support video playback. Use the download link below.
                </video>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-secondary-500" />
                  <Badge variant="neutral">{r.type}</Badge>
                  <Badge variant="primary">{r.category}</Badge>
                </div>
                <h3 className="mt-3 font-heading font-semibold text-ink-900 line-clamp-2">{r.title}</h3>
                <p className="mt-2 text-sm text-ink-600 line-clamp-2">{r.description}</p>
                {r.duration && <p className="mt-2 text-xs text-ink-400">{r.duration}</p>}
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-xs text-ink-400">{r.downloads} downloads</span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackDownload(r)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    {r.type === 'article' ? <><ExternalLink className="h-4 w-4" /> Read</> : <><Download className="h-4 w-4" /> Download</>}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
