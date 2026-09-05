import React from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_OF_WEEK, SRI_LANKAN_PERIODS, SRI_LANKA_HOLIDAYS, SCHOOL_TERM_DATES } from '../../data/sriLankaEduData';
import { DayOfWeek } from '../../types';
import {
  GraduationCap,
  CalendarDays,
  Sparkles,
  Award,
  CalendarCheck,
  Users2,
  Clock,
  ChevronRight,
  PlusCircle,
  AlertTriangle,
  FileCheck,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    classes,
    teachers,
    lessonPlans,
    timetableSlots,
    substitutions,
    leaveBalance,
    leaves,
    students,
  } = useApp();

  // Determine current day of week in Sri Lanka
  const todayDate = new Date();
  const dayIndex = todayDate.getDay(); // 0 is Sun, 1 is Mon...
  const dayNames: DayOfWeek[] = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Friday'];
  const todaySriLankanDay: DayOfWeek = dayNames[dayIndex] || 'Monday';

  // Today's timetable slots for user's assigned class or teacher
  const todaySlots = timetableSlots.filter(s => s.day === todaySriLankanDay);

  // Filter slots for current user if teacher
  const mySlotsToday = currentUser?.role === 'teacher'
    ? todaySlots.filter(s => s.teacherId === currentUser.id || s.subjectName.toLowerCase().includes(currentUser.subjectHandling[0]?.toLowerCase() || ''))
    : todaySlots;

  // Pending leaves requiring principal approval
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-3">
              <span>🇱🇰 Sri Lanka School Education System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ayubowan / Vanakkam, {currentUser?.name}!
            </h1>
            <p className="mt-1 text-sm text-blue-200/90 font-medium">
              {currentUser?.schoolName ? `${currentUser.schoolName} • ` : ''}Staff ID: <span className="font-mono text-amber-300">{currentUser?.staffId || 'SLTS Member'}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-300">
              Assigned: <strong>{currentUser?.assignedClass}</strong> | Subjects:{' '}
              {currentUser?.subjectHandling.join(', ')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('lesson-plan')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Lesson Plan</span>
            </button>
            <button
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/20 transition flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Timetable Maker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Admin Actions Banner */}
      {currentUser?.role === 'admin' && pendingLeaves.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-200">
                {pendingLeaves.length} Staff Leave Request{pendingLeaves.length > 1 ? 's' : ''} Pending Principal Approval
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-400">
                Review teacher leave applications and confirm substitute timetable assignments.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('leaves')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Card */}
        <div
          onClick={() => onNavigate('timetable')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Classes & Grades</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 group-hover:scale-110 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {classes.length > 0 ? classes.length : <span className="text-sm font-medium text-slate-400">0 Classes</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {classes.length > 0 ? `${students.length} Enrolled Students` : 'Click to add first class'}
          </p>
        </div>

        {/* Teachers Card */}
        <div
          onClick={() => onNavigate('timetable')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">School Staff</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 group-hover:scale-110 transition">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {teachers.length > 0 ? teachers.length : <span className="text-sm font-medium text-slate-400">0 Staff</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {teachers.length > 0 ? 'Workload balanced' : 'Add teachers in wizard'}
          </p>
        </div>

        {/* AI Lesson Plans Card */}
        <div
          onClick={() => onNavigate('lesson-plan')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lesson Plans</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {lessonPlans.length > 0 ? lessonPlans.length : <span className="text-sm font-medium text-slate-400">0 Plans</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            NIE Sri Lanka Curriculum
          </p>
        </div>

        {/* Leave Balance Card */}
        <div
          onClick={() => onNavigate('leaves')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Leave Balance</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{leaveBalance.casualTotal - leaveBalance.casualUsed}</span>
            <span className="text-xs font-semibold text-slate-400">/ 20 Casual left</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {leaveBalance.restTotal - leaveBalance.restUsed} Rest / Medical days
          </p>
        </div>
      </div>

      {/* Main Content Grid: Today's Schedule + Sri Lanka Academic Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's 8-Period Timetable & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Today's Schedule ({todaySriLankanDay})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    8-Period Sri Lankan School Day Structure
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {timetableSlots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center space-y-3">
                <CalendarDays className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No School Timetable Generated Yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Set up your classes and subject allocations to auto-generate the 8-period school timetable.
                </p>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Launch Timetable Setup</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Morning Assembly Notice */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span className="font-bold text-amber-600 dark:text-amber-400">07:30 - 07:50 AM</span>
                  <span>Morning Assembly & National Anthem / Religious Observances</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">Assembly</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SRI_LANKAN_PERIODS.map(period => {
                    const slot = todaySlots.find(s => s.periodIndex === period.periodIndex);
                    const isIntervalAfter = period.periodIndex === 4;

                    return (
                      <React.Fragment key={period.periodIndex}>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {period.label} • {period.startTime} - {period.endTime}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                              {slot ? slot.subjectName : 'Free Period / Unassigned'}
                            </p>
                          </div>
                          {slot && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {classes.find(c => c.id === slot.classId)?.name || 'Class'}
                            </span>
                          )}
                        </div>

                        {/* School Interval Banner after period 4 */}
                        {isIntervalAfter && (
                          <div className="sm:col-span-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            🍱 10:30 AM - 10:50 AM : SCHOOL INTERVAL (MEALS & REST)
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Module Navigation Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Marks Analyser', desc: 'Term 1-3 Grades', icon: Award, tab: 'marks', color: 'from-purple-600 to-indigo-600' },
              { label: 'AI Lesson Plan', desc: 'NIE Curriculum', icon: Sparkles, tab: 'lesson-plan', color: 'from-amber-600 to-orange-600' },
              { label: 'Apply Leave', desc: 'Casual/Rest/Duty', icon: CalendarCheck, tab: 'leaves', color: 'from-emerald-600 to-teal-600' },
              { label: 'Community Hub', desc: 'Past Papers & Ideas', icon: Users2, tab: 'community', color: 'from-blue-600 to-cyan-600' },
            ].map(shortcut => {
              const Icon = shortcut.icon;
              return (
                <button
                  key={shortcut.tab}
                  onClick={() => onNavigate(shortcut.tab)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 text-left transition group"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${shortcut.color} text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-110 transition`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {shortcut.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {shortcut.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Sri Lanka Academic Calendar & Terms */}
        <div className="space-y-6">
          {/* Term Dates Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  2026 Academic Terms
                </h3>
                <p className="text-[11px] text-slate-500">Ministry of Education Sri Lanka</p>
              </div>
            </div>

            <div className="space-y-3">
              {SCHOOL_TERM_DATES.map((term, i) => (
                <div
                  key={term.term}
                  className={`p-3 rounded-2xl border ${
                    i === 0
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {term.term}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        Active Term
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Duration: {term.start} to {term.end}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Term Exams: {term.exams}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Sri Lankan School Holidays */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Upcoming Holidays & Poya Days
            </h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {SRI_LANKA_HOLIDAYS.slice(0, 6).map((holiday, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {holiday.name}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">{holiday.date}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {holiday.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
