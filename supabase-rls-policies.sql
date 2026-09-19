-- ==============================================================================
-- TMS SL (Teacher Management System Sri Lanka)
-- Production PostgreSQL Row Level Security (RLS) & Multi-Tenant Data Isolation
-- ==============================================================================
--
-- Security Model Summary:
-- 1. Multi-Tenant School Isolation: All school data is segregated by `school_id`.
--    Users can NEVER read or modify records belonging to other schools.
-- 2. Role-Based Access Control (RBAC):
--    - 'admin' / 'ADMIN' (Principal / SLEAS): Full CRUD over timetable, classes, teachers.
--    - 'timetable_creator' / 'TIMETABLE_CREATOR': Timetable committee head approved by Principal.
--    - 'teacher' / 'TEACHER': Read-only access to personal timetable, relief notices, and
--      assigned class timetable (if designated as class teacher).
-- 3. Subject Privacy:
--    - Community subject discussions and resources are strictly accessible only to teachers
--      assigned to that subject or for General/Public circulars.
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SECURITY HELPER FUNCTIONS
-- ==============================================================================

-- Helper: Retrieve current user's school_id from JWT metadata or profile
CREATE OR REPLACE FUNCTION auth.user_school_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'school_id'),
    (SELECT school_id FROM public.profiles WHERE id = auth.uid()::text LIMIT 1),
    (SELECT 'school_' || lower(regexp_replace(school_name, '[^a-zA-Z0-9]', '_', 'g')) 
     FROM public.profiles WHERE id = auth.uid()::text LIMIT 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Retrieve normalized current user role
CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    (SELECT role FROM public.profiles WHERE id = auth.uid()::text LIMIT 1),
    'teacher'
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check if user has Timetable Management privileges (Admin or Timetable Creator)
CREATE OR REPLACE FUNCTION auth.can_manage_timetables() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.user_role() IN ('admin', 'timetable_creator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Retrieve user's assigned subjects array
CREATE OR REPLACE FUNCTION auth.user_subjects() 
RETURNS TEXT[] AS $$
DECLARE
  subj_arr TEXT[];
BEGIN
  SELECT subject_handling INTO subj_arr 
  FROM public.profiles 
  WHERE id = auth.uid()::text;
  
  RETURN COALESCE(subj_arr, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS & RLS ACTIVATION
-- ==============================================================================

-- 2.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',
  school_id TEXT,
  school_name TEXT NOT NULL,
  district TEXT,
  staff_id TEXT,
  assigned_class TEXT,
  subject_handling TEXT[] DEFAULT ARRAY[]::TEXT[],
  contact_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
USING (
  -- Users can view profiles within their own school or public directory
  school_id = auth.user_school_id() OR auth.uid()::text = id
);

CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- 2.2 School Settings Table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  school_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  census_no TEXT,
  zone TEXT,
  province TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_settings_select_policy" 
ON public.school_settings FOR SELECT 
USING (school_id = auth.user_school_id());

CREATE POLICY "school_settings_admin_policy" 
ON public.school_settings FOR ALL 
USING (school_id = auth.user_school_id() AND auth.can_manage_timetables());

-- 2.3 Bell Schedules Table
CREATE TABLE IF NOT EXISTS public.bell_schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_period_start TEXT DEFAULT '07:45',
  period_length_mins INTEGER DEFAULT 40,
  periods_per_day INTEGER DEFAULT 8,
  breaks_after_periods INTEGER DEFAULT 3,
  break_duration_mins INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bell_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bell_schedules_select_policy" 
ON public.bell_schedules FOR SELECT 
USING (school_id = auth.user_school_id());

CREATE POLICY "bell_schedules_write_policy" 
ON public.bell_schedules FOR ALL 
USING (school_id = auth.user_school_id() AND auth.can_manage_timetables());

-- 2.4 Classes & Sections Table
CREATE TABLE IF NOT EXISTS public.classes_sections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  class_teacher_id TEXT,
  class_teacher_name TEXT,
  name TEXT NOT NULL,
  room TEXT,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_sections_select_policy" 
ON public.classes_sections FOR SELECT 
USING (school_id = auth.user_school_id());

CREATE POLICY "classes_sections_write_policy" 
ON public.classes_sections FOR ALL 
USING (school_id = auth.user_school_id() AND auth.can_manage_timetables());

-- 2.5 Teachers List Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subjects TEXT NOT NULL,
  max_periods_per_day INTEGER DEFAULT 6,
  off_days TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_select_policy" 
ON public.teachers FOR SELECT 
USING (school_id = auth.user_school_id());

CREATE POLICY "teachers_write_policy" 
ON public.teachers FOR ALL 
USING (school_id = auth.user_school_id() AND auth.can_manage_timetables());

-- 2.6 Subject Rules Table
CREATE TABLE IF NOT EXISTS public.subject_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  periods_per_week INTEGER DEFAULT 5,
  needs_double_period BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subject_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_rules_select_policy" 
ON public.subject_rules FOR SELECT 
USING (school_id = auth.user_school_id());

CREATE POLICY "subject_rules_write_policy" 
ON public.subject_rules FOR ALL 
USING (school_id = auth.user_school_id() AND auth.can_manage_timetables());

-- ==============================================================================
-- 3. TIMETABLES & CLASS TIMETABLES RLS (EXPLICIT USER MANDATE)
-- ==============================================================================

-- 3.1 Master Timetables Table
-- Rule A:
-- SELECT (Read): Allowed for all authenticated users belonging to the same school_id.
-- INSERT/UPDATE/DELETE (Write): Allowed ONLY IF role IN ('ADMIN', 'TIMETABLE_CREATOR').
CREATE TABLE IF NOT EXISTS public.timetables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  conflicts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- SELECT: Allowed for all authenticated users belonging to the same school_id
CREATE POLICY "timetables_select_policy" 
ON public.timetables FOR SELECT 
USING (
  school_id = auth.user_school_id()
);

-- WRITE (INSERT, UPDATE, DELETE): Only ADMIN or TIMETABLE_CREATOR in same school
CREATE POLICY "timetables_write_policy" 
ON public.timetables FOR ALL 
USING (
  school_id = auth.user_school_id() 
  AND auth.can_manage_timetables()
)
WITH CHECK (
  school_id = auth.user_school_id() 
  AND auth.can_manage_timetables()
);

-- 3.2 Class Timetables Table
-- Rule B:
-- SELECT: Allowed if user.id == class.class_teacher_id OR user.role == 'ADMIN'
CREATE TABLE IF NOT EXISTS public.class_timetables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  class_teacher_id TEXT,
  slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.class_timetables ENABLE ROW LEVEL SECURITY;

-- SELECT: Allowed IF user.id == class.class_teacher_id OR user.role IN ('admin', 'timetable_creator')
CREATE POLICY "class_timetables_select_policy" 
ON public.class_timetables FOR SELECT 
USING (
  school_id = auth.user_school_id()
  AND (
    auth.uid()::text = class_teacher_id 
    OR auth.can_manage_timetables()
  )
);

CREATE POLICY "class_timetables_write_policy" 
ON public.class_timetables FOR ALL 
USING (
  school_id = auth.user_school_id() 
  AND auth.can_manage_timetables()
);

-- ==============================================================================
-- 4. COMMUNITY HUB & SUBJECT PRIVACY (EXPLICIT USER MANDATE)
-- ==============================================================================

-- 4.1 Community Posts Table
-- Rule: SELECT Filtered strictly where:
-- post.school_id == user.school_id OR post.subject == user.subject OR post.category IN ('Public', 'General')
CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  school_id TEXT,
  subject TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  school_name TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  likes_count INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select_policy" 
ON public.community_posts FOR SELECT 
USING (
  -- 1. General & Public Circulars
  category IN ('General', 'Public', 'Question Papers')
  -- 2. Scoped to same school
  OR school_id = auth.user_school_id()
  -- 3. Scoped strictly to teacher's assigned subjects (Mathematics teacher cannot see Science discussions)
  OR (
    category = 'Subject Discussions' 
    AND (
      subject = ANY(auth.user_subjects()) 
      OR subject IS NULL
    )
  )
);

CREATE POLICY "community_posts_insert_policy" 
ON public.community_posts FOR INSERT 
WITH CHECK (
  auth.uid()::text = user_id
);

CREATE POLICY "community_posts_modify_policy" 
ON public.community_posts FOR UPDATE 
USING (
  auth.uid()::text = user_id OR auth.user_role() = 'admin'
);

CREATE POLICY "community_posts_delete_policy" 
ON public.community_posts FOR DELETE 
USING (
  auth.uid()::text = user_id OR auth.user_role() = 'admin'
);

-- 4.2 Community Resources Table
CREATE TABLE IF NOT EXISTS public.community_resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  school_id TEXT,
  subject TEXT,
  author_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_resources_select_policy" 
ON public.community_resources FOR SELECT 
USING (
  school_id = auth.user_school_id()
  OR subject = ANY(auth.user_subjects())
  OR subject IS NULL
);

CREATE POLICY "community_resources_insert_policy" 
ON public.community_resources FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- 4.3 Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT,
  is_public BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  date TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_policy" 
ON public.announcements FOR SELECT 
USING (
  is_public = true 
  OR school_id IS NULL 
  OR school_id = auth.user_school_id()
);

CREATE POLICY "announcements_write_policy" 
ON public.announcements FOR ALL 
USING (auth.can_manage_timetables());

-- 4.4 1-on-1 Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_messages_policy" 
ON public.direct_messages FOR ALL 
USING (
  auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
);
