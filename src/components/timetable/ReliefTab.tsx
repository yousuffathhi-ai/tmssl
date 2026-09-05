import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_OF_WEEK } from '../../data/sriLankaEduData';
import {
  UserMinus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Calendar,
  Building,
  UserCheck,
  Zap,
} from 'lucide-react';

export const ReliefTab: React.FC = () => {
  const {
    currentUser,
    schoolSettings,
    teachersList,
    classesSections,
    timetableSlots,
    bellSchedule,
    substitutions,
    addSubstitution,
    deleteSubstitution,
  } = useApp();

  const dynamicSchool = currentUser?.schoolName?.trim() || schoolSettings.school_name?.trim() || '';

  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedAbsentTeacherId, setSelectedAbsentTeacherId] = useState<string>('');
  const [reliefAssignedToast, setReliefAssignedToast] = useState<string | null>(null);

  // Find all classes scheduled for the absent teacher on this day
  const impactedSlots = useMemo(() => {
    if (!selectedAbsentTeacherId) return [];
    return timetableSlots
      .filter((s) => s.teacherId === selectedAbsentTeacherId && s.day === selectedDay)
      .sort((a, b) => a.periodIndex - b.periodIndex);
  }, [timetableSlots, selectedAbsentTeacherId, selectedDay]);

  // For each period, find teachers who are FREE (have NO slot scheduled in that period & day)
  const getFreeTeachersForPeriod = (periodIndex: number) => {
    const busyTeacherIds = new Set(
      timetableSlots
        .filter((s) => s.day === selectedDay && s.periodIndex === periodIndex)
        .map((s) => s.teacherId)
    );

    return teachersList.filter((t) => {
      // Not the absent teacher
      if (t.id === selectedAbsentTeacherId) return false;
      // Not already busy in this period
      if (busyTeacherIds.has(t.id)) return false;
      // Not on off-day
      const offDaysText = (t.off_days || '').toLowerCase();
      if (
        offDaysText.includes(selectedDay.substring(0, 3).toLowerCase()) ||
        offDaysText.includes(selectedDay.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const handleAssignRelief = (
    slot: import('../../types').TimetableSlot,
    substituteTeacherId: string
  ) => {
    const absentTeacher = teachersList.find((t) => t.id === selectedAbsentTeacherId);
    const substituteTeacher = teachersList.find((t) => t.id === substituteTeacherId);
    const cls = classesSections.find((c) => c.id === slot.classId);

    if (!substituteTeacher) return;

    addSubstitution({
      date: new Date().toISOString().split('T')[0],
      day: selectedDay as any,
      periodIndex: slot.periodIndex,
      absentTeacherId: selectedAbsentTeacherId,
      absentTeacherName: absentTeacher?.name || 'Absent Teacher',
      classId: slot.classId,
      className: cls?.name || 'Class',
      originalSubject: slot.subjectName,
      substituteTeacherId,
      substituteTeacherName: substituteTeacher.name,
      status: 'Assigned',
    });

    setReliefAssignedToast(
      `Assigned ${substituteTeacher.name} for Period ${slot.periodIndex} (${slot.subjectName})`
    );
    setTimeout(() => setReliefAssignedToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
              Daily Relief & Substitution Solver
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Select an absent faculty member to instantly detect affected classes and match free available teachers with subject alignment.
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition shrink-0 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Relief Slip</span>
        </button>
      </div>

      {/* Control Bar: Day & Absent Teacher Selectors */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            1. Select Day of the Week:
          </label>
          <div className="flex items-center gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition ${
                  selectedDay === day
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            2. Select Absent Teacher:
          </label>
          <select
            value={selectedAbsentTeacherId}
            onChange={(e) => setSelectedAbsentTeacherId(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Choose Absent Faculty Member --</option>
            {teachersList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subjects})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toast Notice */}
      {reliefAssignedToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reliefAssignedToast}</span>
        </div>
      )}

      {/* Affected Classes & Matching Relief Solver */}
      {!selectedAbsentTeacherId ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
          <UserMinus className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Absent Teacher Selected
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose a teacher who is absent today from the dropdown above to view affected periods and assign free substitute teachers.
          </p>
        </div>
      ) : impactedSlots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            No Classes Scheduled on {selectedDay}
          </h4>
          <p className="text-xs text-slate-500">
            This teacher has no teaching periods on {selectedDay} (or it is their scheduled off-day). No relief required!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Impacted Periods on {selectedDay}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {impactedSlots.length} Classes Require Coverage
              </span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {impactedSlots.map((slot) => {
              const cls = classesSections.find((c) => c.id === slot.classId);
              const freeTeachers = getFreeTeachersForPeriod(slot.periodIndex);
              const existingSub = substitutions.find(
                (s) =>
                  s.day === selectedDay &&
                  s.periodIndex === slot.periodIndex &&
                  s.absentTeacherId === selectedAbsentTeacherId &&
                  s.classId === slot.classId
              );

              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border p-4 space-y-3 transition ${
                    existingSub
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                          P{slot.periodIndex}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cls ? cls.name : 'Class'} · {slot.subjectName}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Room: {slot.room || cls?.room || 'Main Room'}
                        {slot.isDoublePeriod && ' · (Double Period Part)'}
                      </p>
                    </div>

                    {existingSub ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Covered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        Needs Relief
                      </span>
                    )}
                  </div>

                  {/* Existing Assignment Box */}
                  {existingSub ? (
                    <div className="p-2.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Relief Teacher: </span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                          {existingSub.substituteTeacherName}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSubstitution(existingSub.id)}
                        className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    /* Free Teachers Candidates Dropdown */
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Free Available Teachers ({freeTeachers.length}):
                        </span>
                      </div>

                      {freeTeachers.length === 0 ? (
                        <p className="text-xs text-red-500 font-medium">
                          No free teachers available in this period. Consider combining classes.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {freeTeachers.map((candidate) => {
                            const isSubjectMatch = candidate.subjects
                              .toLowerCase()
                              .includes(slot.subjectName.toLowerCase());

                            return (
                              <div
                                key={candidate.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 text-xs transition"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{candidate.name}</span>
                                    {isSubjectMatch && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold">
                                        Subject Match
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Specialty: {candidate.subjects}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleAssignRelief(slot, candidate.id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
                                >
                                  Assign
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Printable Relief Summary Sheet Component (Visible on print or at bottom) */}
      {substitutions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Relief Schedule Table ({substitutions.length})
              </h4>
              <p className="text-xs text-slate-500">
                {dynamicSchool ? `School: ${dynamicSchool} · ` : ''}Date: {new Date().toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <th className="p-2 font-bold">Period</th>
                  <th className="p-2 font-bold">Class</th>
                  <th className="p-2 font-bold">Subject</th>
                  <th className="p-2 font-bold">Absent Teacher</th>
                  <th className="p-2 font-bold">Assigned Relief Teacher</th>
                  <th className="p-2 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {substitutions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-blue-600">Period {sub.periodIndex}</td>
                    <td className="p-2 font-semibold">{sub.className}</td>
                    <td className="p-2">{sub.originalSubject}</td>
                    <td className="p-2 text-red-600 dark:text-red-400 font-medium">{sub.absentTeacherName}</td>
                    <td className="p-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      {sub.substituteTeacherName}
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
