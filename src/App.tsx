import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardView } from './components/dashboard/DashboardView';
import { TimetableModule } from './components/timetable/TimetableModule';
import { LessonPlanModule } from './components/lessonPlan/LessonPlanModule';
import { MarksModule } from './components/marks/MarksModule';
import { LeavesModule } from './components/leaves/LeavesModule';
import { CommunityModule } from './components/community/CommunityModule';
import { ProfileView } from './components/profile/ProfileView';

export default function App() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mandatory Authentication Flow: If not authenticated, show AuthScreen
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* PWA Offline indicator bar */}
      <OfflineIndicator />

      <div className="flex flex-1 min-h-screen">
        {/* Desktop Navigation Sidebar */}
        <Sidebar currentTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          {/* Top Bar / Header */}
          <Header currentTab={activeTab} onSelectTab={setActiveTab} />

          {/* Body views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
            {activeTab === 'timetable' && <TimetableModule />}
            {activeTab === 'lesson-plan' && <LessonPlanModule />}
            {activeTab === 'marks' && <MarksModule />}
            {activeTab === 'leaves' && <LeavesModule />}
            {activeTab === 'community' && <CommunityModule />}
            {activeTab === 'profile' && <ProfileView />}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
