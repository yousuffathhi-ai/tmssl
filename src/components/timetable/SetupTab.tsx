import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Building2,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Coffee,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const SetupTab: React.FC = () => {
  const {
    bellSchedule,
    saveBellSchedule,
    classesSections,
    addClassSection,
    deleteClassSection,
    teachersList,
    addTeacherRecord,
    deleteTeacherRecord,
    subjectRules,
    addSubjectRule,
    deleteSubjectRule,
  } = useApp();

  // Bell Schedule Form State
  const [bellForm, setBellForm] = useState({
    first_period_start: bellSchedule.first_period_start || '07:45',
    period_length_mins: bellSchedule.period_length_mins || 40,
    periods_per_day: bellSchedule.periods_per_day || 8,
    breaks_after_periods: bellSchedule.breaks_after_periods || 3,
    break_duration_mins: bellSchedule.break_duration_mins || 20,
  });
  const [bellSavedToast, setBellSavedToast] = useState(false);

  // Classes Form State
  const [classNameInput, setClassNameInput] = useState('');
  const [classRoomInput, setClassRoomInput] = useState('');
  const [classError, setClassError] = useState('');

  // Teachers Form State
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [teacherSubjectsInput, setTeacherSubjectsInput] = useState('');
  const [teacherMaxPeriods, setTeacherMaxPeriods] = useState(6);
  const [teacherOffDays, setTeacherOffDays] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Subject Rules Form State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [ruleSubjectInput, setRuleSubjectInput] = useState('');
  const [rulePeriodsPerWeek, setRulePeriodsPerWeek] = useState(5);
  const [ruleNeedsDouble, setRuleNeedsDouble] = useState(false);
  const [ruleError, setRuleError] = useState('');

  // Compute Dynamic Preview Chips for Bell Schedule
  const previewChips = useMemo(() => {
    const chips: { type: 'period' | 'break'; label: string; time: string; periodNum?: number }[] = [];
    const [startH, startM] = bellForm.first_period_start.split(':').map(Number);
    let currentMinutes = (isNaN(startH) ? 7 : startH) * 60 + (isNaN(startM) ? 45 : startM);

    const formatTime = (totalMins: number) => {
      const h24 = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const count = Number(bellForm.periods_per_day) || 8;
    const pLength = Number(bellForm.period_length_mins) || 40;
    const breakAfter = Number(bellForm.breaks_after_periods) || 3;
    const bLength = Number(bellForm.break_duration_mins) || 20;

    for (let p = 1; p <= count; p++) {
      const pStart = currentMinutes;
      const pEnd = pStart + pLength;
      chips.push({
        type: 'period',
        label: `P${p}`,
        time: `${formatTime(pStart)} - ${formatTime(pEnd)}`,
        periodNum: p,
      });
      currentMinutes = pEnd;

      if (p === breakAfter) {
        const bStart = currentMinutes;
        const bEnd = bStart + bLength;
        chips.push({
          type: 'break',
          label: 'Interval Break',
          time: `${formatTime(bStart)} - ${formatTime(bEnd)}`,
        });
        currentMinutes = bEnd;
      }
    }

    return chips;
  }, [bellForm]);

  const handleSaveBellSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    saveBellSchedule(bellForm);
    setBellSavedToast(true);
    setTimeout(() => setBellSavedToast(false), 2500);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    if (!classNameInput.trim()) {
      setClassError('Please enter a class name.');
      return;
    }
    addClassSection(classNameInput, classRoomInput || 'Standard Room');
    setClassNameInput('');
    setClassRoomInput('');
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    if (!teacherNameInput.trim()) {
      setTeacherError('Please enter teacher name.');
      return;
    }
    addTeacherRecord(
      teacherNameInput,
      teacherSubjectsInput || 'General Education',
      Number(teacherMaxPeriods) || 6,
      teacherOffDays
    );
    setTeacherNameInput('');
    setTeacherSubjectsInput('');
    setTeacherMaxPeriods(6);
    setTeacherOffDays('');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError('');
    if (!selectedClassId) {
      setRuleError('Please select a class.');
      return;
    }
    if (!selectedTeacherId) {
      setRuleError('Please select a teacher.');
      return;
    }
    if (!ruleSubjectInput.trim()) {
      setRuleError('Please enter subject name.');
      return;
    }
    addSubjectRule(
      selectedClassId,
      selectedTeacherId,
      ruleSubjectInput,
      Number(rulePeriodsPerWeek) || 5,
      ruleNeedsDouble
    );
    setRuleSubjectInput('');
    setRulePeriodsPerWeek(5);
    setRuleNeedsDouble(false);
  };

  const daysQuickOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Timetable Setup & Constraints (Supabase Linked)
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Configure your bell periods, class sections, teaching staff, and weekly allocation rules. Fresh accounts start with clean state.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
            {classesSections.length} Classes
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
            {teachersList.length} Teachers
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
            {subjectRules.length} Rules
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* =======================================================================
            CARD A: BELL SCHEDULE CARD
           ======================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">A. Bell Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Define daily periods and interval times</p>
              </div>
            </div>
            {bellSavedToast && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBellSchedule} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Starts At
                </label>
                <input
                  type="time"
                  value={bellForm.first_period_start}
                  onChange={(e) => setBellForm({ ...bellForm, first_period_start: e.target.value })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Length (mins)
                </label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  value={bellForm.period_length_mins}
                  onChange={(e) => setBellForm({ ...bellForm, period_length_mins: parseInt(e.target.value, 10) || 40 })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Periods / Day
                </label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={bellForm.periods_per_day}
                  onChange={(e) => setBellForm({ ...bellForm, periods_per_day: parseInt(e.target.value, 10) || 8 })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Break After P#
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={bellForm.breaks_after_periods}
                  onChange={(e) => setBellForm({ ...bellForm, breaks_after_periods: parseInt(e.target.value, 10) || 3 })}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Dynamic Preview Chips Horizontal Scrolling */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Live Dynamic Bell Timeline
                </span>
                <button
                  type="submit"
                  className="text-xs px-3 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-xs"
                >
                  Save Schedule
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {previewChips.map((chip, idx) => (
                  <div
                    key={idx}
                    className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      chip.type === 'break'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {chip.type === 'break' ? (
                      <>
                        <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="font-bold">{chip.label}</span>
                        <span className="text-[10px] opacity-75">({chip.time})</span>
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                          {chip.periodNum}
                        </span>
                        <span className="font-semibold">{chip.label}</span>
                        <span className="text-[10px] opacity-75">· {chip.time}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* =======================================================================
            CARD B: CLASSES & SECTIONS CARD
           ======================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">B. Classes & Sections</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Grades, divisions, and designated classrooms</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {classesSections.length} Total
            </span>
          </div>

          {/* Add Input Form */}
          <form onSubmit={handleAddClass} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Grade & Name (e.g. Grade 1 A, Grade 6 - A)"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Room # (e.g. Room 1)"
                value={classRoomInput}
                onChange={(e) => setClassRoomInput(e.target.value)}
                className="w-28 sm:w-36 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {classError && <p className="text-xs text-red-500">{classError}</p>}
          </form>

          {/* Added Items Pill List */}
          <div className="space-y-1.5 min-h-[110px] max-h-[180px] overflow-y-auto pr-1">
            {classesSections.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <Building2 className="w-6 h-6 mb-1 opacity-40" />
                <p className="text-xs">No classes added yet. Enter a grade and room above.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classesSections.map((cls) => (
                  <div
                    key={cls.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 hover:border-slate-300 transition"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{cls.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 dark:text-slate-400">{cls.room}</span>
                    <button
                      onClick={() => deleteClassSection(cls.id)}
                      title="Delete class"
                      className="ml-1 text-slate-400 hover:text-red-600 transition p-0.5 rounded-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================
            CARD C: TEACHERS CARD
           ======================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">C. Teachers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Faculty roster, subject competencies & off days</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {teachersList.length} Total
            </span>
          </div>

          {/* Add Teacher Form */}
          <form onSubmit={handleAddTeacher} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Teacher Name (e.g. Mrs. K. Jayawardena)"
                value={teacherNameInput}
                onChange={(e) => setTeacherNameInput(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Subjects (e.g. Science, Maths)"
                value={teacherSubjectsInput}
                onChange={(e) => setTeacherSubjectsInput(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Max/day:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={teacherMaxPeriods}
                  onChange={(e) => setTeacherMaxPeriods(parseInt(e.target.value, 10) || 6)}
                  className="w-16 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 flex items-center gap-1.5 min-w-[150px]">
                <span className="text-xs text-slate-500 font-medium shrink-0">Off days:</span>
                <div className="flex items-center gap-1">
                  {daysQuickOptions.map((day) => {
                    const isSelected = teacherOffDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          let current = teacherOffDays ? teacherOffDays.split(',').map(s => s.trim()).filter(Boolean) : [];
                          if (isSelected) {
                            current = current.filter(d => d !== day);
                          } else {
                            current.push(day);
                          }
                          setTeacherOffDays(current.join(', '));
                        }}
                        className={`text-[10px] px-2 py-1 rounded font-semibold transition ${
                          isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Teacher</span>
              </button>
            </div>
            {teacherError && <p className="text-xs text-red-500">{teacherError}</p>}
          </form>

          {/* Added Teachers Blue Pill List */}
          <div className="space-y-2 min-h-[110px] max-h-[180px] overflow-y-auto pr-1">
            {teachersList.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <Users className="w-6 h-6 mb-1 opacity-40" />
                <p className="text-xs">No teachers added yet. Register faculty members above.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {teachersList.map((tch) => (
                  <div
                    key={tch.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-950 dark:text-blue-200">{tch.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{tch.subjects}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-400">{tch.max_periods_per_day}/day</span>
                      {tch.off_days && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                          Off: {tch.off_days}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTeacherRecord(tch.id)}
                      title="Remove teacher"
                      className="text-slate-400 hover:text-red-600 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================
            CARD D: SUBJECT RULES & CONSTRAINTS CARD
           ======================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">D. Subject Rules & Constraints</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Curriculum allocations, period loads & double periods</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {subjectRules.length} Total
            </span>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Class --</option>
                {classesSections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.room})
                  </option>
                ))}
              </select>

              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Teacher --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subjects})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input
                type="text"
                placeholder="Subject (e.g. Science)"
                value={ruleSubjectInput}
                onChange={(e) => setRuleSubjectInput(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Periods/week:</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={rulePeriodsPerWeek}
                  onChange={(e) => setRulePeriodsPerWeek(parseInt(e.target.value, 10) || 5)}
                  className="w-16 text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleNeedsDouble}
                    onChange={(e) => setRuleNeedsDouble(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Needs double period</span>
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </div>
            {ruleError && <p className="text-xs text-red-500">{ruleError}</p>}
          </form>

          {/* Added Rules List */}
          <div className="space-y-1.5 min-h-[110px] max-h-[180px] overflow-y-auto pr-1">
            {subjectRules.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <BookOpen className="w-6 h-6 mb-1 opacity-40" />
                <p className="text-xs">No subject rules defined yet. Assign classes and teachers above.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjectRules.map((rule) => {
                  const cls = classesSections.find((c) => c.id === rule.class_id);
                  const tch = teachersList.find((t) => t.id === rule.teacher_id);
                  return (
                    <div
                      key={rule.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-950 dark:text-emerald-200"
                    >
                      <span className="font-bold">{cls ? cls.name : 'Class'}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">{rule.subject}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-400">{tch ? tch.name.split(' ')[0] : 'Teacher'}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-400">{rule.periods_per_week}/week</span>
                      {rule.needs_double_period && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          <Zap className="w-2.5 h-2.5" /> Double
                        </span>
                      )}
                      <button
                        onClick={() => deleteSubjectRule(rule.id)}
                        title="Delete rule"
                        className="ml-1 text-slate-400 hover:text-red-600 transition p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
