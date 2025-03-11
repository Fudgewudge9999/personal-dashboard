-- Add user_id column to tables that don't have it
ALTER TABLE "public"."resources" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."habits" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

-- Create indexes for the new user_id columns
CREATE INDEX IF NOT EXISTS "resources_user_id_idx" ON "public"."resources" ("user_id");
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "public"."categories" ("user_id");
CREATE INDEX IF NOT EXISTS "habits_user_id_idx" ON "public"."habits" ("user_id");
CREATE INDEX IF NOT EXISTS "events_user_id_idx" ON "public"."events" ("user_id");

-- Enable RLS on all tables
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated role
GRANT ALL ON "public"."resources" TO authenticated;
GRANT ALL ON "public"."categories" TO authenticated;
GRANT ALL ON "public"."habits" TO authenticated;
GRANT ALL ON "public"."events" TO authenticated;
GRANT ALL ON "public"."goals" TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon role has proper access
GRANT SELECT ON "public"."resources" TO anon;
GRANT SELECT ON "public"."categories" TO anon;
GRANT SELECT ON "public"."habits" TO anon;
GRANT SELECT ON "public"."events" TO anon;
GRANT SELECT ON "public"."goals" TO anon;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read for users own resources" ON "public"."resources";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."resources";
DROP POLICY IF EXISTS "Enable update for users own resources" ON "public"."resources";
DROP POLICY IF EXISTS "Enable delete for users own resources" ON "public"."resources";

DROP POLICY IF EXISTS "Enable read for users own categories" ON "public"."categories";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."categories";
DROP POLICY IF EXISTS "Enable update for users own categories" ON "public"."categories";
DROP POLICY IF EXISTS "Enable delete for users own categories" ON "public"."categories";

DROP POLICY IF EXISTS "Enable read for users own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."habits";
DROP POLICY IF EXISTS "Enable update for users own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Enable delete for users own habits" ON "public"."habits";

DROP POLICY IF EXISTS "Enable read for users own events" ON "public"."events";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."events";
DROP POLICY IF EXISTS "Enable update for users own events" ON "public"."events";
DROP POLICY IF EXISTS "Enable delete for users own events" ON "public"."events";

DROP POLICY IF EXISTS "Enable read for users own goals" ON "public"."goals";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."goals";
DROP POLICY IF EXISTS "Enable update for users own goals" ON "public"."goals";
DROP POLICY IF EXISTS "Enable delete for users own goals" ON "public"."goals";

-- Create basic RLS policies for each table
CREATE POLICY "Enable read for users own resources" ON "public"."resources"
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."resources"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users own resources" ON "public"."resources"
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users own resources" ON "public"."resources"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users own categories" ON "public"."categories"
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."categories"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users own categories" ON "public"."categories"
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users own categories" ON "public"."categories"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users own habits" ON "public"."habits"
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."habits"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users own habits" ON "public"."habits"
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users own habits" ON "public"."habits"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users own events" ON "public"."events"
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."events"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users own events" ON "public"."events"
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users own events" ON "public"."events"
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read for users own goals" ON "public"."goals"
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."goals"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users own goals" ON "public"."goals"
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users own goals" ON "public"."goals"
    FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the set_user_id function
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id if not provided
DO $$
BEGIN
  -- Resources trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = 'set_resources_user_id'
    AND pg_class.relname = 'resources'
    AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TRIGGER set_resources_user_id
      BEFORE INSERT ON "public"."resources"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  -- Categories trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = 'set_categories_user_id'
    AND pg_class.relname = 'categories'
    AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TRIGGER set_categories_user_id
      BEFORE INSERT ON "public"."categories"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  -- Habits trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = 'set_habits_user_id'
    AND pg_class.relname = 'habits'
    AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TRIGGER set_habits_user_id
      BEFORE INSERT ON "public"."habits"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  -- Events trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = 'set_events_user_id'
    AND pg_class.relname = 'events'
    AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TRIGGER set_events_user_id
      BEFORE INSERT ON "public"."events"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
END
$$;
