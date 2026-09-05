import React, { useState, useEffect } from 'react';
import { UserProfile, CommunityTeacherProfile, TeacherConnectionRecord } from '../../types';
import {
  fetchTeacherConnectionsDb,
  upsertTeacherConnectionDb,
} from '../../lib/supabase';
import { DirectChatModal } from './DirectChatModal';
import {
  Users,
  Search,
  School,
  MessageSquare,
  UserPlus,
  Check,
  Sparkles,
  BookOpen,
  GraduationCap,
  MapPin,
  Radio,
} from 'lucide-react';

const BASE_SRI_LANKA_TEACHERS: CommunityTeacherProfile[] = [
  {
    id: 'usr_kumudini',
    name: 'Mrs. Kumudini Jayawardena',
    schoolName: 'Visakha Vidyalaya, Colombo 05',
    district: 'Colombo',
    subject: 'Science & Mathematics',
    role: 'Senior Master Teacher',
    isConnected: true,
  },
  {
    id: 'usr_rizwan',
    name: 'Mr. Mohamed Rizwan',
    schoolName: 'Zahira National College, Gampola',
    district: 'Kandy',
    subject: 'Mathematics',
    role: 'Sectional Head',
    isConnected: true,
  },
  {
    id: 'usr_sivalingam',
    name: 'Mr. K. Sivalingam',
    schoolName: 'Jaffna Hindu College, Jaffna',
    district: 'Jaffna',
    subject: 'Science & Physics',
    role: 'Master Teacher',
    isConnected: false,
  },
  {
    id: 'usr_wickramasinghe',
    name: 'Mrs. Anoma Wickramasinghe',
    schoolName: "Mahamaya Girls' College, Kandy",
    district: 'Kandy',
    subject: 'History & Social Studies',
    role: 'Senior Teacher',
    isConnected: false,
  },
  {
    id: 'usr_haniffa',
    name: 'Mrs. Farzana Haniffa',
    schoolName: 'Al-Azhar Central College, Akkaraipattu',
    district: 'Ampara',
    subject: 'English Language',
    role: 'English Sectional Lead',
    isConnected: false,
  },
  {
    id: 'usr_bandara',
    name: 'Mr. Chandana Bandara',
    schoolName: 'Maliyadeva College, Kurunegala',
    district: 'Kurunegala',
    subject: 'Information Technology (ICT)',
    role: 'ICT Coordinator',
    isConnected: false,
  },
  {
    id: 'usr_priyantha',
    name: 'Mr. Priyantha Perera',
    schoolName: 'Richmond College, Galle',
    district: 'Galle',
    subject: 'Commerce & Accounting',
    role: 'Commerce Sectional Head',
    isConnected: false,
  },
  {
    id: 'usr_ranasinghe',
    name: 'Dr. Nihal Ranasinghe',
    schoolName: 'Royal College, Colombo 07',
    district: 'Colombo',
    subject: 'Educational Administration',
    role: 'Principal / SLEAS I',
    isConnected: false,
  },
];

interface TeachersTabProps {
  currentUser: UserProfile | null;
}

export const TeachersTab: React.FC<TeachersTabProps> = ({ currentUser }) => {
  const [teachers, setTeachers] = useState<CommunityTeacherProfile[]>([]);
  const [connections, setConnections] = useState<TeacherConnectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatTeacher, setActiveChatTeacher] = useState<CommunityTeacherProfile | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // Dynamic user channel info
  const dynamicSchoolName = currentUser?.schoolName?.trim() || 'General School';
  const dynamicSubject = currentUser?.subjectHandling?.[0]?.trim() || 'General Subjects';

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!currentUser) return;
      const userConnections = await fetchTeacherConnectionsDb(currentUser.id);

      // Load registered accounts from local storage to include newly registered users in discovery
      let extraTeachers: CommunityTeacherProfile[] = [];
      try {
        const stored = localStorage.getItem('tmssl_registered_users');
        if (stored) {
          const parsed: any[] = JSON.parse(stored);
          extraTeachers = parsed
            .filter(u => u.id !== currentUser.id && !BASE_SRI_LANKA_TEACHERS.some(b => b.id === u.id))
            .map(u => ({
              id: u.id,
              name: u.name,
              schoolName: u.schoolName || 'Government School, Sri Lanka',
              district: u.district || 'Western',
              subject: u.subjectHandling?.[0] || 'General Subjects',
              role: u.role === 'admin' ? 'Principal / Admin' : 'Teacher',
              isConnected: false,
            }));
        }
      } catch (err) {
        console.warn('Error loading registered users:', err);
      }

      const combined = [...BASE_SRI_LANKA_TEACHERS, ...extraTeachers].map(t => {
        // Check if connected in database
        const isConn = userConnections.some(
          c =>
            c.status === 'connected' &&
            ((c.requester_id === currentUser.id && c.receiver_id === t.id) ||
              (c.receiver_id === currentUser.id && c.requester_id === t.id))
        );
        return {
          ...t,
          isConnected: isConn || (t.id === 'usr_kumudini' || t.id === 'usr_rizwan'),
        };
      });

      if (isMounted) {
        setConnections(userConnections);
        setTeachers(combined);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleToggleConnect = async (teacherId: string) => {
    if (!currentUser) return;

    const target = teachers.find(t => t.id === teacherId);
    if (!target) return;

    const newStatus = !target.isConnected;

    // Optimistic UI update
    setTeachers(prev =>
      prev.map(t => (t.id === teacherId ? { ...t, isConnected: newStatus } : t))
    );

    await upsertTeacherConnectionDb({
      requester_id: currentUser.id,
      receiver_id: teacherId,
      status: newStatus ? 'connected' : 'rejected',
    });
  };

  // Connected teachers list
  const connectedTeachers = teachers.filter(t => t.isConnected);

  // Search filtered list for "Find Teachers"
  const filteredTeachers = teachers.filter(t => {
    if (channelFilter === 'school') {
      const matchSchool =
        t.schoolName.toLowerCase().includes(dynamicSchoolName.toLowerCase()) ||
        dynamicSchoolName.toLowerCase().includes(t.schoolName.toLowerCase());
      if (!matchSchool) return false;
    }

    if (channelFilter === 'subject') {
      const matchSub =
        t.subject.toLowerCase().includes(dynamicSubject.toLowerCase()) ||
        dynamicSubject.toLowerCase().includes(t.subject.toLowerCase());
      if (!matchSub) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.schoolName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.district && t.district.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          id="teacher-search-input"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 Search by name, school or subject"
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* 2. Auto-Joined Channels Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Auto-Joined Channels</span>
          </h3>
          <span className="text-[11px] text-slate-400">Connected to your profile</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dynamic School Channel Pill */}
          <button
            id="school-channel-pill"
            onClick={() => setChannelFilter(channelFilter === 'school' ? null : 'school')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              channelFilter === 'school'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100'
            }`}
          >
            <School className="w-3.5 h-3.5 shrink-0" />
            <span>{dynamicSchoolName} · School channel</span>
            {channelFilter === 'school' && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>
            )}
          </button>

          {/* Subject Channel Pill */}
          <button
            id="subject-channel-pill"
            onClick={() => setChannelFilter(channelFilter === 'subject' ? null : 'subject')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              channelFilter === 'subject'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>{dynamicSubject} · Subject channel</span>
            {channelFilter === 'subject' && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>
            )}
          </button>

          {channelFilter && (
            <button
              onClick={() => setChannelFilter(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* 3. My Network Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>My Network</span>
            <span className="text-xs font-normal text-slate-400">({connectedTeachers.length})</span>
          </h3>
        </div>

        {connectedTeachers.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No teachers connected yet. Explore educators in the list below to build your professional network.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectedTeachers.map(teacher => (
              <div
                key={teacher.id}
                id={`network-teacher-${teacher.id}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <School className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.schoolName}</span>
                    </p>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      {teacher.subject}
                    </span>
                  </div>
                </div>

                {/* Chat Icon button [💬] */}
                <button
                  id={`chat-with-teacher-${teacher.id}`}
                  onClick={() => setActiveChatTeacher(teacher)}
                  className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-900/50 transition shrink-0 cursor-pointer"
                  title={`Open direct message with ${teacher.name}`}
                  aria-label="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Find Teachers Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Find Teachers across Sri Lanka</span>
            <span className="text-xs font-normal text-slate-400">({filteredTeachers.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
          {filteredTeachers.map(teacher => {
            const isConn = teacher.isConnected;

            return (
              <div
                key={teacher.id}
                id={`find-teacher-${teacher.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-linear-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.schoolName}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                        {teacher.subject}
                      </span>
                      {teacher.district && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{teacher.district}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Direct Chat Shortcut if connected */}
                  {isConn && (
                    <button
                      onClick={() => setActiveChatTeacher(teacher)}
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                      title="Open Direct Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}

                  {/* Connect / Connected Status Button */}
                  <button
                    id={`connect-btn-${teacher.id}`}
                    onClick={() => handleToggleConnect(teacher.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                      isConn
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isConn ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>✓ Connected</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+👥 Connect</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DIRECT 1-ON-1 CHAT MODAL / SCREEN */}
      {activeChatTeacher && currentUser && (
        <DirectChatModal
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          teacher={activeChatTeacher}
          onClose={() => setActiveChatTeacher(null)}
        />
      )}
    </div>
  );
};
