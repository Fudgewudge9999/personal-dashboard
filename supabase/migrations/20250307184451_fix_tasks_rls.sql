-- First, drop ALL existing policies on the tasks table
DROP POLICY IF EXISTS "Allow users to delete their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to insert tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to update their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to view all tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can view their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can insert their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "public"."tasks";

-- Make sure RLS is enabled
ALTER TABLE "public"."tasks" FORCE ROW LEVEL SECURITY;

-- Create new restrictive policies
CREATE POLICY "tasks_select_policy" ON "public"."tasks"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy" ON "public"."tasks"
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "tasks_update_policy" ON "public"."tasks"
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy" ON "public"."tasks"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Revoke all privileges from public
REVOKE ALL ON "public"."tasks" FROM PUBLIC;

-- Grant specific privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."tasks" TO authenticated;

-- Make user_id NOT NULL if it isn't already
DO $$ 
BEGIN 
    ALTER TABLE "public"."tasks" ALTER COLUMN user_id SET NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;
