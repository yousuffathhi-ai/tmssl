import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { UserCheck, ShieldCheck, School, Save, Download, Upload, Trash2, Sparkles, Smartphone } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    seedSampleSchoolData,
    resetAllDataToEmpty,
    classes,
    teachers,
    timetableSlots,
    markRecords,
    lessonPlans,
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [schoolName, setSchoolName] = useState(currentUser?.schoolName || '');
  const [district, setDistrict] = useState(currentUser?.district || '');
  const [role, setRole] = useState<UserRole>(currentUser?.role || 'teacher');
  const [staffId, setStaffId] = useState(currentUser?.staffId || '');
  const [assignedClass, setAssignedClass] = useState(currentUser?.assignedClass || '');
  const [subjects, setSubjects] = useState(currentUser?.subjectHandling?.join(', ') || '');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      schoolName: schoolName.trim(),
      district: district.trim(),
      role,
      staffId: staffId.trim(),
      assignedClass: assignedClass.trim(),
      subjectHandling: subjects.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Export all application state to JSON
  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      classes,
      teachers,
      timetableSlots,
      markRecords,
      lessonPlans,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TMS_SL_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <span>Sri Lankan Teacher Profile & School Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage teacher service credentials, assigned classes, and local data persistence backups.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Teacher profile updated successfully!</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <School className="w-4 h-4 text-blue-500" />
          <span>Teacher Service Information</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Full Name with Initials
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Ministry Staff ID / Reg No.
              </label>
              <input
                type="text"
                required
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                School Name (Top Bar & Export Branding)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="e.g. Zahira National College"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Displays dynamically on your top header badge, generated timetables, and exports.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                District / Zone
              </label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="e.g. Colombo, Kandy, Batticaloa"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                System Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="teacher">Teacher (Subject & Class Teacher)</option>
                <option value="admin">Principal / Admin (Full Access)</option>
                <option value="guest">Guest / Parent (Read-only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Class Teacher of (Assigned Class)
              </label>
              <input
                type="text"
                value={assignedClass}
                onChange={e => setAssignedClass(e.target.value)}
                placeholder="e.g. Grade 10-A"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Subjects Handled (comma separated)
              </label>
              <input
                type="text"
                value={subjects}
                onChange={e => setSubjects(e.target.value)}
                placeholder="e.g. Science, Mathematics"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Management & PWA Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>Offline Data & Sample Simulation Tools</span>
        </h3>
        <p className="text-xs text-slate-500">
          All school timetables, lesson plans, marks, and leaves are stored offline in browser local storage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={seedSampleSchoolData}
            className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-left hover:bg-amber-100 transition"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Seed Sample Data</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
              Populate sample Grade 10 classes, teachers, marks, and timetable.
            </p>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-left hover:bg-blue-100 transition"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-300 mb-1">
              <Download className="w-4 h-4 text-blue-500" />
              <span>Export School Backup</span>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-400">
              Download complete school database backup as JSON.
            </p>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data and return to empty states?')) {
                resetAllDataToEmpty();
              }
            }}
            className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-left hover:bg-red-100 transition"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-red-900 dark:text-red-300 mb-1">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Clear All Data</span>
            </div>
            <p className="text-[11px] text-red-800/80 dark:text-red-400">
              Reset all modules back to initial empty states.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
