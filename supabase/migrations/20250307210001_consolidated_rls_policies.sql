-- Consolidated RLS policies with proper existence checks

-- Helper function to create policies safely
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  operation TEXT,
  using_expr TEXT DEFAULT NULL,
  check_expr TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Check if the policy already exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name
    AND policyname = policy_name
  ) INTO policy_exists;
  
  -- If the policy doesn't exist, create it
  IF NOT policy_exists THEN
    IF operation = 'SELECT' OR operation = 'DELETE' OR operation = 'UPDATE' THEN
      EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR %s
        USING (%s);
      ', 
      policy_name, 
      table_name, 
      operation,
      using_expr);
    ELSIF operation = 'INSERT' THEN
      EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR %s
        WITH CHECK (%s);
      ', 
      policy_name, 
      table_name, 
      operation,
      check_expr);
    ELSIF operation = 'ALL' THEN
      EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR %s
        USING (%s)
        WITH CHECK (%s);
      ', 
      policy_name, 
      table_name, 
      operation,
      using_expr,
      check_expr);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Make sure RLS is enabled on all tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_record.tablename);
  END LOOP;
END;
$$;

-- Create policies for categories
SELECT create_policy_if_not_exists(
  'Users can view their own categories',
  'categories',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own categories',
  'categories',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own categories',
  'categories',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own categories',
  'categories',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for events
SELECT create_policy_if_not_exists(
  'Users can view their own events',
  'events',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own events',
  'events',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own events',
  'events',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own events',
  'events',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for focus_session_tasks
SELECT create_policy_if_not_exists(
  'Users can view their own focus session tasks',
  'focus_session_tasks',
  'SELECT',
  'auth.uid() IN (SELECT user_id FROM focus_sessions WHERE id = session_id)'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own focus session tasks',
  'focus_session_tasks',
  'INSERT',
  NULL,
  'auth.uid() IN (SELECT user_id FROM focus_sessions WHERE id = session_id)'
);

SELECT create_policy_if_not_exists(
  'Users can update their own focus session tasks',
  'focus_session_tasks',
  'UPDATE',
  'auth.uid() IN (SELECT user_id FROM focus_sessions WHERE id = session_id)'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own focus session tasks',
  'focus_session_tasks',
  'DELETE',
  'auth.uid() IN (SELECT user_id FROM focus_sessions WHERE id = session_id)'
);

-- Create policies for focus_sessions
SELECT create_policy_if_not_exists(
  'Users can view their own focus sessions',
  'focus_sessions',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own focus sessions',
  'focus_sessions',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own focus sessions',
  'focus_sessions',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own focus sessions',
  'focus_sessions',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for focus_tasks
SELECT create_policy_if_not_exists(
  'Users can view their own focus tasks',
  'focus_tasks',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own focus tasks',
  'focus_tasks',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own focus tasks',
  'focus_tasks',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own focus tasks',
  'focus_tasks',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for goals
SELECT create_policy_if_not_exists(
  'Users can view their own goals',
  'goals',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own goals',
  'goals',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own goals',
  'goals',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own goals',
  'goals',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for habits
SELECT create_policy_if_not_exists(
  'Users can view their own habits',
  'habits',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own habits',
  'habits',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own habits',
  'habits',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own habits',
  'habits',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for resources
SELECT create_policy_if_not_exists(
  'Users can view their own resources',
  'resources',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own resources',
  'resources',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own resources',
  'resources',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own resources',
  'resources',
  'DELETE',
  'auth.uid() = user_id'
);

-- Create policies for subgoals
SELECT create_policy_if_not_exists(
  'Users can view their own subgoals',
  'subgoals',
  'SELECT',
  'auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id)'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own subgoals',
  'subgoals',
  'INSERT',
  NULL,
  'auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id)'
);

SELECT create_policy_if_not_exists(
  'Users can update their own subgoals',
  'subgoals',
  'UPDATE',
  'auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id)'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own subgoals',
  'subgoals',
  'DELETE',
  'auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id)'
);

-- Create policies for tasks
SELECT create_policy_if_not_exists(
  'Users can view their own tasks',
  'tasks',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert their own tasks',
  'tasks',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update their own tasks',
  'tasks',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can delete their own tasks',
  'tasks',
  'DELETE',
  'auth.uid() = user_id'
);

-- Clean up the helper function when done
DROP FUNCTION IF EXISTS create_policy_if_not_exists; 