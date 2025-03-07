-- Enable RLS on categories and events tables
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

-- Add user_id column if not already present
ALTER TABLE "public"."categories" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

ALTER TABLE "public"."events" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

-- Create triggers to set user_id on insert if not already present
CREATE TRIGGER IF NOT EXISTS set_categories_user_id
  BEFORE INSERT ON "public"."categories"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER IF NOT EXISTS set_events_user_id
  BEFORE INSERT ON "public"."events"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

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
