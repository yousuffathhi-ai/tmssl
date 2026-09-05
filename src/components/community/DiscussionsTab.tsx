import React, { useState, useEffect, useRef } from 'react';
import { CommunityPostRecord, DiscussionCategory, UserProfile } from '../../types';
import {
  fetchCommunityPostsDb,
  insertCommunityPostDb,
  deleteCommunityPostDb,
} from '../../lib/supabase';
import {
  MessageSquare,
  Send,
  Paperclip,
  Trash2,
  Heart,
  FileText,
  School,
  Sparkles,
  X,
  FileDown,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES: DiscussionCategory[] = [
  'General',
  'Subject Discussions',
  'Question Papers',
  'School Circulars',
];

interface DiscussionsTabProps {
  currentUser: UserProfile | null;
}

export const DiscussionsTab: React.FC<DiscussionsTabProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<CommunityPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // New post creation fields
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<DiscussionCategory>('General');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchCommunityPostsDb();
      if (isMounted) {
        setPosts(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // Create local object URL for preview/download
      const url = URL.createObjectURL(file);
      setAttachmentUrl(url);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !currentUser) return;

    setIsPosting(true);
    const newPost = await insertCommunityPostDb({
      user_id: currentUser.id,
      author_name: currentUser.name || 'Educator',
      author_role: currentUser.role === 'admin' ? 'Principal / Administrator' : 'Teacher',
      school_name: currentUser.schoolName || 'Government School, Sri Lanka',
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      category: postCategory,
      attachment_name: attachmentName || undefined,
      attachment_url: attachmentUrl || undefined,
    });

    setPosts(prev => [newPost, ...prev]);
    setPostContent('');
    setPostTitle('');
    setAttachmentName(null);
    setAttachmentUrl(null);
    setIsPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Delete this community post?')) {
      await deleteCommunityPostDb(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const isLiked = !prev[postId];
      setPosts(current =>
        current.map(p => {
          if (p.id === postId) {
            const count = p.likes_count ?? 0;
            return {
              ...p,
              likes_count: isLiked ? count + 1 : Math.max(0, count - 1),
            };
          }
          return p;
        })
      );
      return { ...prev, [postId]: isLiked };
    });
  };

  const filteredPosts = posts.filter(p => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const getCategoryBadgeClass = (category: DiscussionCategory) => {
    switch (category) {
      case 'General':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Subject Discussions':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'Question Papers':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'School Circulars':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatPostDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Sub-category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="filter-pill-all"
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            id={`filter-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. Post Creation Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleCreatePost} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Create Community Discussion</span>
            </span>
          </div>

          <input
            id="discussion-post-title-input"
            type="text"
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            placeholder="Post title or topic summary (optional)"
            className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            id="discussion-post-content-input"
            rows={3}
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="Share a teaching tip, ask a question..."
            required
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y"
          />

          {/* Category Selector Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Category Selector Pills:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  id={`cat-select-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setPostCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    postCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Attached file chip if any */}
          {attachmentName && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate font-medium">{attachmentName}</span>
              <button
                type="button"
                onClick={() => {
                  setAttachmentName(null);
                  setAttachmentUrl(null);
                }}
                className="ml-auto text-blue-500 hover:text-blue-800 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                id="discussion-attach-file-btn"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                <span>Attach image / PDF</span>
              </button>
            </div>

            <button
              id="discussion-submit-post-btn"
              type="submit"
              disabled={isPosting || !postContent.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <span>Post</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Feed Area: Real-time user discussions list */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading discussions feed...
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State strictly matching specification */
          <div
            id="discussions-empty-state"
            className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No posts here yet – start the conversation.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Be the first to share an exam tip, lesson question, or teaching insight with fellow Sri Lankan educators.
            </p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isAuthor = currentUser?.id === post.user_id;
            const isLiked = likedPosts[post.id];
            const likesCount = post.likes_count ?? 0;

            return (
              <div
                key={post.id}
                id={`discussion-post-${post.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Author Info & Category */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {post.author_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {post.author_name}
                        </h4>
                        {post.author_role && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            • {post.author_role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <School className="w-3 h-3 text-slate-400" />
                        <span>{post.school_name || 'Government School, Sri Lanka'}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatPostDate(post.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        post.category
                      )}`}
                    >
                      {post.category}
                    </span>
                    {isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Title */}
                {post.title && (
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {post.title}
                  </h3>
                )}

                {/* Post Content */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Attached document if any */}
                {(post.attachment_name || post.attachment_url) && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400">
                    <FileText className="w-4 h-4 shrink-0 text-blue-600" />
                    <span className="font-semibold truncate max-w-xs">
                      {post.attachment_name || 'Attachment Document.pdf'}
                    </span>
                    <a
                      href={post.attachment_url || '#'}
                      download={post.attachment_name || 'document.pdf'}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline ml-1"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}

                {/* Post Footer Actions */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 font-medium transition cursor-pointer ${
                      isLiked
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'hover:text-rose-600 dark:hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount} Likes</span>
                  </button>

                  <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Verified Educator Post</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
