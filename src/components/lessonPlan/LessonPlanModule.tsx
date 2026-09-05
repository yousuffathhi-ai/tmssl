import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SRI_LANKA_SUBJECT_LIST } from '../../data/sriLankaEduData';
import { LessonPlan } from '../../types';
import { EmptyState } from '../common/EmptyState';
import {
  Sparkles,
  BookOpen,
  Printer,
  Save,
  Trash2,
  Clock,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Copy,
  Plus,
} from 'lucide-react';

export const LessonPlanModule: React.FC = () => {
  const { currentUser, lessonPlans, saveLessonPlan, deleteLessonPlan } = useApp();

  const [activeTab, setActiveTab] = useState<'generator' | 'archive'>('generator');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [grade, setGrade] = useState<number>(10);
  const [subject, setSubject] = useState<string>('Science');
  const [unitTopic, setUnitTopic] = useState<string>('Photosynthesis and Plant Nutrition');
  const [competencyLevel, setCompetencyLevel] = useState<string>('Competency 5.1: Investigates the factors affecting photosynthesis in green plants');
  const [periodDuration, setPeriodDuration] = useState<number>(40);
  const [medium, setMedium] = useState<'English' | 'Sinhala' | 'Tamil'>('English');
  const [additionalNotes, setAdditionalNotes] = useState<string>('Focus on laboratory starch testing demonstration with iodine');

  // Currently displayed or generated plan
  const [currentPlan, setCurrentPlan] = useState<LessonPlan | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    setSavedSuccessMessage(false);

    try {
      const response = await fetch('/api/lesson-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          subject,
          unitTopic,
          competencyLevel,
          periodDuration,
          medium,
          additionalNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate lesson plan');
      }

      if (data.plan) {
        const fullPlan: LessonPlan = {
          id: 'lp_' + Date.now(),
          grade,
          subject,
          unitTopic,
          competencyLevel,
          periodDuration,
          medium,
          title: data.plan.title || `${subject} - ${unitTopic}`,
          teacherName: currentUser?.name || 'Subject Teacher',
          learningOutcomes: data.plan.learningOutcomes || [],
          tlms: data.plan.tlms || [],
          lessonFlow: data.plan.lessonFlow || [],
          evaluationQuestions: data.plan.evaluationQuestions || [],
          differentiatedLearning: data.plan.differentiatedLearning || {
            remedialTasks: [],
            enrichmentTasks: [],
          },
          teacherReflection: data.plan.teacherReflection || '',
          createdAt: new Date().toISOString(),
        };

        setCurrentPlan(fullPlan);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI lesson plan service.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCurrentPlan = () => {
    if (!currentPlan) return;
    saveLessonPlan(currentPlan);
    setSavedSuccessMessage(true);
    setTimeout(() => setSavedSuccessMessage(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>AI Lesson Plan Generator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            National Institute of Education (NIE) Curriculum Alignment • 4-Phase Lesson Flow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'generator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Plan Generator
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'archive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              My Saved Plans ({lessonPlans.length})
            </button>
          </div>

          {currentPlan && activeTab === 'generator' && (
            <button
              onClick={handlePrint}
              title="Print official NIE-format lesson plan"
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: GENERATOR ================= */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 4 or 5 cols on lg */}
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Lesson Parameters</span>
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Grade
                    </label>
                    <select
                      value={grade}
                      onChange={e => setGrade(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {[6, 7, 8, 9, 10, 11, 12, 13].map(g => (
                        <option key={g} value={g}>
                          Grade {g} {g === 11 ? '(O/L)' : g >= 12 ? '(A/L)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Medium
                    </label>
                    <select
                      value={medium}
                      onChange={e => setMedium(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="English">English</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="Tamil">Tamil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    list="sl-subjects-lp"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Select or enter subject"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                  <datalist id="sl-subjects-lp">
                    {SRI_LANKA_SUBJECT_LIST.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Unit / Lesson Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={unitTopic}
                    onChange={e => setUnitTopic(e.target.value)}
                    placeholder="e.g. Quadratic Equations, Photosynthesis"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    NIE Competency / Competency Level
                  </label>
                  <textarea
                    rows={2}
                    value={competencyLevel}
                    onChange={e => setCompetencyLevel(e.target.value)}
                    placeholder="e.g. Competency 4.2: Applies algebraic methods to solve real-world problems"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Duration
                    </label>
                    <select
                      value={periodDuration}
                      onChange={e => setPeriodDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value={40}>40 mins (Single)</option>
                      <option value={80}>80 mins (Double/Lab)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Syllabus Framework
                    </label>
                    <div className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      NIE Sri Lanka
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Special Focus / Teaching Aids
                  </label>
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Include hands-on lab demonstration"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  <span>{generating ? 'Consulting NIE Curriculum AI...' : 'Generate 4-Phase Lesson Plan'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Viewer: 7 or 8 cols on lg */}
          <div className="lg:col-span-8">
            {!currentPlan ? (
              <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Ready to Generate NIE Lesson Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                  Fill in the lesson details on the left and click Generate. The system will build a full 4-phase pedagogical flow with learning outcomes, TLMs, and differentiated tasks.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    1. Engagement
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    2. Exploration
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    3. Elaboration
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    4. Evaluation
                  </div>
                </div>
              </div>
            ) : (
              /* Generated Plan Viewer / Editable */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:p-0">
                {/* Print Banner Header */}
                <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      National Institute of Education (NIE) Sri Lanka • Lesson Note
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {currentPlan.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Grade: {currentPlan.grade} | Medium: {currentPlan.medium} | Duration: {currentPlan.periodDuration} Minutes
                    </p>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={handleSaveCurrentPlan}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savedSuccessMessage ? 'Saved to Archive!' : 'Save Plan'}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Competency & Outcomes */}
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide block text-[10px]">
                      Curriculum Competency
                    </span>
                    <p className="font-medium text-blue-950 dark:text-blue-200 mt-0.5">
                      {currentPlan.competencyLevel}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Specific Learning Outcomes
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-200">
                      {currentPlan.learningOutcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Teaching-Learning Materials (TLMs)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPlan.tlms.map((tlm, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          📦 {tlm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4-Phase Lesson Flow Table */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Step-by-Step Pedagogical Flow
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 w-32">Phase & Time</th>
                          <th className="p-2.5">Teacher Activity</th>
                          <th className="p-2.5">Student Activity</th>
                          <th className="p-2.5 w-44">Formative Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentPlan.lessonFlow.map((step, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 align-top font-bold text-slate-900 dark:text-white">
                              <div>{step.step}</div>
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                {step.timeMinutes} Mins
                              </span>
                            </td>
                            <td className="p-2.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                              {step.teacherActivity}
                            </td>
                            <td className="p-2.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                              {step.studentActivity}
                            </td>
                            <td className="p-2.5 align-top text-slate-500 dark:text-slate-400 italic text-[11px]">
                              {step.assessmentPoints}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Evaluation Questions */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evaluation & Homework Questions</span>
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-800 dark:text-slate-200">
                    {currentPlan.evaluationQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ol>
                </div>

                {/* Differentiated Learning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                      Remedial Support Tasks:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-amber-950 dark:text-amber-200 text-[11px]">
                      {currentPlan.differentiatedLearning.remedialTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">
                      Enrichment / Advanced Tasks:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-purple-950 dark:text-purple-200 text-[11px]">
                      {currentPlan.differentiatedLearning.enrichmentTasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Teacher Reflection */}
                {currentPlan.teacherReflection && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">
                      Teacher Pedagogical Reflection & Notes:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {currentPlan.teacherReflection}
                    </p>
                  </div>
                )}

                {/* Sign-off for Official Submission */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 text-center text-xs font-semibold text-slate-500">
                  <div>
                    <p className="mb-8">Prepared By:</p>
                    <p className="border-t border-slate-400 pt-1 w-48 mx-auto font-bold text-slate-800 dark:text-slate-200">
                      {currentUser?.name}
                    </p>
                    <span className="text-[10px]">Subject Teacher</span>
                  </div>
                  <div>
                    <p className="mb-8">Approved / Inspected By:</p>
                    <p className="border-t border-slate-400 pt-1 w-48 mx-auto font-bold text-slate-800 dark:text-slate-200">
                      Sectional Head / Principal
                    </p>
                    <span className="text-[10px]">Signature & Official Stamp</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ARCHIVE ================= */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Archived Lesson Plans ({lessonPlans.length})
            </h3>
            <button
              onClick={() => setActiveTab('generator')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Lesson Plan</span>
            </button>
          </div>

          {lessonPlans.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Lesson Plans Saved Yet"
              description="Plans generated using the AI Lesson Plan Generator will be safely preserved in your offline-ready archive for classroom use and inspection."
              actionLabel="Create First Lesson Plan"
              onAction={() => setActiveTab('generator')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessonPlans.map(plan => (
                <div
                  key={plan.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Grade {plan.grade} • {plan.medium}
                      </span>
                      <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {plan.competencyLevel}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentPlan(plan);
                        setActiveTab('generator');
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>
                    <button
                      onClick={() => deleteLessonPlan(plan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
