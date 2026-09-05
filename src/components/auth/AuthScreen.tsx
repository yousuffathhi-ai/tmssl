import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, GraduationCap, Lock, Mail, User, School, Phone, BookOpen, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';

const SRI_LANKAN_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

export const AuthScreen: React.FC = () => {
  const { login, register } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields - strictly empty defaults for dynamic user branding
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [schoolName, setSchoolName] = useState('');
  const [district, setDistrict] = useState('');
  const [staffId, setStaffId] = useState('');
  const [subjectHandling, setSubjectHandling] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !name) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 4) {
      setError('Password should be at least 4 characters long.');
      return;
    }

    const subjectsArray = subjectHandling
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    setLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      schoolName: schoolName.trim(),
      district: district.trim(),
      staffId: staffId.trim() || 'SLTS-' + Math.floor(10000 + Math.random() * 89999),
      subjectHandling: subjectsArray.length > 0 ? subjectsArray : ['General Subjects'],
      assignedClass: assignedClass.trim() || 'Grade 10-A',
      contactNumber: contactNumber.trim() || '+94 77 000 0000',
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to register account.');
    }
  };

  const handleQuickDemoFill = (selectedRole: UserRole) => {
    if (selectedRole === 'admin') {
      setEmail('principal@tmssl.edu.lk');
      setPassword('admin123');
      setName('Dr. Nihal Ranasinghe');
      setRole('admin');
      setSchoolName('Central National College');
      setDistrict('Colombo');
      setStaffId('SLEAS-0192');
      setSubjectHandling('Administration, Educational Management');
      setAssignedClass('School Head');
      setContactNumber('+94 11 269 1025');
    } else if (selectedRole === 'teacher') {
      setEmail('teacher@tmssl.edu.lk');
      setPassword('teacher123');
      setName('Mrs. Kumudini Jayawardena');
      setRole('teacher');
      setSchoolName('Sri Lanka Model School');
      setDistrict('Kandy');
      setStaffId('SLTS-88421');
      setSubjectHandling('Mathematics, Science');
      setAssignedClass('Grade 10-A');
      setContactNumber('+94 77 345 6789');
    } else {
      setEmail('parent@tmssl.edu.lk');
      setPassword('guest123');
      setName('Mr. Sunil Perera (Parent)');
      setRole('guest');
      setSchoolName('High School');
      setDistrict('Galle');
      setStaffId('GUEST-2026');
      setSubjectHandling('View Only Access');
      setAssignedClass('Grade 8-B');
      setContactNumber('+94 71 888 9999');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Sri Lankan Education Emblem Header */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 shadow-xl ring-2 ring-amber-400/30 mb-4">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          TMS SL
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Sri Lanka
          </span>
        </h1>
        <p className="mt-1 text-sm text-blue-200/80 font-medium">
          Teacher Management System • National School Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/20 dark:border-slate-800 text-slate-900 dark:text-white transition-all">
          {/* Top Mode Tabs */}
          {!isForgotPassword && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  !isRegistering
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  isRegistering
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Register Teacher / Staff
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {isForgotPassword ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Recovery</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your registered school email address to receive password reset instructions.
              </p>

              {forgotSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Reset Link Dispatched
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Password recovery details sent to <strong>{email || 'your email'}</strong>. (Mock verification active).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotSubmitted(false);
                    }}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (email) setForgotSubmitted(true);
                    else setError('Please provide your email address.');
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="teacher@school.lk"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                    >
                      Send Reset Instructions
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !isRegistering ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. teacher@tmssl.edu.lk"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Fill Testing Helper */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  1-Click Role Testing Logins:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('admin')}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-center"
                  >
                    👑 Principal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('teacher')}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-center"
                  >
                    📚 Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('guest')}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-center"
                  >
                    👀 Parent/Guest
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-1">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System Role (Role-Based Access Control)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'teacher', label: 'Teacher', desc: 'Subject & Class teacher' },
                    { id: 'admin', label: 'Principal / Admin', desc: 'Full approvals & timetable' },
                    { id: 'guest', label: 'Guest / Parent', desc: 'Read-only view' },
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        role === r.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        {r.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {r.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Mrs. M. Fernando"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="teacher@school.lk"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* School Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Name <span className="text-slate-400 font-normal">(Dynamic Branding for Badges & Timetables)</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="Enter your school name (e.g. Zahira National College)"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Leave empty if not applicable. If entered, it will be automatically featured on your Top Bar, Timetables, and Reports.
                </p>
              </div>

              {/* District / Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  District / Zone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="sl-districts-list"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="Select or type District / Educational Zone"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <datalist id="sl-districts-list">
                    {SRI_LANKAN_DISTRICTS.map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Staff ID & Assigned Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Staff ID / SLTS Number
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={staffId}
                      onChange={e => setStaffId(e.target.value)}
                      placeholder="e.g. SLTS-58420"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Class / In-Charge
                  </label>
                  <input
                    type="text"
                    value={assignedClass}
                    onChange={e => setAssignedClass(e.target.value)}
                    placeholder="e.g. Grade 10-A"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Subjects Handling */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subjects Handling (comma-separated)
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={subjectHandling}
                    onChange={e => setSubjectHandling(e.target.value)}
                    placeholder="e.g. Mathematics, Science, ICT"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number (WhatsApp/Phone)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Registering Account...' : 'Complete Profile & Enter TMS SL'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
