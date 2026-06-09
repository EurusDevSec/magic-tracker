-- Drop old strict policies
DROP POLICY IF EXISTS "Allow users to insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Allow users to update their own reports" ON public.reports;

-- Create new policies allowing inserting/updating one's own reports OR
-- reports of other participants in a group meeting created by the user for that date.
CREATE POLICY "Allow users to insert reports" 
    ON public.reports FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.group_meetings gm
            WHERE gm.meeting_date = report_date
            AND gm.created_by = auth.uid()
            AND user_id = ANY(gm.participants)
        )
    );

CREATE POLICY "Allow users to update reports" 
    ON public.reports FOR UPDATE 
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.group_meetings gm
            WHERE gm.meeting_date = report_date
            AND gm.created_by = auth.uid()
            AND user_id = ANY(gm.participants)
        )
    );
