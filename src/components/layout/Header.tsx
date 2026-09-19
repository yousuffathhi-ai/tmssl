import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Sun,
  Moon,
  GraduationCap,
  Building,
  Calendar,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const {
    currentUser,
    switchRole,
    theme,
    toggleTheme,
    seedSampleSchoolData,
    resetAllDataToEmpty,
    classesSections,
    schoolSettings,
    tenantSchoolId,
  } = useApp();

  // Dynamic greeting based on current local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🖐️';
    if (hour < 17) return 'Good Afternoon 🖐️';
    return 'Good Evening 🖐️';
  }, []);

  // Formatted date (e.g. "Saturday, 14 March 2026")
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // School name dynamically sourced from logged in profile / database
  const schoolBadgeName = currentUser?.schoolName?.trim() || schoolSettings?.school_name?.trim() || '';

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors no-print">
      {/* Left: Greeting, User Full Name, and Date */}
      <div className="flex items-center gap-3">
        {/* User Profile Circle Avatar */}
        <button
          onClick={() => onSelectTab('profile')}
          title="View profile & settings"
          className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition shrink-0 cursor-pointer"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {greeting}
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {currentUser?.name || 'Faculty Member'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Right: School Badge / Tag & Actions Bar */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* School Badge / Tag (Dynamic only from user profile / database) */}
        {schoolBadgeName ? (
          <div
            title={schoolBadgeName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs font-bold shadow-xs max-w-[280px] sm:max-w-xs truncate"
          >
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{schoolBadgeName}</span>
          </div>
        ) : (
          <button
            onClick={() => onSelectTab('profile')}
            title="Set School Name in Profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 border border-dashed border-slate-300 hover:border-amber-400 dark:border-slate-700 dark:hover:border-amber-500/60 text-slate-500 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 text-xs font-medium transition cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Set School Name in Profile</span>
          </button>
        )}

        {/* Quick Demo Data Seed if classes are empty */}
        {classesSections.length === 0 ? (
          <button
            onClick={seedSampleSchoolData}
            title="Load sample Sri Lankan school data (classes, teachers, rules) for instant testing"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Sample Data</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirm('Reset timetable and all records to clean empty state?')) {
                resetAllDataToEmpty();
              }
            }}
            title="Reset back to empty state"
            className="hidden xl:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-red-500 transition"
          >
            Reset
          </button>
        )}

        {/* In-App PWA Install Prompt */}
        <PWAInstallButton />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Active RBAC Role Badge & Tester */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="rbac-role-select" className="sr-only">Active Role</label>
          <div className="relative">
            <select
              id="rbac-role-select"
              value={currentUser?.role || 'teacher'}
              onChange={(e) => switchRole(e.target.value as any)}
              title="Active Role (Switch to verify RBAC & Teacher Read-Only vs Admin Controls)"
              className={`text-xs font-black px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none transition ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                  : currentUser?.role === 'timetable_creator'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800'
              }`}
            >
              <option value="admin">Principal (Admin)</option>
              <option value="timetable_creator">Timetable Creator</option>
              <option value="teacher">Teacher (Read-Only)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
