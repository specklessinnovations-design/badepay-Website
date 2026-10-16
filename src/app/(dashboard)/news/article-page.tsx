/** One news article (mobile app: NewsArticle). GET /news/slug/:slug */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

interface Post {
  id: string; title: string; slug: string; content: string; excerpt?: string | null;
  coverImageUrl?: string | null; category: string; tags: string[]; publishedAt?: string | null; createdAt: string;
}

/** Articles are plain text from the admin portal; keep paragraphs. */
const paragraphs = (content: string) => content.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);

export default function NewsArticlePage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setPost(null); setMissing(false);
    apiClient.get(`/news/slug/${encodeURIComponent(slug)}`)
      .then((r) => { const p = r?.data?.post; if (p) setPost(p); else setMissing(true); })
      .catch(() => setMissing(true));
  }, [slug]);

  const share = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.excerpt ?? undefined, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* closed the share sheet */ }
  };

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/news" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} /> News
        </Link>
        {post && (
          <button type="button" onClick={share} aria-label="Share" className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Share2 size={16} />
          </button>
        )}
      </div>

      {missing ? (
        <p className="py-16 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>This article isn't available.</p>
      ) : !post ? (
        <div className="space-y-3">
          {[224, 24, 160].map((h, i) => <div key={i} className="animate-pulse rounded-2xl" style={{ height: h, background: 'var(--surface-secondary)' }} />)}
        </div>
      ) : (
        <article>
          {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="h-60 w-full rounded-2xl object-cover" />}
          <p className="mt-5 text-[11px] uppercase tracking-[0.2em]" style={{ color: '#0b7367' }}>{post.category}</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {post.excerpt && <p className="mt-5 text-[15px] font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{post.excerpt}</p>}
          {paragraphs(post.content).map((p, i) => (
            <p key={i} className="mt-4 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p}</p>
          ))}
          {post.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => <span key={t} className="rounded-full px-3 py-1 text-[11.5px]" style={{ background: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}>#{t}</span>)}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
