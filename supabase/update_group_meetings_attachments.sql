-- Add attachments column to public.group_meetings to support screenshot uploads
ALTER TABLE public.group_meetings ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}'::TEXT[];
