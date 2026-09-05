import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Award,
  CalendarCheck,
  Users2,
  UserCheck,
  LogOut,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, logout, switchRole } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: '' },
    { id: 'timetable', label: 'Timetable Maker', icon: CalendarDays, badge: 'ASC' },
    { id: 'lesson-plan', label: 'AI Lesson Plan', icon: Sparkles, badge: 'NIE' },
    { id: 'marks', label: 'Marks Analyser', icon: Award, badge: 'Term 1-3' },
    { id: 'leaves', label: 'My Leaves & Attendance', icon: CalendarCheck, badge: '' },
    { id: 'community', label: 'Community Hub', icon: Users2, badge: '' },
    { id: 'profile', label: 'Teacher Profile', icon: UserCheck, badge: '' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md ring-2 ring-amber-400/30">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            TMS SL
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              LK
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Sri Lanka School System
          </p>
        </div>
      </div>

      {/* School Name Banner */}
      <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs">
        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          School Institute
        </span>
        <span className="block font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={currentUser?.schoolName}>
          {currentUser?.schoolName || 'Set School in Profile'}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge ? (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${isActive ? 'opacity-90' : ''}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        {/* Role Toggle Pill */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium px-1">Role:</span>
          <select
            value={currentUser?.role || 'teacher'}
            onChange={e => switchRole(e.target.value as any)}
            className="bg-transparent font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer text-right pr-1"
          >
            <option value="admin">Principal (Admin)</option>
            <option value="teacher">Teacher</option>
            <option value="guest">Guest / Parent</option>
          </select>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
              {currentUser?.name?.charAt(0) || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {currentUser?.name || 'Teacher'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.staffId || 'SLTS'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
