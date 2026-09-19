import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SetupTab } from './SetupTab';
import { MasterTab } from './MasterTab';
import { TeacherTab } from './TeacherTab';
import { ReliefTab } from './ReliefTab';
import { ClassTimetableTab } from './ClassTimetableTab';
import {
  SlidersHorizontal,
  CalendarDays,
  UserCheck,
  UserMinus,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  exportTimetableToExcel,
  exportTimetableToPDF,
  generateLessonAndMarksPPTX,
} from '../../utils/exportUtils';

export type TimetableNavTab = 'setup' | 'master' | 'class' | 'teacher' | 'relief';

export const TimetableModule: React.FC = () => {
  const {
    currentUser,
    schoolSettings,
    bellSchedule,
    classesSections,
    teachersList,
    subjectRules,
    timetableSlots,
    generateAndSaveTimetable,
    isGenerating,
    canManageTimetables,
  } = useApp();

  const dynamicSchoolName = currentUser?.schoolName?.trim() || schoolSettings.school_name?.trim() || '';

  // For teachers: default to 'teacher' or 'class' view; for admins: 'setup' or 'master'
  const [activeTab, setActiveTab] = useState<TimetableNavTab>(() => {
    if (!canManageTimetables) {
      return currentUser?.assignedClass ? 'class' : 'teacher';
    }
    return timetableSlots.length > 0 ? 'master' : 'setup';
  });

  // Keep tab updated if role switches
  useEffect(() => {
    if (!canManageTimetables && activeTab === 'setup') {
      setActiveTab('teacher');
    }
  }, [canManageTimetables]);

  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Top Actions Handlers
  const handleTopGenerate = () => {
    if (!canManageTimetables) {
      setActionNotice({
        type: 'error',
        message: 'Access Denied: Only Principal (ADMIN) or Timetable Creator roles are permitted to generate timetables.',
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    if (classesSections.length === 0 || teachersList.length === 0 || subjectRules.length === 0) {
      setActionNotice({
        type: 'error',
        message: 'Please define Classes, Teachers, and Subject Rules in the Setup tab first.',
      });
      setTimeout(() => setActionNotice(null), 4000);
      setActiveTab('setup');
      return;
    }

    const result = generateAndSaveTimetable();
    setActionNotice({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
    setTimeout(() => setActionNotice(null), 5000);

    // Switch to Master tab to view results
    if (result.success) {
      setActiveTab('master');
    }
  };

  const handleTopExcelExport = () => {
    if (timetableSlots.length === 0) {
      setActionNotice({
        type: 'error',
        message: 'Generate a timetable first before exporting to Excel.',
      });
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    exportTimetableToExcel({
      schoolName: dynamicSchoolName,
      bellSchedule,
      classes: classesSections,
      teachers: teachersList,
      subjectRules,
      slots: timetableSlots,
    });

    setActionNotice({
      type: 'success',
      message: 'Excel multi-sheet workbook downloaded successfully (.xlsx)!',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleTopPDFExport = () => {
    if (timetableSlots.length === 0) {
      setActionNotice({
        type: 'error',
        message: 'Generate a timetable first before exporting to PDF.',
      });
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    exportTimetableToPDF({
      schoolName: dynamicSchoolName,
      bellSchedule,
      classes: classesSections,
      teachers: teachersList,
      slots: timetableSlots,
    });

    setActionNotice({
      type: 'success',
      message: 'Official printable Master Timetable PDF downloaded (.pdf)!',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleTopPPTXExport = () => {
    generateLessonAndMarksPPTX({
      schoolName: dynamicSchoolName,
      grade: classesSections[0]?.name || 'Grade 10',
      teacherName: teachersList[0]?.name || 'Staff In-Charge',
      subjectAllocations: subjectRules.map((r) => ({
        subject: r.subject,
        periods: r.periods_per_week,
        type: r.needs_double_period ? 'Theory + Practical Double' : 'Standard Period',
      })),
    });

    setActionNotice({
      type: 'success',
      message: '10-Slide Academic PPTX presentation generated and downloaded (.pptx)!',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* =======================================================================
          TOP BAR: NAVIGATION TABS & ACTIONS BAR
         ======================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs: [Setup] [Master] [Class] [Teacher] [Relief] */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 overflow-x-auto">
          {canManageTimetables ? (
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Setup</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('setup')}
              title="View institutional rules and constraints (Read-Only)"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition shrink-0 cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Setup (View)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'master'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Master</span>
            {timetableSlots.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'class'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Class</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{!canManageTimetables ? 'My Schedule' : 'Teacher'}</span>
          </button>

          <button
            onClick={() => setActiveTab('relief')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer ${
              activeTab === 'relief'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserMinus className="w-4 h-4" />
            <span>Relief</span>
          </button>
        </div>

        {/* Top Actions Bar: Button [✨ Generate], Button [📄 Excel], Button [📄 PDF] */}
        <div className="flex items-center flex-wrap gap-2">
          {canManageTimetables ? (
            <button
              onClick={handleTopGenerate}
              disabled={isGenerating}
              title="Generate conflict-free timetable based on defined rules"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : '✨ Generate'}</span>
            </button>
          ) : (
            <div
              title="Timetable generation is strictly restricted to School Principal (ADMIN) and Timetable Creator roles"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-not-allowed select-none"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Generate (Admin Only)</span>
            </div>
          )}

          <button
            onClick={handleTopExcelExport}
            disabled={timetableSlots.length === 0}
            title="Export master and class timetables to Excel workbook (.xlsx)"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📄 Excel</span>
          </button>

          <button
            onClick={handleTopPDFExport}
            disabled={timetableSlots.length === 0}
            title="Export official printable A4 PDF timetable (.pdf)"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>📄 PDF</span>
          </button>

          <button
            onClick={handleTopPPTXExport}
            title="Export 10-slide PowerPoint presentation (.pptx)"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition text-xs font-bold cursor-pointer"
          >
            <Presentation className="w-4 h-4" />
            <span>📊 PPTX</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* =======================================================================
          TAB CONTENT RENDERING
         ======================================================================= */}
      {activeTab === 'setup' && <SetupTab />}
      {activeTab === 'master' && <MasterTab />}
      {activeTab === 'class' && <ClassTimetableTab />}
      {activeTab === 'teacher' && <TeacherTab />}
      {activeTab === 'relief' && <ReliefTab />}
    </div>
  );
};
