import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_OF_WEEK } from '../../data/sriLankaEduData';
import {
  User,
  BookOpen,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Zap,
  Printer,
  Sparkles,
} from 'lucide-react';

export const TeacherTab: React.FC = () => {
  const { teachersList, classesSections, timetableSlots, bellSchedule } = useApp();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return teachersList[0]?.id || '';
  });

  // Keep selected teacher up-to-date if list changes
  const activeTeacher = teachersList.find((t) => t.id === selectedTeacherId) || teachersList[0];

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
        label: `P${p}`,
        time: `${formatTime(pStart)} - ${formatTime(pEnd)}`,
      });
      currentMinutes = pEnd;
      if (p === breakAfter) {
        currentMinutes += bLength;
      }
    }
    return list;
  }, [bellSchedule]);

  if (teachersList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
        <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">No Teachers Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please add teachers in the <strong>Setup</strong> tab to view individual teacher timetables and workload distribution.
        </p>
      </div>
    );
  }

  // Workload calculations for active teacher
  const assignedSlots = timetableSlots.filter((s) => s.teacherId === activeTeacher?.id);
  const weeklyMax = (activeTeacher?.max_periods_per_day || 6) * 5;
  const loadPercentage = weeklyMax > 0 ? Math.round((assignedSlots.length / weeklyMax) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Teacher Selector & Summary Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            {activeTeacher ? activeTeacher.name.charAt(0) : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="teacher-select" className="text-xs font-bold text-slate-400">
                Teacher:
              </label>
              <select
                id="teacher-select"
                value={activeTeacher?.id}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subjects})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specialization: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTeacher?.subjects}</span>
            </p>
          </div>
        </div>

        {/* Quick Workload Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400">Assigned: </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {assignedSlots.length} / {weeklyMax} periods
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400">Daily Cap: </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {activeTeacher?.max_periods_per_day} per day
            </span>
          </div>

          {activeTeacher?.off_days && (
            <div className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-bold">
              Off: {activeTeacher.off_days}
            </div>
          )}

          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                loadPercentage > 90 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(loadPercentage, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{loadPercentage}%</span>
        </div>
      </div>

      {/* Teacher Schedule Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Teaching Timetable · {activeTeacher?.name}
            </h4>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Timetable</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                <th className="p-3 font-bold w-24 text-center border-r border-slate-200 dark:border-slate-800">
                  Day
                </th>
                {periodHeaders.map((hdr) => (
                  <th
                    key={hdr.period}
                    className="p-3 font-bold text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-w-[110px]"
                  >
                    <div className="text-slate-900 dark:text-white">{hdr.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{hdr.time}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {DAYS_OF_WEEK.map((day) => {
                const isOffDay = activeTeacher?.off_days
                  ? activeTeacher.off_days.toLowerCase().includes(day.substring(0, 3).toLowerCase()) ||
                    activeTeacher.off_days.toLowerCase().includes(day.toLowerCase())
                  : false;

                return (
                  <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-white bg-slate-50/60 dark:bg-slate-800/40 text-center border-r border-slate-200 dark:border-slate-800">
                      {day}
                      {isOffDay && (
                        <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">
                          Off Day
                        </div>
                      )}
                    </td>

                    {periodHeaders.map((hdr) => {
                      const slot = timetableSlots.find(
                        (s) => s.teacherId === activeTeacher?.id && s.day === day && s.periodIndex === hdr.period
                      );
                      const cls = slot ? classesSections.find((c) => c.id === slot.classId) : null;

                      return (
                        <td
                          key={hdr.period}
                          className="p-2 align-top border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                        >
                          {slot ? (
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100 space-y-1">
                              <div className="flex items-center justify-between font-bold text-xs">
                                <span>{slot.subjectName}</span>
                                {slot.isDoublePeriod && (
                                  <span className="text-[9px] px-1 rounded bg-amber-500 text-white font-bold">
                                    2P
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold">
                                {cls ? cls.name : 'Class'}
                              </div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">
                                📍 {slot.room || cls?.room || 'Room'}
                              </div>
                            </div>
                          ) : (
                            <div className="h-14 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-dashed border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              Free Period
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
