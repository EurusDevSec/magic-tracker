-- Thêm cột kích thước thẻ width, height
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 280;
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 180;

-- Thêm cột ảnh đính kèm cho thẻ bài học
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS image_url TEXT;
