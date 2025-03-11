-- Enable RLS on categories and events tables
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

-- Add user_id column if not already present
ALTER TABLE "public"."categories" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

ALTER TABLE "public"."events" 
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);

-- Create or replace the set_user_id function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to set user_id on insert if not already present
DO $$
BEGIN
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

-- Create policies for categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Users can view their own categories'
  ) THEN
    CREATE POLICY "Users can view their own categories" ON "public"."categories"
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Users can insert their own categories'
  ) THEN
    CREATE POLICY "Users can insert their own categories" ON "public"."categories"
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Users can update their own categories'
  ) THEN
    CREATE POLICY "Users can update their own categories" ON "public"."categories"
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'categories' 
    AND policyname = 'Users can delete their own categories'
  ) THEN
    CREATE POLICY "Users can delete their own categories" ON "public"."categories"
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create policies for events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'events' 
    AND policyname = 'Users can view their own events'
  ) THEN
    CREATE POLICY "Users can view their own events" ON "public"."events"
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'events' 
    AND policyname = 'Users can insert their own events'
  ) THEN
    CREATE POLICY "Users can insert their own events" ON "public"."events"
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'events' 
    AND policyname = 'Users can update their own events'
  ) THEN
    CREATE POLICY "Users can update their own events" ON "public"."events"
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'events' 
    AND policyname = 'Users can delete their own events'
  ) THEN
    CREATE POLICY "Users can delete their own events" ON "public"."events"
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
