export type AppLanguage = 'en' | 'si' | 'ta';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    si: string;
    ta: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  dashboard: {
    en: 'Dashboard',
    si: 'පාලක පුවරුව',
    ta: 'கட்டுப்பாட்டு பலகை',
  },
  timetable: {
    en: 'Timetable Maker',
    si: 'කාලසටහන් සකසනය',
    ta: 'நேர அட்டவணை தயாரிப்பாளர்',
  },
  'lesson-plan': {
    en: 'AI Lesson Plan',
    si: 'AI පාඩම් සැලසුම්කරු',
    ta: 'AI பாடத் திட்டம்',
  },
  marks: {
    en: 'Marks Analyser',
    si: 'ලකුණු විශ්ලේෂකය',
    ta: 'மதிப்பெண் ஆய்வாளர்',
  },
  leaves: {
    en: 'My Leaves & Attendance',
    si: 'මගේ නිවාඩු සහ පැමිණීම',
    ta: 'எனது விடுப்பு & வருகை',
  },
  community: {
    en: 'Community Hub',
    si: 'ගුරු ප්‍රජාව',
    ta: 'ஆசிரியர் சமூகம்',
  },
  profile: {
    en: 'Teacher Profile',
    si: 'ගුරු පැතිකඩ',
    ta: 'ஆசிரியர் சுயவிவரம்',
  },

  // App & Header
  appTitle: {
    en: 'TMS SL',
    si: 'ටී.එම්.එස් ශ්‍රී ලංකා',
    ta: 'டி.எம்.எஸ் இலங்கை',
  },
  appSubtitle: {
    en: 'Sri Lanka School System',
    si: 'ශ්‍රී ලංකා පාසල් පද්ධතිය',
    ta: 'இலங்கை பாடசாலை முறைமை',
  },
  schoolInstitute: {
    en: 'School Institute',
    si: 'පාසල් ආයතනය',
    ta: 'பாடசாலை நிறுவனம்',
  },
  setSchoolPrompt: {
    en: 'Set School in Profile',
    si: 'පැතිකඩෙහි පාසල ඇතුළත් කරන්න',
    ta: 'சுயவிவரத்தில் பாடசாலையை அமைக்கவும்',
  },
  quickLoadSample: {
    en: 'Load Sample Data',
    si: 'ආදර්ශ දත්ත පූරණය',
    ta: 'மாதிரித் தரவை ஏற்று',
  },
  resetData: {
    en: 'Reset',
    si: 'නැවත සකසන්න',
    ta: 'மீட்டமைக்க',
  },
  lightMode: {
    en: 'Light Mode',
    si: 'ලා පැහැය',
    ta: 'பகல் முறைமை',
  },
  darkMode: {
    en: 'Dark Mode',
    si: 'අඳුරු පැහැය',
    ta: 'இருள் முறைமை',
  },
  switchToLight: {
    en: 'Switch to Light Mode',
    si: 'ලා පැහැයට මාරු වන්න',
    ta: 'வெளிச்ச முறைமைக்கு மாறுக',
  },
  switchToDark: {
    en: 'Switch to Dark Mode',
    si: 'අඳුරු පැහැයට මාරු වන්න',
    ta: 'இருள் முறைமைக்கு மாறுக',
  },
  language: {
    en: 'Language',
    si: 'භාෂාව',
    ta: 'மொழி',
  },

  // Roles
  rolePrincipal: {
    en: 'Principal (Admin)',
    si: 'විදුහල්පති (පරිපාලක)',
    ta: 'அதிபர் (நிர்வாகி)',
  },
  roleCreator: {
    en: 'Timetable Creator',
    si: 'කාලසටහන් නිර්මාපක',
    ta: 'நேர அட்டவணை உருவாக்குநர்',
  },
  roleTeacher: {
    en: 'Teacher (Read-Only)',
    si: 'ගුරුභවතා (කියවීම පමණි)',
    ta: 'ஆசிரியர் (பார்வை மட்டும்)',
  },

  // Common Actions
  generate: {
    en: 'Generate',
    si: 'ජනනය කරන්න',
    ta: 'உருவாக்குக',
  },
  save: {
    en: 'Save',
    si: 'සුරකින්න',
    ta: 'சேமிக்க',
  },
  saveMarks: {
    en: 'Save Marks',
    si: 'ලකුණු සුරකින්න',
    ta: 'மதிப்பெண்களை சேமிக்க',
  },
  downloadPdf: {
    en: 'Download PDF',
    si: 'PDF බාගත කරන්න',
    ta: 'PDF பதிவிறக்குக',
  },
  exportPptx: {
    en: 'Export PPTX (10 Slides)',
    si: 'PPTX අපනයනය (Slides 10)',
    ta: 'PPTX ஏற்றுமதி (10 பக்கங்கள்)',
  },
  exportExcel: {
    en: 'Export Excel',
    si: 'Excel අපනයනය',
    ta: 'Excel ஏற்றுமதி',
  },
  print: {
    en: 'Print',
    si: 'මුද්‍රණය කරන්න',
    ta: 'அச்சிடுக',
  },
  addStudent: {
    en: 'Add Student',
    si: 'සිසුවෙකු එක් කරන්න',
    ta: 'மாணவரைச் சேர்க்க',
  },
  term: {
    en: 'Term',
    si: 'වාරය',
    ta: 'தவணை',
  },
  term1: {
    en: 'Term 1',
    si: '1 වන වාරය',
    ta: '1ம் தவணை',
  },
  term2: {
    en: 'Term 2',
    si: '2 වන වාරය',
    ta: '2ம் தவணை',
  },
  term3: {
    en: 'Term 3',
    si: '3 වන වාරය',
    ta: '3ம் தவணை',
  },
  classAverage: {
    en: 'Class Average',
    si: 'පන්ති සාමාන්‍යය',
    ta: 'வகுப்பு சராசரி',
  },
  passRate: {
    en: 'Overall Pass Rate',
    si: 'සමස්ත සමත් අනුපාතය',
    ta: 'மொத்த சித்தி வீதம்',
  },
  highestScore: {
    en: 'Highest Score',
    si: 'ඉහළම ලකුණ',
    ta: 'உயர் புள்ளி',
  },
  remedialFocus: {
    en: 'Remedial Focus',
    si: 'ප්‍රතිකර්ම ඉගැන්වීම්',
    ta: 'பரிகாரக் கவனம்',
  },
  gradeDistribution: {
    en: 'Grade Distribution',
    si: 'ශ්‍රේණි ව්‍යාප්තිය',
    ta: 'தரப் பரம்பல்',
  },
  performanceCharts: {
    en: 'Performance Charts',
    si: 'කාර්යසාධන ප්‍රස්තාර',
    ta: 'செயல்திறன் வரைபடங்கள்',
  },
  marksSpreadsheet: {
    en: 'Marks Spreadsheet',
    si: 'ලකුණු ලේඛනය',
    ta: 'மதிப்பெண் விரிதாள்',
  },
  reportCard: {
    en: 'Report Card (A4)',
    si: 'ප්‍රගති වාර්තාව (A4)',
    ta: 'முன்னேற்ற அறிக்கை (A4)',
  },
  roster: {
    en: 'Class Roster',
    si: 'සිසු නාමාවලිය',
    ta: 'மாணவர் பட்டியல்',
  },
  lessonPlanGenerator: {
    en: 'AI Lesson Note Generator',
    si: 'AI පාඩම් සටහන් සකසනය',
    ta: 'AI பாடக்குறிப்பு தயாரிப்பாளர்',
  },
  lessonPlanArchive: {
    en: 'Lesson Plans Archive',
    si: 'සුරැකි පාඩම් සැලසුම්',
    ta: 'சேமிக்கப்பட்ட பாடத்திட்டங்கள்',
  },
};

/**
 * Translates a key based on active language, falling back to English.
 */
export function getTranslation(key: string, lang: AppLanguage = 'en'): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  if (translations[key] && translations[key].en) {
    return translations[key].en;
  }
  return key;
}
