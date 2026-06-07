-- 1. Thêm cột tọa độ x_pos, y_pos cho bảng boss_lessons để lưu vị trí thẻ trên canvas
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS x_pos INTEGER DEFAULT 100;
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS y_pos INTEGER DEFAULT 100;

-- 2. Thêm cột connections lưu mảng các id bài học/cuộc họp liên kết với thẻ hiện tại
ALTER TABLE public.boss_lessons ADD COLUMN IF NOT EXISTS connections UUID[] DEFAULT '{}'::UUID[];

-- 3. Cập nhật Ràng buộc Check Constraint để hỗ trợ thêm danh mục 'Meeting' (Cuộc họp)
-- Lưu ý: Phải xóa ràng buộc CHECK cũ nếu có để tránh xung đột
ALTER TABLE public.boss_lessons DROP CONSTRAINT IF EXISTS boss_lessons_category_check;
ALTER TABLE public.boss_lessons ADD CONSTRAINT boss_lessons_category_check CHECK (category IN ('Mindset', 'Communication', 'Career', 'Resources', 'Meeting'));
