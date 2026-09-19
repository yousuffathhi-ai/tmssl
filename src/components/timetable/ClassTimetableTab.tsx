import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_OF_WEEK } from '../../data/sriLankaEduData';
import { isClassTeacher } from '../../types';
import {
  GraduationCap,
  Clock,
  Calendar,
  Lock,
  ShieldCheck,
  Building,
  Printer,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { exportTimetableToPDF, exportTimetableToExcel } from '../../utils/exportUtils';

export const ClassTimetableTab: React.FC = () => {
  const {
    currentUser,
    classesSections,
    teachersList,
    timetableSlots,
    bellSchedule,
    schoolSettings,
    canManageTimetables,
  } = useApp();

  const dynamicSchoolName = currentUser?.schoolName?.trim() || schoolSettings.school_name?.trim() || '';

  // Determine classes the user can view
  // 1. Admins / Timetable Creators can view all classes
  // 2. Class Teachers can view their assigned class
  const userAssignedClassName = currentUser?.assignedClass?.trim() || '';

  const accessibleClasses = useMemo(() => {
    if (canManageTimetables) {
      return classesSections;
    }
    // Filter classes where user is assigned class teacher
    return classesSections.filter((cls) => isClassTeacher(currentUser, cls));
  }, [canManageTimetables, classesSections, currentUser]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return accessibleClasses[0]?.id || '';
  });

  // Ensure selectedClassId stays valid
  const activeClass =
    accessibleClasses.find((c) => c.id === selectedClassId) || accessibleClasses[0];

  // Dynamic period time labels
  const periodHeaders = useMemo(() => {
    const list: { period: number; label: string; time: string }[] = [];
    const [startH, startM] = (bellSchedule.first_period_start || '07:45').split(':').map(Number);
    let currentMinutes = (isNaN(startH) ? 7 : startH) * 60 + (isNaN(startM) ? 45 : startM);

    const formatTime = (totalMins: number) => {
      const h24 = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const count = Number(bellSchedule.periods_per_day) || 8;
    const pLength = Number(bellSchedule.period_length_mins) || 40;
    const breakAfter = Number(bellSchedule.breaks_after_periods) || 3;
    const bLength = Number(bellSchedule.break_duration_mins) || 20;

    for (let p = 1; p <= count; p++) {
      const pStart = currentMinutes;
      const pEnd = pStart + pLength;
      list.push({
        period: p,
        label: `Period ${p}`,
        time: `${formatTime(pStart)} - ${formatTime(pEnd)}`,
      });
      currentMinutes = pEnd;
      if (p === breakAfter) {
        currentMinutes += bLength;
      }
    }
    return list;
  }, [bellSchedule]);

  // Color generator for subject badges
  const getSubjectColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/60',
      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60',
      'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800/60',
      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60',
      'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60',
      'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800/60',
    ];
    return colors[hash % colors.length];
  };

  const handleExportPDF = () => {
    if (!activeClass) return;
    exportTimetableToPDF({
      schoolName: dynamicSchoolName,
      bellSchedule,
      classes: [activeClass],
      teachers: teachersList,
      slots: timetableSlots,
      selectedClassId: activeClass.id,
    });
  };

  // If user is a teacher without assigned class
  if (!canManageTimetables && accessibleClasses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Class Timetable Access Restricted
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            According to the Ministry of Education Multi-Tenant RBAC guidelines, Teachers may only access full class schedules if they are officially designated as the <strong>Class Teacher</strong> (e.g. Grade 10-A Class Teacher).
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mt-3 text-left">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Your Current Profile:</p>
            <p>• Role: <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{currentUser?.role || 'TEACHER'}</span></p>
            <p>• Assigned Class: <span className="italic">{userAssignedClassName || 'None designated'}</span></p>
            <p className="mt-1 text-slate-400">Please contact the School Principal or Timetable Committee to assign your class teacher designation in your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  if (classesSections.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
        <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">No Classes Configured</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please add classes and sections in the <strong>Setup</strong> tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Timetable:</span>
          </div>

          {canManageTimetables ? (
            <select
              value={activeClass?.id || ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {accessibleClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.room || 'Room N/A'}) {cls.class_teacher_name ? `• ${cls.class_teacher_name}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {activeClass?.name} ({activeClass?.room || 'Room N/A'})
              </span>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md">
                Assigned Class
              </span>
            </div>
          )}

          {!canManageTimetables && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Verified Class Teacher Access
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={timetableSlots.length === 0 || !activeClass}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Class PDF</span>
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-3 w-28 text-center sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
                  Day
                </th>
                {periodHeaders.map((ph) => (
                  <th key={ph.period} className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                    <div>{ph.label}</div>
                    <div className="text-[10px] font-normal text-slate-400 lowercase">{ph.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {DAYS_OF_WEEK.map((day) => (
                <tr key={day} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                    {day}
                  </td>
                  {periodHeaders.map((ph) => {
                    const slot = timetableSlots.find(
                      (s) =>
                        s.classId === activeClass?.id &&
                        s.day === day &&
                        s.period === ph.period
                    );
                    const teacher = teachersList.find((t) => t.id === slot?.teacherId);

                    return (
                      <td
                        key={ph.period}
                        className="p-2.5 text-center border-l border-slate-100 dark:border-slate-800 align-top min-w-[110px]"
                      >
                        {slot ? (
                          <div
                            className={`p-2 rounded-xl border text-[11px] font-semibold space-y-1 ${getSubjectColor(
                              slot.subject
                            )}`}
                          >
                            <div className="font-bold truncate" title={slot.subject}>
                              {slot.subject}
                            </div>
                            <div className="text-[10px] opacity-85 truncate" title={slot.teacherName || teacher?.name}>
                              {slot.teacherName || teacher?.name || 'Assigned Staff'}
                            </div>
                            {slot.isDouble && (
                              <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                                Double
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-700 italic">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
