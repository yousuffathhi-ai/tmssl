import React, { useState, useEffect } from 'react';
import { AnnouncementRecord, AnnouncementCategory } from '../../types';
import { fetchAnnouncementsDb } from '../../lib/supabase';
import {
  Megaphone,
  FileText,
  Users,
  ShieldCheck,
  Calendar,
  Download,
  Building2,
  Clock,
  FileDown,
} from 'lucide-react';

const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'Circular',
  'Meeting',
  'Policy',
  'Event',
];

export const AnnouncementsTab: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchAnnouncementsDb();
      if (isMounted) {
        setAnnouncements(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  const getCategoryIcon = (category: AnnouncementCategory) => {
    switch (category) {
      case 'Circular':
        return <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Meeting':
        return <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Policy':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Event':
        return <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Megaphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: AnnouncementCategory) => {
    switch (category) {
      case 'Circular':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Meeting':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Policy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'Event':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatDate = (dateStr: string) => {
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
      {/* 1. Filter Pills: [All] [Circular] [Meeting] [Policy] [Event] */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="announcement-pill-all"
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
          }`}
        >
          All
        </button>
        {ANNOUNCEMENT_CATEGORIES.map(cat => (
          <button
            key={cat}
            id={`announcement-pill-${cat.toLowerCase()}`}
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

      {/* 2. Official Notices Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading official notices...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No official announcements found for this category.
            </p>
          </div>
        ) : (
          filteredAnnouncements.map(notice => (
            <div
              key={notice.id}
              id={`announcement-card-${notice.id}`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3.5">
                {/* Category Icon Badge */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getCategoryIcon(notice.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                          notice.category
                        )}`}
                      >
                        {notice.category}
                      </span>
                      {notice.issuer && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{notice.issuer}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(notice.date)}</span>
                    </span>
                  </div>

                  {/* Announcement Title */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {notice.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {notice.content}
                  </p>

                  {/* PDF Download link attachment button */}
                  {notice.attachment_name && (
                    <div className="pt-2">
                      <a
                        href={notice.attachment_url || '#'}
                        download={notice.attachment_name}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/60 text-xs font-bold text-blue-700 dark:text-blue-300 transition shadow-2xs"
                      >
                        <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{notice.attachment_name}</span>
                        <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded ml-1">
                          PDF Download
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
