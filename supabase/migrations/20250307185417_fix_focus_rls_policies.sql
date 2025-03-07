-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can insert their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can update their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can delete their own focus_sessions" ON "public"."focus_sessions";

DROP POLICY IF EXISTS "Users can view their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can insert their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can update their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can delete their own focus_tasks" ON "public"."focus_tasks";

DROP POLICY IF EXISTS "Users can view their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can insert their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can update their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can delete their own focus_session_tasks" ON "public"."focus_session_tasks";

-- Create stricter policies for focus_sessions
CREATE POLICY "Users can view their own focus_sessions" ON "public"."focus_sessions"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus_sessions" ON "public"."focus_sessions"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus_sessions" ON "public"."focus_sessions"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus_sessions" ON "public"."focus_sessions"
FOR DELETE USING (auth.uid() = user_id);

-- Create stricter policies for focus_tasks
CREATE POLICY "Users can view their own focus_tasks" ON "public"."focus_tasks"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus_tasks" ON "public"."focus_tasks"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus_tasks" ON "public"."focus_tasks"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus_tasks" ON "public"."focus_tasks"
FOR DELETE USING (auth.uid() = user_id);

-- Create stricter policies for focus_session_tasks
CREATE POLICY "Users can view their own focus_session_tasks" ON "public"."focus_session_tasks"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own focus_session_tasks" ON "public"."focus_session_tasks"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = session_id
    AND fs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own focus_session_tasks" ON "public"."focus_session_tasks"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own focus_session_tasks" ON "public"."focus_session_tasks"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  )
);
