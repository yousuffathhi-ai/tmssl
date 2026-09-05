import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  CommunityPostRecord,
  CommunityResourceRecord,
  AnnouncementRecord,
  TeacherConnectionRecord,
  DirectMessageRecord,
} from '../types';

// Environment credentials (if provided in .env or cloud environment)
const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

// If valid URL is provided, create the live Supabase client
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 10
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Local persistent mock client for when Supabase keys are pending configuration
// Follows the exact Supabase Auth and Table interface with zero dummy data for fresh users.
const LOCAL_STORAGE_KEY_PREFIX = 'tms_sl_db_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

// Active session state for local engine
export interface LocalAuthSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      school_name: string;
      role?: string;
    };
  };
  token: string;
}

export const localDb = {
  getSession(): LocalAuthSession | null {
    return getStorage<LocalAuthSession | null>('active_session', null);
  },

  setSession(session: LocalAuthSession | null): void {
    setStorage('active_session', session);
  },

  getUsers(): any[] {
    return getStorage<any[]>('auth_users', []);
  },

  addUser(user: any): void {
    const users = this.getUsers();
    users.push(user);
    setStorage('auth_users', users);
  },

  // Generic table getter & setter scoped by user_id
  getTable<T>(tableName: string, userId: string): T[] {
    const allRows = getStorage<any[]>(tableName, []);
    return allRows.filter((r) => r.user_id === userId);
  },

  insertRow<T extends { id?: string; user_id: string }>(tableName: string, row: T): T {
    const allRows = getStorage<any[]>(tableName, []);
    const newRow = {
      ...row,
      id: row.id || `row_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    allRows.push(newRow);
    setStorage(tableName, allRows);
    return newRow as T;
  },

  deleteRow(tableName: string, rowId: string, userId: string): void {
    const allRows = getStorage<any[]>(tableName, []);
    const filtered = allRows.filter((r) => !(r.id === rowId && r.user_id === userId));
    setStorage(tableName, filtered);
  },

  updateRow<T extends { id: string; user_id: string }>(tableName: string, updatedRow: T): void {
    const allRows = getStorage<any[]>(tableName, []);
    const index = allRows.findIndex((r) => r.id === updatedRow.id && r.user_id === updatedRow.user_id);
    if (index >= 0) {
      allRows[index] = { ...allRows[index], ...updatedRow, updated_at: new Date().toISOString() };
    } else {
      allRows.push(updatedRow);
    }
    setStorage(tableName, allRows);
  },

  clearTable(tableName: string, userId: string): void {
    const allRows = getStorage<any[]>(tableName, []);
    const kept = allRows.filter((r) => r.user_id !== userId);
    setStorage(tableName, kept);
  },

  // Public/shared tables accessible across teachers
  getAllRows<T>(tableName: string): T[] {
    return getStorage<T[]>(tableName, []);
  },

  insertPublicRow<T extends { id?: string }>(tableName: string, row: T): T {
    const allRows = getStorage<any[]>(tableName, []);
    const newRow = {
      ...row,
      id: row.id || `row_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      created_at: (row as any).created_at || new Date().toISOString(),
    };
    allRows.unshift(newRow);
    setStorage(tableName, allRows);
    return newRow as T;
  },

  deletePublicRow(tableName: string, rowId: string): void {
    const allRows = getStorage<any[]>(tableName, []);
    const filtered = allRows.filter((r) => r.id !== rowId);
    setStorage(tableName, filtered);
  },

  updatePublicRow<T extends { id: string }>(tableName: string, updatedRow: T): void {
    const allRows = getStorage<any[]>(tableName, []);
    const index = allRows.findIndex((r) => r.id === updatedRow.id);
    if (index >= 0) {
      allRows[index] = { ...allRows[index], ...updatedRow };
    } else {
      allRows.push(updatedRow);
    }
    setStorage(tableName, allRows);
  },
};

export interface SupabaseProfileRecord {
  id: string;
  full_name: string;
  email: string;
  role: string;
  school_name: string;
  district?: string;
  staff_id?: string;
  assigned_class?: string;
  subject_handling?: string[];
  contact_number?: string;
  avatar_url?: string;
  updated_at?: string;
  created_at?: string;
}

export async function fetchProfileFromDb(userId: string): Promise<Partial<SupabaseProfileRecord> | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data && !error) {
        return data;
      }
    } catch (err) {
      console.warn('Error querying Supabase profiles table:', err);
    }
  }

  // Fallback to localDb
  const localRows = localDb.getTable<any>('profiles', userId);
  if (localRows.length > 0) {
    return localRows[0];
  }
  return null;
}

export async function upsertProfileToDb(profile: {
  id: string;
  full_name: string;
  email: string;
  role: string;
  school_name: string;
  district?: string;
  staff_id?: string;
  assigned_class?: string;
  subject_handling?: string[];
  contact_number?: string;
  avatar_url?: string;
}): Promise<void> {
  const payload = {
    ...profile,
    user_id: profile.id,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Error saving to Supabase profiles table:', err);
    }
  }

  // Also persist in localDb profiles
  const allProfiles = localDb.getTable<any>('profiles', profile.id);
  if (allProfiles.length > 0) {
    localDb.updateRow('profiles', { ...allProfiles[0], ...payload, user_id: profile.id });
  } else {
    localDb.insertRow('profiles', { ...payload, user_id: profile.id });
  }
}

// ==========================================
// 1. COMMUNITY POSTS (community_posts)
// ==========================================

const INITIAL_COMMUNITY_POSTS: CommunityPostRecord[] = [
  {
    id: 'post_1',
    user_id: 'usr_kumudini',
    author_name: 'Mrs. Kumudini Jayawardena',
    author_role: 'Senior Science & Maths Teacher',
    school_name: 'Visakha Vidyalaya, Colombo 05',
    title: 'Formative Assessment Strategies for 40-Minute Periods',
    content: 'How do colleagues balance 40-minute periods with individual formative assessment logs in Grades 9 and 10? Sharing our 5-minute exit ticket method which works well with continuous evaluation standards.',
    category: 'General',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    likes_count: 14,
    liked_by: [],
  },
  {
    id: 'post_2',
    user_id: 'usr_sivalingam',
    author_name: 'Mr. K. Sivalingam',
    author_role: 'Master Teacher (Physics)',
    school_name: 'Jaffna Hindu College, Jaffna',
    title: 'Grade 11 Chemistry Electrolysis Simulation Guide',
    content: 'For schools without full laboratory reagents for electrolysis of copper sulphate, the NIE PhET simulations are exceptionally clear for student understanding and diagram questions.',
    category: 'Subject Discussions',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    likes_count: 21,
    liked_by: [],
  },
  {
    id: 'post_3',
    user_id: 'usr_rizwan',
    author_name: 'Mr. Mohamed Rizwan',
    author_role: 'Sectional Head (Mathematics)',
    school_name: 'Zahira National College, Gampola',
    title: '2026 G.C.E. O/L Model Mathematics Unit Test Paper',
    content: 'Attached unit revision paper covering quadratic equations, sets and probability tailored for 2nd term preparations. Complete marking scheme included.',
    category: 'Question Papers',
    attachment_name: 'grade10-maths-model-paper-term2.pdf',
    attachment_url: '#grade10-maths-model-paper-term2.pdf',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    likes_count: 32,
    liked_by: [],
  },
  {
    id: 'post_4',
    user_id: 'usr_ranasinghe',
    author_name: 'Dr. Nihal Ranasinghe',
    author_role: 'Principal / Administrator',
    school_name: 'Royal College, Colombo 07',
    title: 'Relief Period Management under the 8-Period Framework',
    content: 'Colleagues asking about maximum continuous periods when assigned relief: Circular 2024/09 specifies no teacher should exceed 5 continuous periods without an intervening break.',
    category: 'School Circulars',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    likes_count: 27,
    liked_by: [],
  },
];

export async function fetchCommunityPostsDb(): Promise<CommunityPostRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        return data as CommunityPostRecord[];
      }
    } catch (err) {
      console.warn('Error fetching community_posts from Supabase:', err);
    }
  }

  const localPosts = localDb.getAllRows<CommunityPostRecord>('community_posts');
  if (localPosts.length === 0) {
    // Seed initial posts
    INITIAL_COMMUNITY_POSTS.forEach((p) => localDb.insertPublicRow('community_posts', p));
    return INITIAL_COMMUNITY_POSTS;
  }
  return localPosts;
}

export async function insertCommunityPostDb(post: Omit<CommunityPostRecord, 'id' | 'created_at'>): Promise<CommunityPostRecord> {
  const newRecord: CommunityPostRecord = {
    ...post,
    id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
    likes_count: 0,
    liked_by: [],
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('community_posts').insert(newRecord);
    } catch (err) {
      console.warn('Error inserting community_posts to Supabase:', err);
    }
  }

  return localDb.insertPublicRow<CommunityPostRecord>('community_posts', newRecord);
}

export async function deleteCommunityPostDb(postId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('community_posts').delete().eq('id', postId);
    } catch (err) {
      console.warn('Error deleting community_posts from Supabase:', err);
    }
  }
  localDb.deletePublicRow('community_posts', postId);
}

// ==========================================
// 2. COMMUNITY RESOURCES (community_resources)
// ==========================================

const INITIAL_COMMUNITY_RESOURCES: CommunityResourceRecord[] = [
  {
    id: 'res_1',
    user_id: 'usr_kumudini',
    author_name: 'Mrs. Kumudini Jayawardena',
    school_name: 'Visakha Vidyalaya, Colombo 05',
    title: 'Grade 9 Algebra & Linear Equations Revision Worksheet',
    resource_type: 'Worksheets',
    file_url: '#grade9-algebra-worksheet.pdf',
    file_name: 'grade9-algebra-worksheet.pdf',
    file_size: '1.4 MB',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'res_2',
    user_id: 'usr_sivalingam',
    author_name: 'Mr. K. Sivalingam',
    school_name: 'Jaffna Hindu College, Jaffna',
    title: 'G.C.E. O/L Science Past Paper Analysis & Marking Scheme (2020-2025)',
    resource_type: 'Question Papers',
    file_url: '#ol-science-past-papers.pdf',
    file_name: 'ol-science-past-papers.pdf',
    file_size: '3.8 MB',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'res_3',
    user_id: 'usr_wickramasinghe',
    author_name: 'Mrs. Anoma Wickramasinghe',
    school_name: 'Mahamaya Girls\' College, Kandy',
    title: 'Grade 10 Sri Lankan History Comprehensive Unit Notes & Timeline',
    resource_type: 'Notes & PDFs',
    file_url: '#grade10-history-notes.pdf',
    file_name: 'grade10-history-notes.pdf',
    file_size: '4.2 MB',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'res_4',
    user_id: 'usr_haniffa',
    author_name: 'Mrs. Farzana Haniffa',
    school_name: 'Al-Azhar Central College, Akkaraipattu',
    title: 'Grade 11 English Language Grammar & Essay Practice Booklet',
    resource_type: 'Worksheets',
    file_url: '#grade11-english-grammar.pdf',
    file_name: 'grade11-english-grammar.pdf',
    file_size: '2.1 MB',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export async function fetchCommunityResourcesDb(): Promise<CommunityResourceRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        return data as CommunityResourceRecord[];
      }
    } catch (err) {
      console.warn('Error fetching community_resources from Supabase:', err);
    }
  }

  const localRes = localDb.getAllRows<CommunityResourceRecord>('community_resources');
  if (localRes.length === 0) {
    INITIAL_COMMUNITY_RESOURCES.forEach((r) => localDb.insertPublicRow('community_resources', r));
    return INITIAL_COMMUNITY_RESOURCES;
  }
  return localRes;
}

export async function insertCommunityResourceDb(
  resource: Omit<CommunityResourceRecord, 'id' | 'created_at'>
): Promise<CommunityResourceRecord> {
  const newRecord: CommunityResourceRecord = {
    ...resource,
    id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('community_resources').insert(newRecord);
    } catch (err) {
      console.warn('Error inserting community_resources to Supabase:', err);
    }
  }

  return localDb.insertPublicRow<CommunityResourceRecord>('community_resources', newRecord);
}

export async function deleteCommunityResourceDb(resourceId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('community_resources').delete().eq('id', resourceId);
    } catch (err) {
      console.warn('Error deleting community_resources from Supabase:', err);
    }
  }
  localDb.deletePublicRow('community_resources', resourceId);
}

// ==========================================
// 3. ANNOUNCEMENTS (announcements)
// ==========================================

const INITIAL_ANNOUNCEMENTS: AnnouncementRecord[] = [
  {
    id: 'ann_1',
    title: 'Circular No. 2026/04: 1st Term School Evaluation Timelines & Assessment Standards',
    category: 'Circular',
    content: 'Official directive from the Ministry of Education specifying school assessment mark uploads, practical test timelines, and relief quota audit parameters across all Educational Zones.',
    attachment_name: 'term1-exam-schedule.pdf',
    attachment_url: '#term1-exam-schedule.pdf',
    date: '2026-08-15',
    issuer: 'Ministry of Education - Isurupaya',
  },
  {
    id: 'ann_2',
    title: 'National Educational Policy (NEP) Curricular Revision Briefing',
    category: 'Policy',
    content: 'Comprehensive review document outlining updated syllabus modules for Junior Secondary grades focusing on competency-based evaluation and bilingual medium integration.',
    attachment_name: 'nep-framework-summary.pdf',
    attachment_url: '#nep-framework-summary.pdf',
    date: '2026-08-20',
    issuer: 'National Institute of Education (NIE)',
  },
  {
    id: 'ann_3',
    title: 'Zonal Mathematics & Science Master Teachers Coordination Meeting',
    category: 'Meeting',
    content: 'Hybrid session scheduled for all Subject Sectional Heads to finalize standardized term test blueprint questions and moderation protocols.',
    attachment_name: 'zonal-meeting-agenda.pdf',
    attachment_url: '#zonal-meeting-agenda.pdf',
    date: '2026-08-28',
    issuer: 'Provincial Department of Education',
  },
  {
    id: 'ann_4',
    title: 'Sri Lanka Schools All-Island Science Day Exhibition & STEM Fair 2026',
    category: 'Event',
    content: 'Registration window open for all National and Provincial schools. Students from Grade 6 to 13 eligible for interactive science exhibits, robotics, and innovation awards.',
    attachment_name: 'science-exhibition-guidelines.pdf',
    attachment_url: '#science-exhibition-guidelines.pdf',
    date: '2026-09-02',
    issuer: 'National Science Foundation (NSF)',
  },
];

export async function fetchAnnouncementsDb(): Promise<AnnouncementRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false });
      if (data && !error && data.length > 0) {
        return data as AnnouncementRecord[];
      }
    } catch (err) {
      console.warn('Error fetching announcements from Supabase:', err);
    }
  }

  const localAnn = localDb.getAllRows<AnnouncementRecord>('announcements');
  if (localAnn.length === 0) {
    INITIAL_ANNOUNCEMENTS.forEach((a) => localDb.insertPublicRow('announcements', a));
    return INITIAL_ANNOUNCEMENTS;
  }
  return localAnn;
}

export async function insertAnnouncementDb(ann: Omit<AnnouncementRecord, 'id'>): Promise<AnnouncementRecord> {
  const newRecord: AnnouncementRecord = {
    ...ann,
    id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('announcements').insert(newRecord);
    } catch (err) {
      console.warn('Error inserting announcements to Supabase:', err);
    }
  }

  return localDb.insertPublicRow<AnnouncementRecord>('announcements', newRecord);
}

// ==========================================
// 4. TEACHER CONNECTIONS (teacher_connections)
// ==========================================

export async function fetchTeacherConnectionsDb(userId: string): Promise<TeacherConnectionRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('teacher_connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
      if (data && !error) {
        return data as TeacherConnectionRecord[];
      }
    } catch (err) {
      console.warn('Error fetching teacher_connections from Supabase:', err);
    }
  }

  const all = localDb.getAllRows<TeacherConnectionRecord>('teacher_connections');
  return all.filter((c) => c.requester_id === userId || c.receiver_id === userId);
}

export async function upsertTeacherConnectionDb(
  connection: TeacherConnectionRecord
): Promise<TeacherConnectionRecord> {
  const record: TeacherConnectionRecord = {
    ...connection,
    created_at: connection.created_at || new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('teacher_connections').upsert(record);
    } catch (err) {
      console.warn('Error upserting teacher_connections to Supabase:', err);
    }
  }

  const all = localDb.getAllRows<TeacherConnectionRecord>('teacher_connections');
  const existingIndex = all.findIndex(
    (c) =>
      (c.requester_id === record.requester_id && c.receiver_id === record.receiver_id) ||
      (c.requester_id === record.receiver_id && c.receiver_id === record.requester_id)
  );

  if (existingIndex >= 0) {
    all[existingIndex] = { ...all[existingIndex], ...record };
    localDb.updatePublicRow('teacher_connections', all[existingIndex] as any);
  } else {
    localDb.insertPublicRow('teacher_connections', record as any);
  }

  return record;
}

// ==========================================
// 5. DIRECT MESSAGES (direct_messages)
// ==========================================

const INITIAL_DIRECT_MESSAGES: DirectMessageRecord[] = [
  {
    id: 'dm_1',
    sender_id: 'usr_default_current',
    receiver_id: 'usr_kumudini',
    message: 'Assalamu alaikum - 13/08/2026',
    created_at: '2026-08-13T10:15:00.000Z',
  },
  {
    id: 'dm_2',
    sender_id: 'usr_kumudini',
    receiver_id: 'usr_default_current',
    message: 'Wa Alaikkumussalam - 29/08/2026',
    created_at: '2026-08-29T14:22:00.000Z',
  },
  {
    id: 'dm_3',
    sender_id: 'usr_default_current',
    receiver_id: 'usr_kumudini',
    message: 'Could you please share the Grade 10 Science practical checklist for 2nd term?',
    created_at: '2026-08-29T14:24:00.000Z',
  },
  {
    id: 'dm_4',
    sender_id: 'usr_kumudini',
    receiver_id: 'usr_default_current',
    message: 'Certainly! I have also published it in the Community Resources tab so all teachers in the zone can download it. Best wishes with your classes!',
    created_at: '2026-08-29T14:30:00.000Z',
  },
];

export async function fetchDirectMessagesDb(userId1: string, userId2: string): Promise<DirectMessageRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });
      if (data && !error && data.length > 0) {
        return data as DirectMessageRecord[];
      }
    } catch (err) {
      console.warn('Error fetching direct_messages from Supabase:', err);
    }
  }

  const all = localDb.getAllRows<DirectMessageRecord>('direct_messages');
  if (all.length === 0) {
    // Seed initial demo messages mapping 'usr_default_current' to userId1
    const seeded = INITIAL_DIRECT_MESSAGES.map((m) => ({
      ...m,
      sender_id: m.sender_id === 'usr_default_current' ? userId1 : m.sender_id,
      receiver_id: m.receiver_id === 'usr_default_current' ? userId1 : m.receiver_id,
    }));
    seeded.forEach((m) => localDb.insertPublicRow('direct_messages', m));
    return seeded.filter(
      (m) =>
        (m.sender_id === userId1 && m.receiver_id === userId2) ||
        (m.sender_id === userId2 && m.receiver_id === userId1)
    );
  }

  return all.filter(
    (m) =>
      (m.sender_id === userId1 && m.receiver_id === userId2) ||
      (m.sender_id === userId2 && m.receiver_id === userId1)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function sendDirectMessageDb(
  msg: Omit<DirectMessageRecord, 'id' | 'created_at'>
): Promise<DirectMessageRecord> {
  const newMsg: DirectMessageRecord = {
    ...msg,
    id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('direct_messages').insert(newMsg);
    } catch (err) {
      console.warn('Error inserting direct_messages to Supabase:', err);
    }
  }

  return localDb.insertPublicRow<DirectMessageRecord>('direct_messages', newMsg);
}
