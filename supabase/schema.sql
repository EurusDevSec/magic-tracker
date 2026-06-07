-- Supabase Schema for Team Progress & Gratitude Dashboard (The Magic)

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Reports Table (Daily updates)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE NOT NULL,
    today_tasks TEXT NOT NULL,
    lessons_learned TEXT,
    problems_and_solutions TEXT,
    next_day_plan TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}'::TEXT[], -- Array of compressed Base64 images as proof
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')) NOT NULL,
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_report_date UNIQUE (user_id, report_date)
);

-- Enable RLS on Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Create Gratitude Logs Table (28 Days)
CREATE TABLE IF NOT EXISTS public.gratitude_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 28),
    log_date DATE DEFAULT CURRENT_DATE NOT NULL,
    gratitude_list JSONB NOT NULL, -- Array of 10 items: [{id, text, reason}]
    magic_stone_thought TEXT, -- Evening exercise
    day_specific_practice JSONB, -- Optional extra variables per day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_gratitude_day UNIQUE (user_id, day_number)
);

-- Enable RLS on Gratitude Logs
ALTER TABLE public.gratitude_logs ENABLE ROW LEVEL SECURITY;

-- 4. Automatically Create Profile on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        -- Default to 'admin' if it's the first registered user, else 'member'
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin'
            ELSE 'member'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Set up RLS Policies

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to update their own profiles" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Reports Policies
CREATE POLICY "Allow authenticated users to view all reports" 
    ON public.reports FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own reports" 
    ON public.reports FOR UPDATE 
    USING (auth.uid() = user_id);

-- Gratitude Logs Policies
CREATE POLICY "Allow users to view their own gratitude logs" 
    ON public.gratitude_logs FOR SELECT 
    USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow users to insert their own gratitude logs" 
    ON public.gratitude_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own gratitude logs" 
    ON public.gratitude_logs FOR UPDATE 
    USING (auth.uid() = user_id);

-- 5. Create Group Meetings Table (Weekly logs)
CREATE TABLE IF NOT EXISTS public.group_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_date DATE NOT NULL,
    meeting_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    participants UUID[] NOT NULL,
    content TEXT NOT NULL,
    difficulties TEXT NOT NULL,
    solutions TEXT NOT NULL,
    assignments JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachments TEXT[] DEFAULT '{}'::TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Group Meetings
ALTER TABLE public.group_meetings ENABLE ROW LEVEL SECURITY;

-- Group Meetings Policies
CREATE POLICY "Allow authenticated users to read group meetings" 
    ON public.group_meetings FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert group meetings" 
    ON public.group_meetings FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow creators to update their group meetings" 
    ON public.group_meetings FOR UPDATE 
    TO authenticated
    USING (auth.uid() = created_by);

-- 6. Bảng Nhật Ký Họp Với Mentor (Boss Meetings)
CREATE TABLE IF NOT EXISTS public.boss_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME WITHOUT TIME ZONE NOT NULL,
    summary TEXT NOT NULL,
    decisions TEXT,
    challenges TEXT[],
    tags TEXT[],
    attachments TEXT[] DEFAULT '{}'::TEXT[],
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.boss_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss_meetings_select" ON public.boss_meetings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "boss_meetings_insert" ON public.boss_meetings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "boss_meetings_update" ON public.boss_meetings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 7. Bảng Bài Học Từ Sếp (Boss Lessons)
CREATE TABLE IF NOT EXISTS public.boss_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Mindset', 'Communication', 'Career', 'Resources')),
    meeting_id UUID REFERENCES public.boss_meetings(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.boss_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss_lessons_select" ON public.boss_lessons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "boss_lessons_insert" ON public.boss_lessons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "boss_lessons_update" ON public.boss_lessons FOR UPDATE
  USING (auth.uid() = created_by OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
