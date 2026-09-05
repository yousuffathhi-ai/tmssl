export type UserRole = 'admin' | 'teacher' | 'guest';

// --- Supabase Data Tables Models (TMS SL) ---
export interface SchoolSettings {
  id?: string;
  user_id: string;
  school_name: string;
  census_no?: string;
  zone?: string;
  province?: string;
  created_at?: string;
}

export interface BellSchedule {
  id?: string;
  user_id: string;
  first_period_start: string; // default "07:45"
  period_length_mins: number; // default 40
  periods_per_day: number; // default 8
  breaks_after_periods: number; // default 3
  break_duration_mins: number; // default 20
  created_at?: string;
}

export interface ClassSection {
  id: string;
  user_id: string;
  name: string; // e.g. "Grade 6 - A"
  room: string; // e.g. "Room 12"
  grade?: number;
  created_at?: string;
}

export interface TeacherRecord {
  id: string;
  user_id: string;
  name: string;
  subjects: string; // comma separated
  max_periods_per_day: number; // default 6
  off_days: string; // e.g. "Mon, Fri"
  created_at?: string;
}

export interface SubjectRule {
  id: string;
  user_id: string;
  class_id: string;
  teacher_id: string;
  subject: string;
  periods_per_week: number;
  needs_double_period: boolean;
  created_at?: string;
}

export interface GeneratedTimetableRecord {
  id?: string;
  user_id: string;
  slots: TimetableSlot[];
  conflicts?: TimetableConflict[];
  created_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolName: string;
  district?: string;
  staffId: string;
  subjectHandling: string[];
  assignedClass: string;
  contactNumber: string;
  avatarUrl?: string;
  joinedDate: string;
  createdAt: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface PeriodDefinition {
  periodIndex: number;
  startTime: string;
  endTime: string;
  label: string;
  isInterval?: boolean;
}

export interface SchoolClass {
  id: string;
  grade: number;
  section: string;
  name: string; // e.g. "Grade 10-A"
  room: string;
  classTeacher?: string;
}

export interface Teacher {
  id: string;
  name: string;
  shortName: string;
  staffId: string;
  email: string;
  subjects: string[];
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  unavailableSlots?: { day: DayOfWeek; periodIndex: number }[];
}

export interface SubjectAllocation {
  id: string;
  classId: string;
  subjectName: string;
  teacherId: string;
  weeklyPeriods: number;
  isDoublePeriodAllowed: boolean;
  specialRoomRequired?: string;
}

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  periodIndex: number; // 1 to 8
  classId: string;
  subjectName: string;
  teacherId: string;
  room?: string;
  isDoublePeriod?: boolean;
}

export interface TimetableConflict {
  id: string;
  day: DayOfWeek;
  periodIndex: number; // 1 to 8
  type: 'TEACHER_DOUBLE_BOOKING' | 'ROOM_DOUBLE_BOOKING' | 'TEACHER_OVERLOAD';
  description: string;
  message?: string;
  severity: 'critical' | 'warning';
}

export interface DailySubstitution {
  id: string;
  date: string;
  day: DayOfWeek;
  periodIndex: number;
  absentTeacherId: string;
  absentTeacherName: string;
  classId: string;
  className: string;
  originalSubject: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  status: 'Assigned' | 'Notified' | 'Acknowledged';
}

export interface LessonPlanInput {
  grade: string;
  subject: string;
  unitTopic: string;
  competencyLevel: string;
  periodDuration: number;
  medium: 'English' | 'Sinhala' | 'Tamil';
  additionalNotes?: string;
}

export interface LessonFlowStep {
  step: string;
  timeMinutes: number;
  teacherActivity: string;
  studentActivity: string;
  assessmentPoints: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  grade: string | number;
  subject: string;
  unitTopic: string;
  competencyLevel: string;
  periodDuration: number;
  medium: 'English' | 'Sinhala' | 'Tamil';
  createdAt: string;
  teacherName?: string;
  learningOutcomes: string[];
  tlms: string[];
  lessonFlow: LessonFlowStep[];
  evaluationQuestions: string[];
  differentiatedLearning: {
    remedialTasks: string[];
    enrichmentTasks: string[];
  };
  teacherReflection: string;
}

export interface Student {
  id: string;
  classId: string;
  indexNumber: string;
  name: string;
  gender: 'Male' | 'Female';
}

export interface MarkRecord {
  id: string;
  studentId: string;
  classId: string;
  term: 1 | 2 | 3;
  subjects: Record<string, number>;
  totalMarks: number;
  average: number;
  rank: number;
  gradeSummary: Record<'A' | 'B' | 'C' | 'S' | 'F', number>;
}

export type LeaveType = 'Casual' | 'Rest / Medical' | 'Duty' | 'Special';

export interface LeaveRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  nominatedSubstituteId?: string;
  nominatedSubstituteName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface LeaveBalance {
  casualTotal: number;
  casualUsed: number;
  restTotal: number;
  restUsed: number;
  dutyUsed: number;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  school: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  school: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
  medium: 'English' | 'Sinhala' | 'Tamil' | 'All';
  resourceType: 'Exam Paper' | 'Lesson Plan' | 'Worksheet' | 'Teaching Guide' | 'Discussion';
  attachmentName?: string;
  likesCount: number;
  likedBy: string[];
  comments: CommunityComment[];
  bookmarkedBy: string[];
  createdAt: string;
}

// === Production Community Hub Types matching Supabase Schema ===

export type DiscussionCategory = 'General' | 'Subject Discussions' | 'Question Papers' | 'School Circulars';

export interface CommunityPostRecord {
  id: string;
  user_id: string;
  author_name: string;
  author_role?: string;
  school_name: string;
  title?: string;
  content: string;
  category: DiscussionCategory;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  likes_count?: number;
  liked_by?: string[];
}

export type ResourceTypeCategory = 'Worksheets' | 'Question Papers' | 'Notes & PDFs';

export interface CommunityResourceRecord {
  id: string;
  user_id: string;
  author_name: string;
  school_name: string;
  title: string;
  resource_type: ResourceTypeCategory;
  file_url: string;
  file_name?: string;
  file_size?: string;
  created_at: string;
}

export type AnnouncementCategory = 'Circular' | 'Meeting' | 'Policy' | 'Event';

export interface AnnouncementRecord {
  id: string;
  title: string;
  category: AnnouncementCategory;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  date: string;
  issuer?: string;
}

export interface TeacherConnectionRecord {
  id?: string;
  requester_id: string;
  receiver_id: string;
  status: 'connected' | 'pending' | 'rejected';
  created_at?: string;
}

export interface DirectMessageRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

export interface CommunityTeacherProfile {
  id: string;
  name: string;
  schoolName: string;
  district?: string;
  subject: string;
  role: string;
  avatarUrl?: string;
  isConnected?: boolean;
}
