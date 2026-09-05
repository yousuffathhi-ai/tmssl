import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  SchoolClass,
  Teacher,
  SubjectAllocation,
  TimetableSlot,
  DailySubstitution,
  LessonPlan,
  Student,
  MarkRecord,
  LeaveRecord,
  LeaveBalance,
  CommunityPost,
  SchoolSettings,
  BellSchedule,
  ClassSection,
  TeacherRecord,
  SubjectRule,
  TimetableConflict,
} from '../types';
import { generateTimetableFromRules } from '../utils/timetableGenerator';
import { supabase, isSupabaseConfigured, localDb, fetchProfileFromDb, upsertProfileToDb } from '../lib/supabase';

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Partial<UserProfile> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  switchRole: (newRole: UserRole) => void;

  // --- TMS SL Supabase Database Tables ---
  schoolSettings: SchoolSettings;
  saveSchoolSettings: (settings: Partial<SchoolSettings>) => void;

  bellSchedule: BellSchedule;
  saveBellSchedule: (schedule: Partial<BellSchedule>) => void;

  classesSections: ClassSection[];
  addClassSection: (name: string, room: string) => ClassSection;
  deleteClassSection: (id: string) => void;

  teachersList: TeacherRecord[];
  addTeacherRecord: (name: string, subjects: string, maxPeriodsPerDay: number, offDays: string) => TeacherRecord;
  deleteTeacherRecord: (id: string) => void;

  subjectRules: SubjectRule[];
  addSubjectRule: (classId: string, teacherId: string, subject: string, periodsPerWeek: number, needsDoublePeriod: boolean) => SubjectRule;
  deleteSubjectRule: (id: string) => void;

  // Timetable Generation & Storage
  timetableSlots: TimetableSlot[];
  saveTimetable: (slots: TimetableSlot[]) => void;
  clearTimetable: () => void;
  generateAndSaveTimetable: () => { success: boolean; conflictsCount: number; message: string };
  conflicts: TimetableConflict[];
  isGenerating: boolean;

  // Compatibility with existing modules
  classes: SchoolClass[];
  addClass: (cls: Omit<SchoolClass, 'id'>) => SchoolClass;
  deleteClass: (id: string) => void;

  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  deleteTeacher: (id: string) => void;

  allocations: SubjectAllocation[];
  addAllocation: (allocation: Omit<SubjectAllocation, 'id'>) => SubjectAllocation;
  deleteAllocation: (id: string) => void;

  // Substitutions / Relief
  substitutions: DailySubstitution[];
  addSubstitution: (sub: Omit<DailySubstitution, 'id'>) => void;
  deleteSubstitution: (id: string) => void;

  // Lesson Plans
  lessonPlans: LessonPlan[];
  saveLessonPlan: (plan: LessonPlan) => void;
  deleteLessonPlan: (id: string) => void;

  // Students & Marks
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Student;
  deleteStudent: (id: string) => void;
  markRecords: MarkRecord[];
  saveMarkRecord: (record: Omit<MarkRecord, 'id'>) => MarkRecord;

  // Leaves
  leaves: LeaveRecord[];
  leaveBalance: LeaveBalance;
  applyLeave: (leave: Omit<LeaveRecord, 'id' | 'status' | 'appliedAt'>) => void;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', reviewNote?: string) => void;

  // Community Hub
  communityPosts: CommunityPost[];
  addCommunityPost: (post: Omit<CommunityPost, 'id' | 'likesCount' | 'likedBy' | 'comments' | 'bookmarkedBy' | 'createdAt'>) => void;
  togglePostLike: (postId: string) => void;
  addPostComment: (postId: string, text: string) => void;
  toggleBookmark: (postId: string) => void;

  // Utilities
  seedSampleSchoolData: () => void;
  resetAllDataToEmpty: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_BELL_SCHEDULE: BellSchedule = {
  user_id: 'default',
  first_period_start: '07:45',
  period_length_mins: 40,
  periods_per_day: 8,
  breaks_after_periods: 3,
  break_duration_mins: 20,
};

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  user_id: 'default',
  school_name: '',
  census_no: '',
  zone: '',
  province: '',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tmssl_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tmssl_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // User & Auth State (Starts NULL / Unauthenticated)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('tmssl_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const userId = currentUser?.id || 'usr_guest';

  // --- TMS SL Supabase Database Tables ---
  // 1. School Settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem('tmssl_school_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any old hardcoded values from previous sessions
        if (parsed.school_name && (parsed.school_name.includes('Bathriya') || parsed.school_name.includes('Kattankudy'))) {
          parsed.school_name = currentUser?.schoolName || '';
        }
        return parsed;
      }
      return { ...DEFAULT_SCHOOL_SETTINGS, user_id: userId, school_name: currentUser?.schoolName || '' };
    } catch {
      return { ...DEFAULT_SCHOOL_SETTINGS, user_id: userId, school_name: currentUser?.schoolName || '' };
    }
  });

  // 2. Bell Schedule
  const [bellSchedule, setBellSchedule] = useState<BellSchedule>(() => {
    try {
      const saved = localStorage.getItem('tmssl_bell_schedule');
      return saved ? JSON.parse(saved) : { ...DEFAULT_BELL_SCHEDULE, user_id: userId };
    } catch {
      return { ...DEFAULT_BELL_SCHEDULE, user_id: userId };
    }
  });

  // 3. Classes & Sections (Strictly starts empty for fresh users)
  const [classesSections, setClassesSections] = useState<ClassSection[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_classes_sections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Teachers List (Strictly starts empty for fresh users)
  const [teachersList, setTeachersList] = useState<TeacherRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_teachers_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Subject Rules (Strictly starts empty for fresh users)
  const [subjectRules, setSubjectRules] = useState<SubjectRule[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_subject_rules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 6. Generated Timetables (Slots & Conflicts)
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_timetable');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Synchronized compatibility collections
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_classes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_teachers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [allocations, setAllocations] = useState<SubjectAllocation[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_allocations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [substitutions, setSubstitutions] = useState<DailySubstitution[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_substitutions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_lesson_plans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_students');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [markRecords, setMarkRecords] = useState<MarkRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_marks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_leaves');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('tmssl_community');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('tmssl_school_settings', JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  useEffect(() => {
    localStorage.setItem('tmssl_bell_schedule', JSON.stringify(bellSchedule));
  }, [bellSchedule]);

  useEffect(() => {
    localStorage.setItem('tmssl_classes_sections', JSON.stringify(classesSections));
    // Synchronize legacy `classes`
    const mapped: SchoolClass[] = classesSections.map(cs => ({
      id: cs.id,
      grade: cs.grade || parseInt(cs.name.match(/\d+/)?.[0] || '10', 10),
      section: cs.name.split('-')[1]?.trim() || cs.name.split(' ').pop() || 'A',
      name: cs.name,
      room: cs.room,
    }));
    setClasses(mapped);
    localStorage.setItem('tmssl_classes', JSON.stringify(mapped));
  }, [classesSections]);

  useEffect(() => {
    localStorage.setItem('tmssl_teachers_records', JSON.stringify(teachersList));
    // Synchronize legacy `teachers`
    const mapped: Teacher[] = teachersList.map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.name.split(' ').pop() || t.name,
      staffId: 'SLTS-' + t.id.substring(t.id.length - 4),
      email: `${t.name.toLowerCase().replace(/[^a-z]/g, '')}@school.edu.lk`,
      subjects: t.subjects ? t.subjects.split(',').map(s => s.trim()) : [],
      maxPeriodsPerDay: t.max_periods_per_day,
      maxPeriodsPerWeek: t.max_periods_per_day * 5,
    }));
    setTeachers(mapped);
    localStorage.setItem('tmssl_teachers', JSON.stringify(mapped));
  }, [teachersList]);

  useEffect(() => {
    localStorage.setItem('tmssl_subject_rules', JSON.stringify(subjectRules));
    // Synchronize legacy `allocations`
    const mapped: SubjectAllocation[] = subjectRules.map(sr => ({
      id: sr.id,
      classId: sr.class_id,
      teacherId: sr.teacher_id,
      subjectName: sr.subject,
      weeklyPeriods: sr.periods_per_week,
      isDoublePeriodAllowed: sr.needs_double_period,
    }));
    setAllocations(mapped);
    localStorage.setItem('tmssl_allocations', JSON.stringify(mapped));
  }, [subjectRules]);

  useEffect(() => {
    localStorage.setItem('tmssl_timetable', JSON.stringify(timetableSlots));
  }, [timetableSlots]);

  useEffect(() => {
    localStorage.setItem('tmssl_substitutions', JSON.stringify(substitutions));
  }, [substitutions]);

  useEffect(() => {
    localStorage.setItem('tmssl_lesson_plans', JSON.stringify(lessonPlans));
  }, [lessonPlans]);

  useEffect(() => {
    localStorage.setItem('tmssl_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('tmssl_marks', JSON.stringify(markRecords));
  }, [markRecords]);

  useEffect(() => {
    localStorage.setItem('tmssl_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('tmssl_community', JSON.stringify(communityPosts));
  }, [communityPosts]);

  // Auth Handlers (Real Supabase Auth with fallback local session)
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const dbProfile = await fetchProfileFromDb(data.user.id);
          const resolvedSchool = dbProfile?.school_name || data.user.user_metadata?.school_name || '';
          const resolvedName = dbProfile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0];
          const resolvedDistrict = dbProfile?.district || data.user.user_metadata?.district || '';
          const resolvedRole = (dbProfile?.role || data.user.user_metadata?.role || 'teacher') as UserRole;

          const profile: UserProfile = {
            id: data.user.id,
            name: resolvedName,
            email: data.user.email || email,
            role: resolvedRole,
            schoolName: resolvedSchool,
            district: resolvedDistrict,
            staffId: dbProfile?.staff_id || 'SLTS-' + data.user.id.substring(0, 5),
            subjectHandling: dbProfile?.subject_handling || ['Science', 'Mathematics'],
            assignedClass: dbProfile?.assigned_class || 'Grade 10-A',
            contactNumber: dbProfile?.contact_number || '+94 77 123 4567',
            avatarUrl: dbProfile?.avatar_url || data.user.user_metadata?.avatar_url,
            joinedDate: new Date().toISOString().split('T')[0],
            createdAt: data.user.created_at,
          };
          setCurrentUser(profile);
          localStorage.setItem('tmssl_session', JSON.stringify(profile));
          if (resolvedSchool) {
            setSchoolSettings(prev => ({ ...prev, school_name: resolvedSchool, zone: resolvedDistrict || prev.zone }));
          }
          return { success: true };
        }
      }

      // Local persistent authentication
      const storedUsersRaw = localStorage.getItem('tmssl_registered_users');
      const storedUsers: (UserProfile & { password?: string })[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const found = storedUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

      if (found) {
        if (found.password && found.password !== password) {
          return { success: false, error: 'Incorrect password for this account.' };
        }
        const { password: _, ...cleanProfile } = found;
        setCurrentUser(cleanProfile as UserProfile);
        localStorage.setItem('tmssl_session', JSON.stringify(cleanProfile));
        if (cleanProfile.schoolName) {
          setSchoolSettings(prev => ({ ...prev, school_name: cleanProfile.schoolName, zone: cleanProfile.district || prev.zone }));
        }
        return { success: true };
      }

      // Create new user if registering on login
      const newProfile: UserProfile = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0] || 'Teacher',
        email: email.trim(),
        role: 'teacher',
        schoolName: '',
        district: '',
        staffId: 'SLTS-49210',
        subjectHandling: ['Science', 'Mathematics'],
        assignedClass: 'Grade 10-A',
        contactNumber: '+94 77 123 4567',
        joinedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await upsertProfileToDb({
        id: newProfile.id,
        full_name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
        school_name: newProfile.schoolName,
        district: newProfile.district,
        staff_id: newProfile.staffId,
        assigned_class: newProfile.assignedClass,
        subject_handling: newProfile.subjectHandling,
        contact_number: newProfile.contactNumber,
      });

      storedUsers.push({ ...newProfile, password });
      localStorage.setItem('tmssl_registered_users', JSON.stringify(storedUsers));
      setCurrentUser(newProfile);
      localStorage.setItem('tmssl_session', JSON.stringify(newProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const register = async (data: Partial<UserProfile> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!data.email || !data.password) {
        return { success: false, error: 'Email and password are required.' };
      }

      const inputSchoolName = data.schoolName?.trim() || '';
      const inputDistrict = data.district?.trim() || '';
      const inputName = data.name?.trim() || data.email.split('@')[0];
      const inputRole = data.role || 'teacher';

      if (isSupabaseConfigured && supabase) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              full_name: inputName,
              school_name: inputSchoolName,
              district: inputDistrict,
              role: inputRole,
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (authData.user) {
          const profile: UserProfile = {
            id: authData.user.id,
            name: inputName,
            email: data.email.trim(),
            role: inputRole,
            schoolName: inputSchoolName,
            district: inputDistrict,
            staffId: data.staffId || 'SLTS-1001',
            subjectHandling: data.subjectHandling || ['Science'],
            assignedClass: data.assignedClass || 'Grade 10-A',
            contactNumber: data.contactNumber || '+94 77 123 4567',
            avatarUrl: data.avatarUrl,
            joinedDate: new Date().toISOString().split('T')[0],
            createdAt: authData.user.created_at,
          };

          // Explicitly save to profiles table in Supabase & localDb
          await upsertProfileToDb({
            id: authData.user.id,
            full_name: profile.name,
            email: profile.email,
            role: profile.role,
            school_name: profile.schoolName,
            district: profile.district,
            staff_id: profile.staffId,
            assigned_class: profile.assignedClass,
            subject_handling: profile.subjectHandling,
            contact_number: profile.contactNumber,
            avatar_url: profile.avatarUrl,
          });

          setCurrentUser(profile);
          localStorage.setItem('tmssl_session', JSON.stringify(profile));
          if (profile.schoolName) {
            setSchoolSettings(prev => ({ ...prev, school_name: profile.schoolName, zone: profile.district || prev.zone }));
          }
          return { success: true };
        }
      }

      const storedUsersRaw = localStorage.getItem('tmssl_registered_users');
      const storedUsers: (UserProfile & { password?: string })[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      if (storedUsers.some(u => u.email.toLowerCase() === data.email?.toLowerCase().trim())) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newProfile: UserProfile = {
        id: 'usr_' + Date.now(),
        name: inputName,
        email: data.email.trim(),
        role: inputRole,
        schoolName: inputSchoolName,
        district: inputDistrict,
        staffId: data.staffId || 'SLTS-' + Math.floor(10000 + Math.random() * 90000),
        subjectHandling: data.subjectHandling || ['Science'],
        assignedClass: data.assignedClass || 'Grade 10-A',
        contactNumber: data.contactNumber || '+94 77 123 4567',
        avatarUrl: data.avatarUrl,
        joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      // Store in profiles table in localDb & registered users list
      await upsertProfileToDb({
        id: newProfile.id,
        full_name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
        school_name: newProfile.schoolName,
        district: newProfile.district,
        staff_id: newProfile.staffId,
        assigned_class: newProfile.assignedClass,
        subject_handling: newProfile.subjectHandling,
        contact_number: newProfile.contactNumber,
        avatar_url: newProfile.avatarUrl,
      });

      storedUsers.push({ ...newProfile, password: data.password });
      localStorage.setItem('tmssl_registered_users', JSON.stringify(storedUsers));
      setCurrentUser(newProfile);
      localStorage.setItem('tmssl_session', JSON.stringify(newProfile));
      if (newProfile.schoolName) {
        setSchoolSettings(prev => ({ ...prev, school_name: newProfile.schoolName, zone: newProfile.district || prev.zone }));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('tmssl_session');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('tmssl_session', JSON.stringify(updated));

    if (data.schoolName !== undefined) {
      setSchoolSettings(prev => ({ ...prev, school_name: data.schoolName || '', zone: data.district || prev.zone }));
    }

    upsertProfileToDb({
      id: updated.id,
      full_name: updated.name,
      email: updated.email,
      role: updated.role,
      school_name: updated.schoolName || '',
      district: updated.district || '',
      staff_id: updated.staffId,
      assigned_class: updated.assignedClass,
      subject_handling: updated.subjectHandling,
      contact_number: updated.contactNumber,
      avatar_url: updated.avatarUrl,
    }).catch(err => console.warn('Failed to upsert profile:', err));
  };

  const switchRole = (newRole: UserRole) => {
    if (currentUser) {
      updateProfile({ role: newRole });
    }
  };

  // --- 1. School Settings Operations ---
  const saveSchoolSettings = (newSettings: Partial<SchoolSettings>) => {
    const updated = { ...schoolSettings, ...newSettings };
    setSchoolSettings(updated);
    if (currentUser && newSettings.school_name !== undefined) {
      updateProfile({ schoolName: newSettings.school_name });
    }
  };

  // --- 2. Bell Schedule Operations ---
  const saveBellSchedule = (newSchedule: Partial<BellSchedule>) => {
    const updated = { ...bellSchedule, ...newSchedule };
    setBellSchedule(updated);
  };

  // --- 3. Classes & Sections Operations ---
  const addClassSection = (name: string, room: string) => {
    const newClass: ClassSection = {
      id: 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      name: name.trim(),
      room: room.trim(),
      created_at: new Date().toISOString(),
    };
    setClassesSections(prev => [...prev, newClass]);
    return newClass;
  };

  const deleteClassSection = (id: string) => {
    setClassesSections(prev => prev.filter(c => c.id !== id));
    setSubjectRules(prev => prev.filter(r => r.class_id !== id));
    setTimetableSlots(prev => prev.filter(s => s.classId !== id));
  };

  // --- 4. Teachers Operations ---
  const addTeacherRecord = (name: string, subjects: string, maxPeriodsPerDay: number, offDays: string) => {
    const newTeacher: TeacherRecord = {
      id: 'tch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      name: name.trim(),
      subjects: subjects.trim(),
      max_periods_per_day: maxPeriodsPerDay || 6,
      off_days: offDays.trim(),
      created_at: new Date().toISOString(),
    };
    setTeachersList(prev => [...prev, newTeacher]);
    return newTeacher;
  };

  const deleteTeacherRecord = (id: string) => {
    setTeachersList(prev => prev.filter(t => t.id !== id));
    setSubjectRules(prev => prev.filter(r => r.teacher_id !== id));
    setTimetableSlots(prev => prev.filter(s => s.teacherId !== id));
  };

  // --- 5. Subject Rules Operations ---
  const addSubjectRule = (
    classId: string,
    teacherId: string,
    subject: string,
    periodsPerWeek: number,
    needsDoublePeriod: boolean
  ) => {
    const newRule: SubjectRule = {
      id: 'rul_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      class_id: classId,
      teacher_id: teacherId,
      subject: subject.trim(),
      periods_per_week: periodsPerWeek || 5,
      needs_double_period: needsDoublePeriod,
      created_at: new Date().toISOString(),
    };
    setSubjectRules(prev => [...prev, newRule]);
    return newRule;
  };

  const deleteSubjectRule = (id: string) => {
    setSubjectRules(prev => prev.filter(r => r.id !== id));
  };

  // --- 6. Intelligent Conflict-Free Timetable Generation ---
  const generateAndSaveTimetable = () => {
    setIsGenerating(true);
    try {
      const { slots, conflicts: generatedConflicts } = generateTimetableFromRules(
        classesSections,
        teachersList,
        subjectRules,
        bellSchedule
      );

      setTimetableSlots(slots);
      setConflicts(generatedConflicts);
      setIsGenerating(false);

      return {
        success: slots.length > 0,
        conflictsCount: generatedConflicts.length,
        message:
          slots.length > 0
            ? `Successfully generated ${slots.length} conflict-free period assignments across 5 days.`
            : 'No slots could be placed. Please check your rules and teachers.',
      };
    } catch (err: any) {
      setIsGenerating(false);
      return {
        success: false,
        conflictsCount: 1,
        message: err.message || 'Generation failed.',
      };
    }
  };

  const saveTimetable = (slots: TimetableSlot[]) => {
    setTimetableSlots(slots);
  };

  const clearTimetable = () => {
    setTimetableSlots([]);
    setConflicts([]);
    localStorage.removeItem('tmssl_timetable');
  };

  // Compatibility operations
  const addClass = (cls: Omit<SchoolClass, 'id'>) => {
    const created = addClassSection(cls.name, cls.room);
    return { ...cls, id: created.id };
  };

  const deleteClass = (id: string) => {
    deleteClassSection(id);
  };

  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const created = addTeacherRecord(
      teacher.name,
      teacher.subjects.join(', '),
      teacher.maxPeriodsPerDay,
      ''
    );
    return { ...teacher, id: created.id };
  };

  const deleteTeacher = (id: string) => {
    deleteTeacherRecord(id);
  };

  const addAllocation = (allocation: Omit<SubjectAllocation, 'id'>) => {
    const created = addSubjectRule(
      allocation.classId,
      allocation.teacherId,
      allocation.subjectName,
      allocation.weeklyPeriods,
      allocation.isDoublePeriodAllowed
    );
    return { ...allocation, id: created.id };
  };

  const deleteAllocation = (id: string) => {
    deleteSubjectRule(id);
  };

  // Substitutions / Relief
  const addSubstitution = (sub: Omit<DailySubstitution, 'id'>) => {
    const newSub: DailySubstitution = { ...sub, id: 'sub_' + Date.now() };
    setSubstitutions(prev => [newSub, ...prev]);
  };

  const deleteSubstitution = (id: string) => {
    setSubstitutions(prev => prev.filter(s => s.id !== id));
  };

  // Lesson Plans
  const saveLessonPlan = (plan: LessonPlan) => {
    setLessonPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = plan;
        return copy;
      }
      return [plan, ...prev];
    });
  };

  const deleteLessonPlan = (id: string) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id));
  };

  // Students & Marks
  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = { ...student, id: 'stu_' + Date.now() };
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setMarkRecords(prev => prev.filter(m => m.studentId !== id));
  };

  const saveMarkRecord = (record: Omit<MarkRecord, 'id'>) => {
    const newRecord: MarkRecord = { ...record, id: 'mrk_' + Date.now() };
    setMarkRecords(prev => {
      const idx = prev.findIndex(m => m.studentId === record.studentId && m.term === record.term);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...newRecord, id: prev[idx].id };
        return copy;
      }
      return [...prev, newRecord];
    });
    return newRecord;
  };

  // Leaves
  const leaveBalance: LeaveBalance = {
    casualTotal: 21,
    casualUsed: leaves.filter(l => l.leaveType === 'Casual' && l.status === 'Approved').reduce((acc, curr) => acc + curr.numberOfDays, 0),
    restTotal: 24,
    restUsed: leaves.filter(l => l.leaveType === 'Rest / Medical' && l.status === 'Approved').reduce((acc, curr) => acc + curr.numberOfDays, 0),
    dutyUsed: leaves.filter(l => l.leaveType === 'Duty' && l.status === 'Approved').reduce((acc, curr) => acc + curr.numberOfDays, 0),
  };

  const applyLeave = (leave: Omit<LeaveRecord, 'id' | 'status' | 'appliedAt'>) => {
    const newLeave: LeaveRecord = {
      ...leave,
      id: 'lve_' + Date.now(),
      status: 'Pending',
      appliedAt: new Date().toISOString(),
    };
    setLeaves(prev => [newLeave, ...prev]);
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected', reviewNote?: string) => {
    setLeaves(prev =>
      prev.map(l => (l.id === id ? { ...l, status, reviewNote, reviewedBy: currentUser?.name || 'Admin' } : l))
    );
  };

  // Community Hub
  const addCommunityPost = (post: Omit<CommunityPost, 'id' | 'likesCount' | 'likedBy' | 'comments' | 'bookmarkedBy' | 'createdAt'>) => {
    const newPost: CommunityPost = {
      ...post,
      id: 'post_' + Date.now(),
      likesCount: 0,
      likedBy: [],
      comments: [],
      bookmarkedBy: [],
      createdAt: new Date().toISOString(),
    };
    setCommunityPosts(prev => [newPost, ...prev]);
  };

  const togglePostLike = (postId: string) => {
    if (!currentUser) return;
    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const hasLiked = p.likedBy.includes(currentUser.id);
        return {
          ...p,
          likedBy: hasLiked ? p.likedBy.filter(id => id !== currentUser.id) : [...p.likedBy, currentUser.id],
          likesCount: hasLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      })
    );
  };

  const addPostComment = (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const comment = {
      id: 'cmt_' + Date.now(),
      authorName: currentUser.name,
      school: currentUser.schoolName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setCommunityPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  };

  const toggleBookmark = (postId: string) => {
    if (!currentUser) return;
    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const isBookmarked = p.bookmarkedBy.includes(currentUser.id);
        return {
          ...p,
          bookmarkedBy: isBookmarked
            ? p.bookmarkedBy.filter(id => id !== currentUser.id)
            : [...p.bookmarkedBy, currentUser.id],
        };
      })
    );
  };

  // Seed sample data for testing when requested by user
  const seedSampleSchoolData = () => {
    const c1: ClassSection = { id: 'cls_1', user_id: userId, name: 'Grade 1 A', room: 'Room 1' };
    const c2: ClassSection = { id: 'cls_2', user_id: userId, name: 'Grade 6 A', room: 'Room 12' };
    const c3: ClassSection = { id: 'cls_3', user_id: userId, name: 'Grade 10 A', room: 'Room 201' };

    const t1: TeacherRecord = { id: 'tch_1', user_id: userId, name: 'Mrs. K. Jayawardena', subjects: 'Mathematics, Science', max_periods_per_day: 6, off_days: 'Fri' };
    const t2: TeacherRecord = { id: 'tch_2', user_id: userId, name: 'Mr. R. Silva', subjects: 'English Language, History', max_periods_per_day: 6, off_days: '' };
    const t3: TeacherRecord = { id: 'tch_3', user_id: userId, name: 'Mr. M.S.M. Farook', subjects: 'Science, Health', max_periods_per_day: 6, off_days: 'Mon' };
    const t4: TeacherRecord = { id: 'tch_4', user_id: userId, name: 'Mrs. M. Fernando', subjects: 'ICT, Science', max_periods_per_day: 5, off_days: '' };

    const rules: SubjectRule[] = [
      { id: 'rul_1', user_id: userId, class_id: c1.id, teacher_id: t1.id, subject: 'Mathematics', periods_per_week: 5, needs_double_period: false },
      { id: 'rul_2', user_id: userId, class_id: c1.id, teacher_id: t3.id, subject: 'Science', periods_per_week: 5, needs_double_period: true },
      { id: 'rul_3', user_id: userId, class_id: c1.id, teacher_id: t2.id, subject: 'English', periods_per_week: 4, needs_double_period: false },
      { id: 'rul_4', user_id: userId, class_id: c2.id, teacher_id: t1.id, subject: 'Mathematics', periods_per_week: 5, needs_double_period: false },
      { id: 'rul_5', user_id: userId, class_id: c2.id, teacher_id: t3.id, subject: 'Science', periods_per_week: 5, needs_double_period: true },
      { id: 'rul_6', user_id: userId, class_id: c2.id, teacher_id: t4.id, subject: 'ICT', periods_per_week: 3, needs_double_period: true },
      { id: 'rul_7', user_id: userId, class_id: c3.id, teacher_id: t1.id, subject: 'Mathematics', periods_per_week: 5, needs_double_period: false },
      { id: 'rul_8', user_id: userId, class_id: c3.id, teacher_id: t2.id, subject: 'History', periods_per_week: 3, needs_double_period: false },
    ];

    setClassesSections([c1, c2, c3]);
    setTeachersList([t1, t2, t3, t4]);
    setSubjectRules(rules);

    // Also seed bell schedule
    setBellSchedule({
      user_id: userId,
      first_period_start: '07:45',
      period_length_mins: 40,
      periods_per_day: 8,
      breaks_after_periods: 3,
      break_duration_mins: 20,
    });
  };

  const resetAllDataToEmpty = () => {
    setClassesSections([]);
    setTeachersList([]);
    setSubjectRules([]);
    setTimetableSlots([]);
    setConflicts([]);
    setClasses([]);
    setTeachers([]);
    setAllocations([]);
    setSubstitutions([]);
    setLessonPlans([]);
    setStudents([]);
    setMarkRecords([]);
    setLeaves([]);
    setCommunityPosts([]);
    localStorage.removeItem('tmssl_classes_sections');
    localStorage.removeItem('tmssl_teachers_records');
    localStorage.removeItem('tmssl_subject_rules');
    localStorage.removeItem('tmssl_timetable');
    localStorage.removeItem('tmssl_classes');
    localStorage.removeItem('tmssl_teachers');
    localStorage.removeItem('tmssl_allocations');
    localStorage.removeItem('tmssl_substitutions');
    localStorage.removeItem('tmssl_lesson_plans');
    localStorage.removeItem('tmssl_students');
    localStorage.removeItem('tmssl_marks');
    localStorage.removeItem('tmssl_leaves');
    localStorage.removeItem('tmssl_community');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        updateProfile,
        updateUserProfile: updateProfile,
        switchRole,
        schoolSettings,
        saveSchoolSettings,
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
        timetableSlots,
        saveTimetable,
        clearTimetable,
        generateAndSaveTimetable,
        conflicts,
        isGenerating,
        classes,
        addClass,
        deleteClass,
        teachers,
        addTeacher,
        deleteTeacher,
        allocations,
        addAllocation,
        deleteAllocation,
        substitutions,
        addSubstitution,
        deleteSubstitution,
        lessonPlans,
        saveLessonPlan,
        deleteLessonPlan,
        students,
        addStudent,
        deleteStudent,
        markRecords,
        saveMarkRecord,
        leaves,
        leaveBalance,
        applyLeave,
        updateLeaveStatus,
        communityPosts,
        addCommunityPost,
        togglePostLike,
        addPostComment,
        toggleBookmark,
        seedSampleSchoolData,
        resetAllDataToEmpty,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
