import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, CalendarDays, Sparkles, Award, CalendarCheck, Users2 } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useApp();

  const items = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'timetable', label: t('timetable'), icon: CalendarDays },
    { id: 'lesson-plan', label: t('lesson-plan'), icon: Sparkles },
    { id: 'marks', label: t('marks'), icon: Award },
    { id: 'leaves', label: t('leaves'), icon: CalendarCheck },
    { id: 'community', label: t('community'), icon: Users2 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
