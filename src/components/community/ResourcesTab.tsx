import React, { useState, useEffect, useRef } from 'react';
import { CommunityResourceRecord, ResourceTypeCategory, UserProfile } from '../../types';
import {
  fetchCommunityResourcesDb,
  insertCommunityResourceDb,
  deleteCommunityResourceDb,
} from '../../lib/supabase';
import {
  Folder,
  FileText,
  Upload,
  Download,
  Trash2,
  School,
  Clock,
  Sparkles,
  FileCheck,
  CheckCircle,
  X,
} from 'lucide-react';

const RESOURCE_TYPES: ResourceTypeCategory[] = [
  'Worksheets',
  'Question Papers',
  'Notes & PDFs',
];

interface ResourcesTabProps {
  currentUser: UserProfile | null;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ currentUser }) => {
  const [resources, setResources] = useState<CommunityResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All');

  // Upload Box State
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<ResourceTypeCategory>('Worksheets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchCommunityResourcesDb();
      if (isMounted) {
        setResources(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleShareResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    setIsUploading(true);

    const fileName = selectedFile ? selectedFile.name : `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    const fileSize = selectedFile
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : '1.5 MB';
    const fileUrl = selectedFile ? URL.createObjectURL(selectedFile) : `#${fileName}`;

    const newRes = await insertCommunityResourceDb({
      user_id: currentUser.id,
      author_name: currentUser.name || 'Educator',
      school_name: currentUser.schoolName || 'Government School, Sri Lanka',
      title: title.trim(),
      resource_type: resourceType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
    });

    setResources(prev => [newRes, ...prev]);
    setTitle('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploading(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Remove this resource?')) {
      await deleteCommunityResourceDb(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
    }
  };

  const filteredResources = resources.filter(r => {
    if (selectedType === 'All') return true;
    return r.resource_type === selectedType;
  });

  const getBadgeStyle = (type: ResourceTypeCategory) => {
    switch (type) {
      case 'Worksheets':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Question Papers':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Notes & PDFs':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
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
      {/* 1. Filter Pills: [All] [Worksheets] [Question Papers] [Notes & PDFs] */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="resource-filter-pill-all"
          onClick={() => setSelectedType('All')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
            selectedType === 'All'
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
          }`}
        >
          All
        </button>
        {RESOURCE_TYPES.map(type => (
          <button
            key={type}
            id={`resource-filter-pill-${type.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
              selectedType === type
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 2. Resource Upload Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleShareResource} className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              Share Educational Resource
            </h3>
          </div>

          {/* Text Input field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Resource Title
            </label>
            <input
              id="resource-title-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Resource title (e.g. Grade 9 Algebra worksheet)"
              required
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Selection Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Type Selection Pills:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {RESOURCE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  id={`resource-type-pill-${t.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setResourceType(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    resourceType === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* File Selection & Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                id="resource-choose-file-btn"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>📄 Choose PDF / file</span>
              </button>

              {selectedFile ? (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate max-w-xs flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" />
                  {selectedFile.name}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">PDF, Word, or slides</span>
              )}
            </div>

            <button
              id="resource-share-action-btn"
              type="submit"
              disabled={isUploading || !title.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <span>Share</span>
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Display Grid: Real-time resources list with empty state */}
      <div>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading educational resources...
          </div>
        ) : filteredResources.length === 0 ? (
          /* Empty State strictly matching specification */
          <div
            id="resources-empty-state"
            className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No shared resources yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Share worksheets, past papers, or revision summaries with Sri Lankan teachers across all 9 provinces.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map(res => {
              const isAuthor = currentUser?.id === res.user_id;

              return (
                <div
                  key={res.id}
                  id={`resource-card-${res.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                          res.resource_type
                        )}`}
                      >
                        {res.resource_type}
                      </span>
                      {isAuthor && (
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
                      {res.title}
                    </h4>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate font-medium flex-1">
                        {res.file_name || 'document.pdf'}
                      </span>
                      {res.file_size && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {res.file_size}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0 text-[11px] text-slate-500 dark:text-slate-400">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {res.author_name}
                      </p>
                      <p className="truncate flex items-center gap-1 text-[10px]">
                        <School className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{res.school_name || 'Sri Lanka School'}</span>
                      </p>
                    </div>

                    <a
                      href={res.file_url || '#'}
                      download={res.file_name || 'resource.pdf'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
