-- Enable Row Level Security on all tables that don't have it yet
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;

-- Ensure all tables have user_id column for RLS
ALTER TABLE "public"."resources" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

ALTER TABLE "public"."categories" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

ALTER TABLE "public"."habits" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

ALTER TABLE "public"."events" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

-- Create policies for resources
CREATE POLICY IF NOT EXISTS "Users can view their own resources" ON "public"."resources"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own resources" ON "public"."resources"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own resources" ON "public"."resources"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own resources" ON "public"."resources"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY IF NOT EXISTS "Users can view their own categories" ON "public"."categories"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own categories" ON "public"."categories"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own categories" ON "public"."categories"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own categories" ON "public"."categories"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for habits
CREATE POLICY IF NOT EXISTS "Users can view their own habits" ON "public"."habits"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own habits" ON "public"."habits"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own habits" ON "public"."habits"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own habits" ON "public"."habits"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY IF NOT EXISTS "Users can view their own events" ON "public"."events"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own events" ON "public"."events"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own events" ON "public"."events"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own events" ON "public"."events"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY IF NOT EXISTS "Users can view their own goals" ON "public"."goals"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own goals" ON "public"."goals"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own goals" ON "public"."goals"
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own goals" ON "public"."goals"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure triggers exist to set user_id on insert for all tables
CREATE TRIGGER IF NOT EXISTS set_resources_user_id
  BEFORE INSERT ON "public"."resources"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER IF NOT EXISTS set_categories_user_id
  BEFORE INSERT ON "public"."categories"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER IF NOT EXISTS set_habits_user_id
  BEFORE INSERT ON "public"."habits"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER IF NOT EXISTS set_events_user_id
  BEFORE INSERT ON "public"."events"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER IF NOT EXISTS set_goals_user_id
  BEFORE INSERT ON "public"."goals"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();
