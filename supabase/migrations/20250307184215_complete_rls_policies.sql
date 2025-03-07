-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can insert their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can update their own focus_session_tasks" ON "public"."focus_session_tasks";
DROP POLICY IF EXISTS "Users can delete their own focus_session_tasks" ON "public"."focus_session_tasks";

DROP POLICY IF EXISTS "Users can view their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can insert their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can update their own focus_sessions" ON "public"."focus_sessions";
DROP POLICY IF EXISTS "Users can delete their own focus_sessions" ON "public"."focus_sessions";

DROP POLICY IF EXISTS "Users can view their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can insert their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can update their own focus_tasks" ON "public"."focus_tasks";
DROP POLICY IF EXISTS "Users can delete their own focus_tasks" ON "public"."focus_tasks";

DROP POLICY IF EXISTS "Users can view their own subgoals" ON "public"."subgoals";
DROP POLICY IF EXISTS "Users can insert their own subgoals" ON "public"."subgoals";
DROP POLICY IF EXISTS "Users can update their own subgoals" ON "public"."subgoals";
DROP POLICY IF EXISTS "Users can delete their own subgoals" ON "public"."subgoals";

DROP POLICY IF EXISTS "Users can view their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can insert their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "public"."tasks";

-- Enable RLS on all tables that might have been missed
ALTER TABLE "public"."focus_session_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subgoals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

-- focus_session_tasks policies
CREATE POLICY "Users can view their own focus_session_tasks" ON "public"."focus_session_tasks"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own focus_session_tasks" ON "public"."focus_session_tasks"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = session_id
    AND fs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own focus_session_tasks" ON "public"."focus_session_tasks"
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own focus_session_tasks" ON "public"."focus_session_tasks"
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."focus_sessions" fs
    WHERE fs.id = focus_session_tasks.session_id
    AND fs.user_id = auth.uid()
  ));

-- focus_sessions policies
CREATE POLICY "Users can view their own focus_sessions" ON "public"."focus_sessions"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus_sessions" ON "public"."focus_sessions"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus_sessions" ON "public"."focus_sessions"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus_sessions" ON "public"."focus_sessions"
  FOR DELETE
  USING (auth.uid() = user_id);

-- focus_tasks policies
CREATE POLICY "Users can view their own focus_tasks" ON "public"."focus_tasks"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus_tasks" ON "public"."focus_tasks"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus_tasks" ON "public"."focus_tasks"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus_tasks" ON "public"."focus_tasks"
  FOR DELETE
  USING (auth.uid() = user_id);

-- subgoals policies (linked to goals through goal_id)
CREATE POLICY "Users can view their own subgoals" ON "public"."subgoals"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."goals" g
    WHERE g.id = subgoals.goal_id
    AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own subgoals" ON "public"."subgoals"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."goals" g
    WHERE g.id = goal_id
    AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own subgoals" ON "public"."subgoals"
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "public"."goals" g
    WHERE g.id = subgoals.goal_id
    AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own subgoals" ON "public"."subgoals"
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."goals" g
    WHERE g.id = subgoals.goal_id
    AND g.user_id = auth.uid()
  ));

-- tasks policies
CREATE POLICY "Users can view their own tasks" ON "public"."tasks"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON "public"."tasks"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON "public"."tasks"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON "public"."tasks"
  FOR DELETE
  USING (auth.uid() = user_id);
