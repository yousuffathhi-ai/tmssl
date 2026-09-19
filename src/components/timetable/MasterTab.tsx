import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_OF_WEEK } from '../../data/sriLankaEduData';
import {
  Calendar,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Filter,
  AlertTriangle,
  Clock,
  Building,
  GraduationCap,
  Zap,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { exportTimetableToExcel, exportTimetableToPDF } from '../../utils/exportUtils';

export const MasterTab: React.FC = () => {
  const {
    currentUser,
    schoolSettings,
    bellSchedule,
    classesSections,
    teachersList,
    subjectRules,
    timetableSlots,
    generateAndSaveTimetable,
    conflicts,
    isGenerating,
    canManageTimetables,
  } = useApp();

  const dynamicSchoolName = currentUser?.schoolName?.trim() || schoolSettings.school_name?.trim() || '';

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

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

  const handleGenerate = () => {
    const result = generateAndSaveTimetable();
    setGenerationNotice(result.message);
    setTimeout(() => setGenerationNotice(null), 5000);
  };

  const handleExportExcel = () => {
    exportTimetableToExcel({
      schoolName: dynamicSchoolName,
      bellSchedule,
      classes: classesSections,
      teachers: teachersList,
      subjectRules,
      slots: timetableSlots,
    });
  };

  const handleExportPDF = () => {
    exportTimetableToPDF({
      schoolName: dynamicSchoolName,
      bellSchedule,
      classes: classesSections,
      teachers: teachersList,
      slots: timetableSlots,
      selectedClassId: selectedClassId === 'ALL' ? undefined : selectedClassId,
    });
  };

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

  const selectedClass = classesSections.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-5">
      {/* RBAC Teacher Notice Banner */}
      {!canManageTimetables && (
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Read-Only Access:</strong> You are viewing the school Master Timetable as a <strong>Teacher</strong>. Generating, editing, and rule modifications are restricted to the School Principal and Timetable Creator.
            </span>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
            RBAC Enforced
          </span>
        </div>
      )}

      {/* Top Filter & Actions Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">View Grid:</span>
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Classes (Master Grid)</option>
            {classesSections.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.room})
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400">
            {timetableSlots.length} active assignments
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canManageTimetables ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || subjectRules.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : '✨ Generate'}</span>
            </button>
          ) : (
            <div
              title="Only ADMIN or TIMETABLE_CREATOR roles can regenerate timetables"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Read-Only</span>
            </div>
          )}

          <button
            onClick={handleExportExcel}
            disabled={timetableSlots.length === 0}
            title="Export full Excel workbook (.xlsx)"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={timetableSlots.length === 0}
            title="Export official printable PDF (.pdf)"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Generation Toast or Notice */}
      {generationNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{generationNotice}</span>
        </div>
      )}

      {/* Conflicts Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{conflicts.length} Constraint Conflict(s) Detected</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-700 dark:text-amber-400 text-[11px]">
            {conflicts.slice(0, 3).map((c, i) => (
              <li key={i}>{c.description || c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Timetable Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {timetableSlots.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No Timetable Generated Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Configure your classes, teachers, and subject rules in the <strong>Setup</strong> tab, then click the <strong>✨ Generate</strong> button above to construct a conflict-free schedule.
            </p>
            <button
              onClick={handleGenerate}
              disabled={subjectRules.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Timetable Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              {/* Header Row: Days & Periods */}
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                  <th className="p-3 font-bold w-28 text-center border-r border-slate-200 dark:border-slate-800">
                    Day / Time
                  </th>
                  {periodHeaders.map((hdr) => (
                    <th
                      key={hdr.period}
                      className="p-3 font-bold text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-w-[125px]"
                    >
                      <div className="text-slate-900 dark:text-white">{hdr.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{hdr.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Rows: Monday to Friday */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/40 text-center border-r border-slate-200 dark:border-slate-800">
                      {day}
                    </td>

                    {periodHeaders.map((hdr) => {
                      // Find matching slots for this day and period
                      let matchingSlots = timetableSlots.filter(
                        (s) => s.day === day && s.periodIndex === hdr.period
                      );

                      if (selectedClassId !== 'ALL') {
                        matchingSlots = matchingSlots.filter((s) => s.classId === selectedClassId);
                      }

                      return (
                        <td
                          key={hdr.period}
                          className="p-2 align-top border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                        >
                          {matchingSlots.length === 0 ? (
                            <div className="h-14 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                              Open
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {matchingSlots.map((slot) => {
                                const cls = classesSections.find((c) => c.id === slot.classId);
                                const tch = teachersList.find((t) => t.id === slot.teacherId);
                                const colorClass = getSubjectColor(slot.subjectName);

                                return (
                                  <div
                                    key={slot.id}
                                    className={`p-2 rounded-lg border ${colorClass} transition hover:shadow-xs space-y-1`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold truncate text-xs">
                                        {slot.subjectName}
                                      </span>
                                      {slot.isDoublePeriod && (
                                        <span className="inline-flex items-center text-[9px] font-extrabold px-1 rounded bg-amber-500 text-white shrink-0">
                                          <Zap className="w-2.5 h-2.5 mr-0.5" /> 2P
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] opacity-90">
                                      <span className="font-medium truncate">
                                        {tch ? tch.name.split(' ')[0] : 'Teacher'}
                                      </span>
                                      <span className="font-bold truncate ml-1 text-[9px]">
                                        {cls ? cls.name : 'Class'}
                                      </span>
                                    </div>

                                    {slot.room && (
                                      <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                        📍 {slot.room}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
        )}
      </div>
    </div>
  );
};
