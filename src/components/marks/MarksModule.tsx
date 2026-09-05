import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSriLankanGrade, getGradeColorClass, SRI_LANKA_CURRICULUM_SUBJECTS } from '../../data/sriLankaEduData';
import { Student, MarkRecord } from '../../types';
import { EmptyState } from '../common/EmptyState';
import {
  Award,
  Plus,
  Trash2,
  Printer,
  BarChart3,
  Users,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const MarksModule: React.FC = () => {
  const { currentUser, classes, students, addStudent, deleteStudent, markRecords, saveMarkRecord } = useApp();

  const [activeTab, setActiveTab] = useState<'grid' | 'analytics' | 'reportCard' | 'students'>('grid');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);

  // Selected student for Report Card
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string>('');

  // Add Student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentIndex, setNewStudentIndex] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Male');

  // Working spreadsheet marks state: { [studentId]: { [subject]: score } }
  const [marksState, setMarksState] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    markRecords.forEach(mr => {
      if (mr.term === selectedTerm) {
        initial[mr.studentId] = { ...(initial[mr.studentId] || {}), ...mr.subjects };
      }
    });
    return initial;
  });

  // Subjects for the selected class
  const defaultSubjects = ['Mathematics', 'Science', 'English Language', 'Sinhala / Tamil (1st Lang)', 'History', 'ICT'];

  // Current class students
  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Handle Mark Change
  const handleScoreChange = (studentId: string, subject: string, val: string) => {
    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: num,
      },
    }));
  };

  // Compute student results & ranks
  const computedResults = classStudents.map(student => {
    const studentMarks = marksState[student.id] || {};
    const scores = (Object.values(studentMarks) as number[]);
    const totalMarks = scores.reduce((sum: number, s: number) => sum + s, 0);
    const average = scores.length > 0 ? parseFloat((totalMarks / scores.length).toFixed(1)) : 0;

    const gradeCounts = { A: 0, B: 0, C: 0, S: 0, F: 0 };
    scores.forEach((s: number) => {
      const g = calculateSriLankanGrade(s);
      gradeCounts[g]++;
    });

    return {
      student,
      subjects: studentMarks,
      totalMarks,
      average,
      gradeCounts,
    };
  });

  // Assign class ranks (descending order of total marks)
  computedResults.sort((a, b) => b.totalMarks - a.totalMarks);
  const rankedResults = computedResults.map((res, idx) => ({
    ...res,
    rank: res.totalMarks > 0 ? idx + 1 : 0,
  }));

  // Save all mark records for this term
  const handleSaveAllMarks = () => {
    rankedResults.forEach(item => {
      saveMarkRecord({
        studentId: item.student.id,
        classId: selectedClassId,
        term: selectedTerm,
        subjects: item.subjects,
        totalMarks: item.totalMarks,
        average: item.average,
        rank: item.rank,
        gradeSummary: item.gradeCounts,
      });
    });
    alert(`Successfully saved Term ${selectedTerm} marks for ${classStudents.length} student(s).`);
  };

  // Add new student handler
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      alert('Please select or create a class first.');
      return;
    }
    const created = addStudent({
      classId: selectedClassId,
      indexNumber: newStudentIndex || `2026/${new Date().getFullYear()}/${classStudents.length + 1}`,
      name: newStudentName,
      gender: newStudentGender,
    });
    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewStudentIndex('');
    if (!selectedReportStudentId) {
      setSelectedReportStudentId(created.id);
    }
  };

  // Grade Distribution Data for Recharts
  const gradeDistributionData = [
    { grade: 'A (75-100)', count: rankedResults.reduce((acc, r) => acc + r.gradeCounts.A, 0), color: '#16a34a' },
    { grade: 'B (65-74)', count: rankedResults.reduce((acc, r) => acc + r.gradeCounts.B, 0), color: '#2563eb' },
    { grade: 'C (50-64)', count: rankedResults.reduce((acc, r) => acc + r.gradeCounts.C, 0), color: '#d97706' },
    { grade: 'S (35-49)', count: rankedResults.reduce((acc, r) => acc + r.gradeCounts.S, 0), color: '#4f46e5' },
    { grade: 'F (0-34)', count: rankedResults.reduce((acc, r) => acc + r.gradeCounts.F, 0), color: '#dc2626' },
  ];

  // Remedial alerts (students with any marks < 35)
  const remedialStudents = rankedResults.filter(r =>
    Object.values(r.subjects).some((score: any) => Number(score) < 35 && Number(score) > 0)
  );

  const selectedReportStudent = students.find(s => s.id === selectedReportStudentId) || classStudents[0];
  const selectedReportResult = rankedResults.find(r => r.student.id === selectedReportStudent?.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            <span>Student Marks & Academic Performance Analyser</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sri Lankan Ministry Grading Scheme (A, B, C, S, F) • Term 1, 2, 3 Analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Marks Spreadsheet
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Performance Charts
            </button>
            <button
              onClick={() => setActiveTab('reportCard')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'reportCard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Report Card (A4 Print)
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Class Roster ({classStudents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Class and Term Selector Ribbon */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Selected Class:</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              disabled={classes.length === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {classes.length === 0 && <option value="">No Classes Found</option>}
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Academic Term:</span>
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t as 1 | 2 | 3)}
                  className={`px-3 py-1 rounded-md transition ${
                    selectedTerm === t
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Term {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            disabled={classes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
          {classStudents.length > 0 && activeTab === 'grid' && (
            <button
              onClick={handleSaveAllMarks}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Marks</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: SPREADSHEET GRID ================= */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          {classes.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Classes Available"
              description="To record and analyse student marks, please create a class in the Timetable setup first."
            />
          ) : classStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students in this Class"
              description={`Add students to ${classes.find(c => c.id === selectedClassId)?.name || 'this class'} to enter marks for Term ${selectedTerm}.`}
              actionLabel="Add Student to Class"
              onAction={() => setShowAddStudentModal(true)}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-x-auto">
              {/* Grading Legend Banner */}
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-slate-500">Ministry Grading Standard:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    A: 75-100 (Distinction)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    B: 65-74 (Very Good)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    C: 50-64 (Credit)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    S: 35-49 (Simple Pass)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    F: 0-34 (Weak / Remedial)
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="min-w-[800px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px]">
                      <th className="p-3 border-r border-b border-slate-200 dark:border-slate-700 w-16 text-center">
                        Rank
                      </th>
                      <th className="p-3 border-r border-b border-slate-200 dark:border-slate-700 w-32">
                        Index No
                      </th>
                      <th className="p-3 border-r border-b border-slate-200 dark:border-slate-700 w-44">
                        Student Name
                      </th>
                      {defaultSubjects.map(sub => (
                        <th
                          key={sub}
                          className="p-2 border-r border-b border-slate-200 dark:border-slate-700 text-center w-24"
                        >
                          <span className="truncate block" title={sub}>
                            {sub.split(' ')[0]}
                          </span>
                        </th>
                      ))}
                      <th className="p-3 border-r border-b border-slate-200 dark:border-slate-700 text-center w-20">
                        Total
                      </th>
                      <th className="p-3 border-r border-b border-slate-200 dark:border-slate-700 text-center w-20">
                        Avg %
                      </th>
                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center w-28">
                        Grades
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rankedResults.map(res => (
                      <tr key={res.student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-bold">
                          {res.rank > 0 ? (
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-extrabold ${
                                res.rank === 1
                                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                                  : res.rank === 2
                                  ? 'bg-slate-300 text-slate-900'
                                  : res.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {res.rank}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono text-slate-500">
                          {res.student.indexNumber}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white truncate">
                          {res.student.name}
                        </td>
                        {defaultSubjects.map(sub => {
                          const currentScore = res.subjects[sub] !== undefined ? res.subjects[sub] : '';
                          const grade = currentScore !== '' ? calculateSriLankanGrade(Number(currentScore)) : '';

                          return (
                            <td
                              key={sub}
                              className="p-1 border-r border-slate-200 dark:border-slate-800 text-center"
                            >
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={currentScore}
                                  onChange={e => handleScoreChange(res.student.id, sub, e.target.value)}
                                  className={`w-14 text-center py-1 px-1 rounded-lg border font-mono text-xs font-bold outline-none transition ${
                                    grade === 'F'
                                      ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                                  }`}
                                  placeholder="—"
                                />
                                {grade && (
                                  <span
                                    className={`absolute -top-1.5 -right-1 text-[8px] font-black px-1 rounded shadow-xs ${getGradeColorClass(
                                      grade
                                    )}`}
                                  >
                                    {grade}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {res.totalMarks}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-blue-600 dark:text-blue-400">
                          {res.average}%
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                            {res.gradeCounts.A > 0 && <span className="text-emerald-600">{res.gradeCounts.A}A</span>}
                            {res.gradeCounts.B > 0 && <span className="text-blue-600">{res.gradeCounts.B}B</span>}
                            {res.gradeCounts.C > 0 && <span className="text-amber-600">{res.gradeCounts.C}C</span>}
                            {res.gradeCounts.S > 0 && <span className="text-indigo-600">{res.gradeCounts.S}S</span>}
                            {res.gradeCounts.F > 0 && <span className="text-red-600 font-extrabold">{res.gradeCounts.F}F</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PERFORMANCE ANALYTICS (RECHARTS) ================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {classStudents.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Marks to Analyse"
              description="Add students and enter marks to visualize pass rates, grade distributions, and remedial requirements."
            />
          ) : (
            <>
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase">Class Average</span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {rankedResults.length > 0
                      ? (rankedResults.reduce((sum, r) => sum + r.average, 0) / rankedResults.length).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Across all examined subjects</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase">Highest Score</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {rankedResults[0]?.average || 0}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Rank 1: {rankedResults[0]?.student.name || 'N/A'}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase">Overall Pass Rate</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {rankedResults.length > 0
                      ? Math.round(
                          (rankedResults.filter(r => r.average >= 35).length / rankedResults.length) * 100
                        )
                      : 0}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Achieved average ≥ 35%</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase">Remedial Focus</span>
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                    {remedialStudents.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Students with subject score &lt; 35</p>
                </div>
              </div>

              {/* Recharts Grade Breakdown Chart */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Sri Lankan Grade Distribution (A, B, C, S, F)
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Aggregate count of marks classified across all subjects for Term {selectedTerm}.
                </p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="grade" stroke="#888888" fontSize={12} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          color: '#fff',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {gradeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Remedial Assistance Alert List */}
              {remedialStudents.length > 0 && (
                <div className="p-6 rounded-3xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h4 className="font-bold text-sm text-red-950 dark:text-red-200">
                      Students Requiring Targeted Remedial Support
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {remedialStudents.map(r => (
                      <div
                        key={r.student.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 text-xs shadow-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {r.student.name} ({r.student.indexNumber})
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(r.subjects)
                            .filter(([_, score]: [string, any]) => Number(score) < 35 && Number(score) > 0)
                            .map(([sub, score]) => (
                              <span
                                key={sub}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                              >
                                {sub}: {score}/100 (F)
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= TAB 3: OFFICIAL PRINTABLE REPORT CARD (A4) ================= */}
      {activeTab === 'reportCard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Student:</span>
              <select
                value={selectedReportStudentId}
                onChange={e => setSelectedReportStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.indexNumber})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report Card</span>
            </button>
          </div>

          {!selectedReportStudent ? (
            <EmptyState
              icon={Award}
              title="No Student Selected"
              description="Add students to this class to inspect and print their official Ministry-style progress report card."
            />
          ) : (
            /* Printable Official Report Card Document */
            <div className="bg-white text-slate-900 rounded-3xl border border-slate-300 p-8 sm:p-12 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Crest & Header */}
              <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Democratic Socialist Republic of Sri Lanka • Ministry of Education
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 mt-1">
                  {currentUser?.schoolName || 'Sri Lankan National School'}
                </h1>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  STUDENT TERM PROGRESS REPORT • ACADEMIC YEAR 2026
                </p>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Student Name
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm block truncate">
                    {selectedReportStudent.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Admission / Index No
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm block">
                    {selectedReportStudent.indexNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Grade & Section
                  </span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {classes.find(c => c.id === selectedClassId)?.name || 'Class'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Term Evaluated
                  </span>
                  <span className="font-bold text-blue-700 text-sm block">
                    Term {selectedTerm} (2026)
                  </span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center w-24">Marks (100)</th>
                      <th className="p-3 text-center w-28">Grade</th>
                      <th className="p-3">Subject Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {defaultSubjects.map((sub, i) => {
                      const score = selectedReportResult?.subjects[sub] || 0;
                      const grade = calculateSriLankanGrade(score);

                      return (
                        <tr key={sub}>
                          <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{sub}</td>
                          <td className="p-3 text-center font-mono font-bold">{score}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-black inline-block ${getGradeColorClass(
                                grade
                              )}`}
                            >
                              {grade}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 italic">
                            {score >= 75
                              ? 'Exceptional mastery & effort'
                              : score >= 50
                              ? 'Satisfactory performance'
                              : score >= 35
                              ? 'Needs more regular revision'
                              : 'Requires immediate remedial assistance'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-center mb-8">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Marks</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedReportResult?.totalMarks || 0}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Term Average</span>
                  <div className="text-xl font-black text-blue-700 mt-0.5">
                    {selectedReportResult?.average || 0}%
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Class Rank</span>
                  <div className="text-xl font-black text-amber-600 mt-0.5">
                    {selectedReportResult?.rank ? `${selectedReportResult.rank}` : '—'}
                  </div>
                </div>
              </div>

              {/* Attendance & Sign-off Lines */}
              <div className="border-t-2 border-slate-900 pt-8 grid grid-cols-3 gap-4 text-center text-xs font-semibold text-slate-600">
                <div>
                  <p className="mb-12">Class Teacher Remarks:</p>
                  <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    {currentUser?.name || 'Class Teacher'}
                  </p>
                  <span className="text-[10px]">Class Teacher Signature</span>
                </div>
                <div>
                  <p className="mb-12">Term Attendance Rate: 96%</p>
                  <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    Principal / Section Head
                  </p>
                  <span className="text-[10px]">Official School Stamp</span>
                </div>
                <div>
                  <p className="mb-12">Next Term Begins: May 18, 2026</p>
                  <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    Parent / Guardian Signature
                  </p>
                  <span className="text-[10px]">Date of Inspection</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: STUDENTS ROSTER ================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Students Roster for {classes.find(c => c.id === selectedClassId)?.name || 'Selected Class'} ({classStudents.length})
            </h3>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>

          {classStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Registered"
              description="Add student names and index numbers to begin recording term examination marks."
              actionLabel="Add Student"
              onAction={() => setShowAddStudentModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {classStudents.map(st => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {st.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      Index: {st.indexNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Gender: {st.gender || 'Not specified'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteStudent(st.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Add Student to {classes.find(c => c.id === selectedClassId)?.name}
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="e.g. Kasun Wickramasinghe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Index / Admission No
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentIndex}
                    onChange={e => setNewStudentIndex(e.target.value)}
                    placeholder="e.g. 2026/10A/01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={newStudentGender}
                    onChange={e => setNewStudentGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
