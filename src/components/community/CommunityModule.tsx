import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DiscussionsTab } from './DiscussionsTab';
import { ResourcesTab } from './ResourcesTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { TeachersTab } from './TeachersTab';
import {
  MessageSquare,
  Folder,
  Megaphone,
  Users,
  School,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

type CommunityTab = 'discussions' | 'resources' | 'announcements' | 'teachers';

interface TabItem {
  id: CommunityTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}

const TABS: TabItem[] = [
  { id: 'discussions', label: '💬 Discussions', icon: MessageSquare },
  { id: 'resources', label: '📁 Resources', icon: Folder },
  { id: 'announcements', label: '📣 Announcements', icon: Megaphone },
  { id: 'teachers', label: '👥 Teachers', icon: Users },
];

export const CommunityModule: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<CommunityTab>('discussions');

  const dynamicSchoolName = currentUser?.schoolName?.trim() || 'Government School, Sri Lanka';
  const dynamicDistrict = currentUser?.district?.trim();

  return (
    <div id="community-hub-module" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Module Title & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Community Hub
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              National Teacher Network (Sri Lanka)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {dynamicSchoolName}
            </span>
            {dynamicDistrict && <span>• {dynamicDistrict} District</span>}
            <span>• Ministry of Education & NIE Curriculum Collaborative</span>
          </p>
        </div>

        {/* User quick status */}
        {currentUser && (
          <div className="flex items-center gap-3 p-2 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Active in National Network
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 1. NAVIGATION TABS (TOP BAR) */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`community-nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Views */}
      <div className="transition-opacity duration-150">
        {activeTab === 'discussions' && <DiscussionsTab currentUser={currentUser} />}
        {activeTab === 'resources' && <ResourcesTab currentUser={currentUser} />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'teachers' && <TeachersTab currentUser={currentUser} />}
      </div>
    </div>
  );
};
