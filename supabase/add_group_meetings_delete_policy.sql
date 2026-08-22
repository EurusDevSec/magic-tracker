-- Drop old delete policy if exists
DROP POLICY IF EXISTS "Allow creators or admins to delete group meetings" ON public.group_meetings;

-- Create new delete policy allowing delete only by creator or admin
CREATE POLICY "Allow creators or admins to delete group meetings"
    ON public.group_meetings FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Drop old delete policy if exists for reports
DROP POLICY IF EXISTS "Allow users to delete reports" ON public.reports;

-- Create new delete policy allowing delete by owner, admin, or group meeting creator for that date
CREATE POLICY "Allow users to delete reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.group_meetings gm
            WHERE gm.meeting_date = report_date
            AND gm.created_by = auth.uid()
            AND user_id = ANY(gm.participants)
        )
    );
