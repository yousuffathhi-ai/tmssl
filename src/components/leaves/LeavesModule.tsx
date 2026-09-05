import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SRI_LANKA_HOLIDAYS, DAYS_OF_WEEK } from '../../data/sriLankaEduData';
import { LeaveRecord, LeaveType } from '../../types';
import { EmptyState } from '../common/EmptyState';
import {
  CalendarCheck,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const LeavesModule: React.FC = () => {
  const { currentUser, leaves, leaveBalance, applyLeave, updateLeaveStatus, teachers, timetableSlots } = useApp();

  const [activeTab, setActiveTab] = useState<'myLeaves' | 'approvals' | 'calendar'>('myLeaves');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form Fields
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [numberOfDays, setNumberOfDays] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');

  // Review modal state
  const [reviewNote, setReviewNote] = useState('');

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const substitute = teachers.find(t => t.id === substituteTeacherId);

    applyLeave({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      leaveType,
      startDate,
      endDate,
      numberOfDays: Number(numberOfDays),
      reason: reason || 'Personal / Medical obligation',
      nominatedSubstituteId: substitute?.id,
      nominatedSubstituteName: substitute?.name,
    });

    setShowApplyModal(false);
    setReason('');
    alert('Leave application submitted for Principal approval!');
  };

  const myLeaves = leaves.filter(l => l.teacherId === currentUser?.id || l.teacherName === currentUser?.name);
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  // Calculate timetable period impact for a leave date
  const calculatePeriodsImpact = (teacherId: string, dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      const dayIdx = dateObj.getDay();
      const dayNames = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Friday'];
      const day = dayNames[dayIdx] || 'Monday';
      const periodsToday = timetableSlots.filter(s => s.day === day && s.teacherId === teacherId);
      return periodsToday.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <span>Teacher Leaves & Attendance Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sri Lankan Education Department Regulations: 20 Casual Days & 21 Rest Days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('myLeaves')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'myLeaves'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              My Leaves ({myLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Approvals Desk</span>
              {pendingLeaves.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              School Leave Calendar
            </button>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Sri Lanka Quota Balance Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Casual Leaves */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Casual Leaves (SL Regulations)</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {leaveBalance.casualTotal - leaveBalance.casualUsed} Days Left
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {leaveBalance.casualUsed} <span className="text-xs font-medium text-slate-400">/ 20 Days Used</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${(leaveBalance.casualUsed / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Rest / Medical Leaves */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Rest / Medical Leaves</span>
            <span className="text-blue-600 dark:text-blue-400">
              {leaveBalance.restTotal - leaveBalance.restUsed} Days Left
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {leaveBalance.restUsed} <span className="text-xs font-medium text-slate-400">/ 21 Days Used</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${(leaveBalance.restUsed / 21) * 100}%` }}
            />
          </div>
        </div>

        {/* Duty Leaves */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Duty Leaves</span>
            <span className="text-purple-600 dark:text-purple-400">Official Duties</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {leaveBalance.dutyUsed} <span className="text-xs font-medium text-slate-400">Days Utilized</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Examinations, evaluation boards, sports supervision
          </p>
        </div>
      </div>

      {/* ================= TAB 1: MY LEAVES ================= */}
      {activeTab === 'myLeaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Leave Application History ({myLeaves.length})
            </h3>
          </div>

          {myLeaves.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No Leaves Recorded"
              description="You have not submitted any leave applications yet. All official leave requests and approvals are tracked here."
              actionLabel="Apply for Leave"
              onAction={() => setShowApplyModal(true)}
            />
          ) : (
            <div className="space-y-3">
              {myLeaves.map(leave => (
                <div
                  key={leave.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {leave.leaveType} Leave ({leave.numberOfDays} Day{leave.numberOfDays > 1 ? 's' : ''})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : leave.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Period: {leave.startDate} {leave.startDate !== leave.endDate ? `to ${leave.endDate}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 italic mt-0.5">
                      Reason: "{leave.reason}"
                    </p>
                    {leave.nominatedSubstituteName && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                        Nominated Relief Teacher: {leave.nominatedSubstituteName}
                      </p>
                    )}
                    {leave.reviewNote && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-1">
                        Principal Note: {leave.reviewNote}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 sm:text-right shrink-0">
                    Applied on: {new Date(leave.appliedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PRINCIPAL APPROVAL DESK ================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Principal & Sectional Head Leave Approval Desk
              </h3>
              <p className="text-xs text-slate-500">
                Review staff leave submissions with automated timetable collision & relief period impact.
              </p>
            </div>
          </div>

          {leaves.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Leave Submissions"
              description="No teachers have submitted leave applications yet. Submissions requiring approval will show up here."
            />
          ) : (
            <div className="space-y-3">
              {leaves.map(leave => {
                const affectedPeriods = calculatePeriodsImpact(leave.teacherId, leave.startDate);

                return (
                  <div
                    key={leave.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {leave.teacherName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">({leave.leaveType})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : leave.status === 'Rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {leave.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Dates: {leave.startDate} to {leave.endDate} ({leave.numberOfDays} Day{leave.numberOfDays > 1 ? 's' : ''})
                      </p>
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        Reason: "{leave.reason}"
                      </p>

                      {/* Timetable Impact Indicator */}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Timetable Impact: {affectedPeriods} teaching periods scheduled on this day</span>
                      </div>

                      {leave.nominatedSubstituteName && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Nominated Relief: <strong>{leave.nominatedSubstituteName}</strong>
                        </p>
                      )}
                    </div>

                    {leave.status === 'Pending' ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateLeaveStatus(leave.id, 'Approved', 'Leave sanctioned with relief coverage')}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => updateLeaveStatus(leave.id, 'Rejected', 'Excessive workload/critical exam duty')}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-red-300 hover:bg-red-50 text-red-600 text-xs font-bold transition"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-500">
                        Processed by: {leave.reviewedBy || 'Principal'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: LEAVE CALENDAR ================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Sri Lankan School Calendar & Approved Leaves (2026)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              National Holidays, Full Moon Poya Days, and Scheduled School Staff Absences.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {SRI_LANKA_HOLIDAYS.map((holiday, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {holiday.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{holiday.date}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {holiday.type}
                  </span>
                </div>
              ))}

              {/* Show Approved Leaves */}
              {leaves
                .filter(l => l.status === 'Approved')
                .map(l => (
                  <div
                    key={l.id}
                    className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-950 dark:text-emerald-200">
                          Teacher Leave: {l.teacherName} ({l.leaveType})
                        </p>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {l.startDate} to {l.endDate}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Sanctioned
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: APPLY FOR LEAVE ================= */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Official Teacher Leave Application
            </h3>
            <form onSubmit={handleApplySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Leave Classification
                </label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Casual">Casual Leave (20 days quota)</option>
                  <option value="Rest / Medical">Rest / Medical Leave (21 days quota)</option>
                  <option value="Duty">Duty Leave (School Board / Official)</option>
                  <option value="Special">Special Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commencing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Concluding Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Working Days Required
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={numberOfDays}
                  onChange={e => setNumberOfDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Absence
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Medical appointment / family commitment"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominated Substitute / Relief Teacher (Optional)
                </label>
                <select
                  value={substituteTeacherId}
                  onChange={e => setSubstituteTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">-- None / Assigned by Office --</option>
                  {teachers
                    .filter(t => t.id !== currentUser?.id)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subjects.join(', ')})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
