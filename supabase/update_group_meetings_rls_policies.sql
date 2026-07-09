-- Drop old update policy
DROP POLICY IF EXISTS "Allow creators to update their group meetings" ON public.group_meetings;
DROP POLICY IF EXISTS "Allow creators or admins to update group meetings" ON public.group_meetings;

-- Create new update policy allowing updates by any authenticated user
CREATE POLICY "Allow all authenticated users to update group meetings"
    ON public.group_meetings FOR UPDATE
    TO authenticated
    USING (true);
