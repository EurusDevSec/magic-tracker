-- Drop old update policy
DROP POLICY IF EXISTS "Allow creators to update their group meetings" ON public.group_meetings;

-- Create new update policy allowing updates by creator OR any admin
CREATE POLICY "Allow creators or admins to update group meetings"
    ON public.group_meetings FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
