import { PeriodDefinition, DayOfWeek } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const SRI_LANKAN_PERIODS: PeriodDefinition[] = [
  { periodIndex: 1, startTime: '07:50 AM', endTime: '08:30 AM', label: 'Period 1' },
  { periodIndex: 2, startTime: '08:30 AM', endTime: '09:10 AM', label: 'Period 2' },
  { periodIndex: 3, startTime: '09:10 AM', endTime: '09:50 AM', label: 'Period 3' },
  { periodIndex: 4, startTime: '09:50 AM', endTime: '10:30 AM', label: 'Period 4' },
  // Interval 10:30 AM - 10:50 AM
  { periodIndex: 5, startTime: '10:50 AM', endTime: '11:30 AM', label: 'Period 5' },
  { periodIndex: 6, startTime: '11:30 AM', endTime: '12:10 PM', label: 'Period 6' },
  { periodIndex: 7, startTime: '12:10 PM', endTime: '12:50 PM', label: 'Period 7' },
  { periodIndex: 8, startTime: '12:50 PM', endTime: '01:30 PM', label: 'Period 8' },
];

export const SRI_LANKA_CURRICULUM_SUBJECTS: Record<string, string[]> = {
  'Junior Secondary (Grades 6-9)': [
    'Mathematics',
    'Science',
    'English Language',
    'Sinhala / Tamil (1st Lang)',
    'History',
    'Buddhism / Islam / Hinduism / Christianity',
    'Geography',
    'Civics Education',
    'Health & Physical Education',
    'Practical & Technical Skills (PTS)',
    'Aesthetic Subjects (Art/Music/Dance)',
    'Second National Language',
    'Information & Communication Technology (ICT)',
  ],
  'O/Level (Grades 10-11)': [
    'Mathematics',
    'Science',
    'English Language',
    'Sinhala / Tamil Language & Lit',
    'History',
    'Religion (Buddhism/Islam/Hinduism/Christianity)',
    'Business & Accounting Studies',
    'Geography',
    'Civics Education',
    'Information & Communication Technology (ICT)',
    'Eastern / Western Music',
    'Art & Design',
    'Dancing',
    'Drama & Theatre',
    'English Literature',
    'Agriculture & Food Technology',
    'Home Economics',
    'Design & Technology',
  ],
  'A/Level (Grades 12-13)': [
    'Combined Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Agricultural Science',
    'Accounting',
    'Business Studies',
    'Economics',
    'Information & Communication Technology (ICT)',
    'Engineering Technology',
    'Bio-systems Technology',
    'Science for Technology (SFT)',
    'Sinhala Literature',
    'Tamil Literature',
    'English Literature',
    'Political Science',
    'Logic & Scientific Method',
    'Buddhist Civilization',
    'General English',
    'Common General Test',
  ],
};

// Flattened list of unique subjects
export const SRI_LANKA_SUBJECT_LIST: string[] = Array.from(
  new Set(Object.values(SRI_LANKA_CURRICULUM_SUBJECTS).flat())
);

export function calculateSriLankanGrade(mark: number): 'A' | 'B' | 'C' | 'S' | 'F' {
  if (mark >= 75) return 'A';
  if (mark >= 65) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 35) return 'S';
  return 'F';
}

export function getGradeColorClass(grade: 'A' | 'B' | 'C' | 'S' | 'F' | string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    case 'C':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    case 'S':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
    case 'F':
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }
}

export function getGradeLabel(mark: number): { grade: 'A' | 'B' | 'C' | 'S' | 'F'; title: string; color: string } {
  if (mark >= 75) return { grade: 'A', title: 'Distinction', color: 'text-emerald-600 dark:text-emerald-400' };
  if (mark >= 65) return { grade: 'B', title: 'Very Good', color: 'text-blue-600 dark:text-blue-400' };
  if (mark >= 50) return { grade: 'C', title: 'Credit', color: 'text-amber-600 dark:text-amber-400' };
  if (mark >= 35) return { grade: 'S', title: 'Simple Pass', color: 'text-indigo-600 dark:text-indigo-400' };
  return { grade: 'F', title: 'Fail / Weak', color: 'text-red-600 dark:text-red-400' };
}

export const SRI_LANKA_HOLIDAYS = [
  { date: '2026-01-14', name: 'Tamil Thai Pongal Day', type: 'Public & Bank' },
  { date: '2026-02-04', name: 'National Independence Day', type: 'National Holiday' },
  { date: '2026-02-15', name: 'Maha Sivarathri Day', type: 'Public & Bank' },
  { date: '2026-03-20', name: 'Id-Ul-Fitr (Ramazan Festival)', type: 'Public & Bank' },
  { date: '2026-04-13', name: 'Sinhala & Tamil New Year Eve', type: 'School Vacation' },
  { date: '2026-04-14', name: 'Sinhala & Tamil New Year Day', type: 'School Vacation' },
  { date: '2026-05-01', name: 'May Day (Workers Day)', type: 'Public & Bank' },
  { date: '2026-05-01', name: 'Vesak Full Moon Poya Day', type: 'Religious & School' },
  { date: '2026-05-02', name: 'Day following Vesak Poya', type: 'School Holiday' },
  { date: '2026-06-29', name: 'Poson Full Moon Poya Day', type: 'Religious' },
  { date: '2026-10-31', name: 'Deepavali Festival Day', type: 'Public & Bank' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'School Vacation' },
];

export const SCHOOL_TERM_DATES = [
  { term: 'Term 1', start: '2026-01-05', end: '2026-04-10', exams: '2026-03-25 to 2026-04-08' },
  { term: 'Term 2', start: '2026-04-27', end: '2026-08-14', exams: '2026-07-28 to 2026-08-12' },
  { term: 'Term 3', start: '2026-09-01', end: '2026-12-04', exams: '2026-11-18 to 2026-12-02' },
];
