-- Use standard ALTER TABLE statements to enable RLS
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;

-- Force policy creation regardless of whether previous ones exist
DROP POLICY IF EXISTS "Users can view their own resources" ON "public"."resources";
DROP POLICY IF EXISTS "Users can insert their own resources" ON "public"."resources";
DROP POLICY IF EXISTS "Users can update their own resources" ON "public"."resources";
DROP POLICY IF EXISTS "Users can delete their own resources" ON "public"."resources";

DROP POLICY IF EXISTS "Users can view their own categories" ON "public"."categories";
DROP POLICY IF EXISTS "Users can insert their own categories" ON "public"."categories";
DROP POLICY IF EXISTS "Users can update their own categories" ON "public"."categories";
DROP POLICY IF EXISTS "Users can delete their own categories" ON "public"."categories";

DROP POLICY IF EXISTS "Users can view their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can insert their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can update their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can delete their own habits" ON "public"."habits";

DROP POLICY IF EXISTS "Users can view their own events" ON "public"."events";
DROP POLICY IF EXISTS "Users can insert their own events" ON "public"."events";
DROP POLICY IF EXISTS "Users can update their own events" ON "public"."events";
DROP POLICY IF EXISTS "Users can delete their own events" ON "public"."events";

DROP POLICY IF EXISTS "Users can view their own goals" ON "public"."goals";
DROP POLICY IF EXISTS "Users can insert their own goals" ON "public"."goals";
DROP POLICY IF EXISTS "Users can update their own goals" ON "public"."goals";
DROP POLICY IF EXISTS "Users can delete their own goals" ON "public"."goals";

-- Create policies for resources
CREATE POLICY "Users can view their own resources" ON "public"."resources"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resources" ON "public"."resources"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources" ON "public"."resources"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" ON "public"."resources"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Users can view their own categories" ON "public"."categories"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON "public"."categories"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON "public"."categories"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON "public"."categories"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for habits
CREATE POLICY "Users can view their own habits" ON "public"."habits"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON "public"."habits"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON "public"."habits"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON "public"."habits"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY "Users can view their own events" ON "public"."events"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON "public"."events"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON "public"."events"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON "public"."events"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY "Users can view their own goals" ON "public"."goals"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON "public"."goals"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON "public"."goals"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON "public"."goals"
  FOR DELETE
  USING (auth.uid() = user_id);
