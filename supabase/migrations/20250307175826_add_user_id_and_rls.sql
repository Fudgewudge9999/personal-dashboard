-- Add user_id column to tables that don't have it
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."habits" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."resources" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id);
-- Create indexes for the new user_id columns
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "public"."categories" ("user_id");
CREATE INDEX IF NOT EXISTS "events_user_id_idx" ON "public"."events" ("user_id");
CREATE INDEX IF NOT EXISTS "habits_user_id_idx" ON "public"."habits" ("user_id");
CREATE INDEX IF NOT EXISTS "resources_user_id_idx" ON "public"."resources" ("user_id");
-- Enable Row Level Security for all tables
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_session_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."focus_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subgoals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
-- Create policies for categories
CREATE POLICY "Users can view their own categories" ON "public"."categories"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON "public"."categories"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON "public"."categories"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON "public"."categories"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for events
CREATE POLICY "Users can view their own events" ON "public"."events"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events" ON "public"."events"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON "public"."events"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON "public"."events"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for focus_session_tasks
-- These need to check the related focus_sessions table for user ownership
CREATE POLICY "Users can view their own focus session tasks" ON "public"."focus_session_tasks"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM focus_sessions WHERE id = session_id
    )
  );
CREATE POLICY "Users can insert their own focus session tasks" ON "public"."focus_session_tasks"
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM focus_sessions WHERE id = session_id
    )
  );
CREATE POLICY "Users can update their own focus session tasks" ON "public"."focus_session_tasks"
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM focus_sessions WHERE id = session_id
    )
  );
CREATE POLICY "Users can delete their own focus session tasks" ON "public"."focus_session_tasks"
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM focus_sessions WHERE id = session_id
    )
  );
-- Create policies for focus_sessions
CREATE POLICY "Users can view their own focus sessions" ON "public"."focus_sessions"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus sessions" ON "public"."focus_sessions"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own focus sessions" ON "public"."focus_sessions"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own focus sessions" ON "public"."focus_sessions"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for focus_tasks
CREATE POLICY "Users can view their own focus tasks" ON "public"."focus_tasks"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus tasks" ON "public"."focus_tasks"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own focus tasks" ON "public"."focus_tasks"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own focus tasks" ON "public"."focus_tasks"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goals' 
    AND policyname = 'Users can view their own goals'
  ) THEN
    CREATE POLICY "Users can view their own goals" ON "public"."goals"
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goals' 
    AND policyname = 'Users can insert their own goals'
  ) THEN
    CREATE POLICY "Users can insert their own goals" ON "public"."goals"
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goals' 
    AND policyname = 'Users can update their own goals'
  ) THEN
    CREATE POLICY "Users can update their own goals" ON "public"."goals"
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goals' 
    AND policyname = 'Users can delete their own goals'
  ) THEN
    CREATE POLICY "Users can delete their own goals" ON "public"."goals"
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;
-- Create policies for habits
CREATE POLICY "Users can view their own habits" ON "public"."habits"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON "public"."habits"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON "public"."habits"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON "public"."habits"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for resources
CREATE POLICY "Users can view their own resources" ON "public"."resources"
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resources" ON "public"."resources"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resources" ON "public"."resources"
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resources" ON "public"."resources"
  FOR DELETE USING (auth.uid() = user_id);
-- Create policies for subgoals
-- These need to check the related goals table for user ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subgoals' 
    AND policyname = 'Users can view their own subgoals'
  ) THEN
    CREATE POLICY "Users can view their own subgoals" ON "public"."subgoals"
      FOR SELECT USING (
        auth.uid() IN (
          SELECT user_id FROM goals WHERE id = goal_id
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subgoals' 
    AND policyname = 'Users can insert their own subgoals'
  ) THEN
    CREATE POLICY "Users can insert their own subgoals" ON "public"."subgoals"
      FOR INSERT WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM goals WHERE id = goal_id
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subgoals' 
    AND policyname = 'Users can update their own subgoals'
  ) THEN
    CREATE POLICY "Users can update their own subgoals" ON "public"."subgoals"
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT user_id FROM goals WHERE id = goal_id
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subgoals' 
    AND policyname = 'Users can delete their own subgoals'
  ) THEN
    CREATE POLICY "Users can delete their own subgoals" ON "public"."subgoals"
      FOR DELETE USING (
        auth.uid() IN (
          SELECT user_id FROM goals WHERE id = goal_id
        )
      );
  END IF;
END
$$;
-- Create policies for tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks" ON "public"."tasks"
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can insert their own tasks'
  ) THEN
    CREATE POLICY "Users can insert their own tasks" ON "public"."tasks"
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks" ON "public"."tasks"
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks" ON "public"."tasks"
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;
-- Create a function to ensure user_id is set to current user if not provided
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
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_categories_user_id'
    AND event_object_table = 'categories'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_categories_user_id
      BEFORE INSERT ON "public"."categories"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_events_user_id'
    AND event_object_table = 'events'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_events_user_id
      BEFORE INSERT ON "public"."events"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_focus_sessions_user_id'
    AND event_object_table = 'focus_sessions'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_focus_sessions_user_id
      BEFORE INSERT ON "public"."focus_sessions"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_focus_tasks_user_id'
    AND event_object_table = 'focus_tasks'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_focus_tasks_user_id
      BEFORE INSERT ON "public"."focus_tasks"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_goals_user_id'
    AND event_object_table = 'goals'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_goals_user_id
      BEFORE INSERT ON "public"."goals"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_habits_user_id'
    AND event_object_table = 'habits'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_habits_user_id
      BEFORE INSERT ON "public"."habits"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_resources_user_id'
    AND event_object_table = 'resources'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_resources_user_id
      BEFORE INSERT ON "public"."resources"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'set_tasks_user_id'
    AND event_object_table = 'tasks'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER set_tasks_user_id
      BEFORE INSERT ON "public"."tasks"
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id();
  END IF;
END
$$;
