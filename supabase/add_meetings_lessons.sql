-- Bảng 1: Nhật Ký Buổi Review Với Mentor
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

-- Xóa policy cũ nếu đã tồn tại để tránh lỗi trùng lặp khi chạy lại script
DROP POLICY IF EXISTS "boss_meetings_select" ON public.boss_meetings;
CREATE POLICY "boss_meetings_select" ON public.boss_meetings FOR
SELECT USING (auth.uid () IS NOT NULL);

DROP POLICY IF EXISTS "boss_meetings_insert" ON public.boss_meetings;
CREATE POLICY "boss_meetings_insert" ON public.boss_meetings FOR
INSERT
WITH
    CHECK (auth.uid () IS NOT NULL);

DROP POLICY IF EXISTS "boss_meetings_update" ON public.boss_meetings;
-- Mọi user đều có thể sửa để cùng đóng góp nội dung
CREATE POLICY "boss_meetings_update" ON public.boss_meetings FOR
UPDATE USING (auth.uid () IS NOT NULL);

-- Bảng 2: Bài Học / Tư Duy Từ Mentor (Đã gộp toạ độ & liên kết cho bản đồ tư duy)
CREATE TABLE IF NOT EXISTS public.boss_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Mindset', 'Communication', 'Career', 'Resources', 'Meeting')),
    meeting_id UUID REFERENCES public.boss_meetings(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    x_pos INTEGER DEFAULT 100,
    y_pos INTEGER DEFAULT 100,
    connections UUID[] DEFAULT '{}'::UUID[],
    width INTEGER DEFAULT 280,
    height INTEGER DEFAULT 180,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.boss_lessons ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu đã tồn tại để tránh lỗi trùng lặp khi chạy lại script
DROP POLICY IF EXISTS "boss_lessons_select" ON public.boss_lessons;
CREATE POLICY "boss_lessons_select" ON public.boss_lessons FOR
SELECT USING (auth.uid () IS NOT NULL);

DROP POLICY IF EXISTS "boss_lessons_insert" ON public.boss_lessons;
CREATE POLICY "boss_lessons_insert" ON public.boss_lessons FOR
INSERT
WITH
    CHECK (auth.uid () IS NOT NULL);

DROP POLICY IF EXISTS "boss_lessons_update" ON public.boss_lessons;
CREATE POLICY "boss_lessons_update" ON public.boss_lessons FOR
UPDATE USING (
    auth.uid () = created_by
    OR (
        SELECT role
        FROM public.profiles
        WHERE
            id = auth.uid ()
    ) = 'admin'
);