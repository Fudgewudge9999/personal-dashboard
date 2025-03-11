-- Complete consolidated fixes for all Supabase migration issues
-- This file addresses:
-- 1. Type order issues
-- 2. Trigger creation syntax issues
-- 3. Policy creation syntax issues
-- 4. System table access issues
-- 5. Duplicate object creation

-- =============================================
-- 1. FIX TYPE ORDER ISSUES
-- =============================================

-- First, drop the function that depends on the type
DROP FUNCTION IF EXISTS public.reorder_subgoals;

-- Then recreate the type
DROP TYPE IF EXISTS public.subgoal_position_update;
CREATE TYPE public.subgoal_position_update AS (
  id uuid,
  position integer
);

-- Now recreate the function with the type available
CREATE OR REPLACE FUNCTION public.reorder_subgoals(goal_id_param uuid, subgoal_positions subgoal_position_update[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  subgoal_id UUID;
  new_position INT;
  subgoal_position subgoal_position_update;
  current_positions JSONB;
  existing_ids UUID[];
BEGIN
  -- Collect all existing subgoals for the goal to verify ids exist
  SELECT array_agg(id) INTO existing_ids FROM subgoals WHERE goal_id = goal_id_param;
  
  -- Update each subgoal's position
  FOREACH subgoal_position IN ARRAY subgoal_positions
  LOOP
    subgoal_id := (subgoal_position).id;
    new_position := (subgoal_position).position;
    
    -- Verify the subgoal ID exists and belongs to the goal
    IF subgoal_id = ANY(existing_ids) THEN
      UPDATE subgoals
      SET "position" = new_position
      WHERE id = subgoal_id AND goal_id = goal_id_param;
    END IF;
  END LOOP;
END;
$function$;

-- =============================================
-- 2. HELPER FUNCTIONS FOR SAFE OBJECT CREATION
-- =============================================

-- Helper function for safe trigger creation
CREATE OR REPLACE FUNCTION create_trigger_if_not_exists(
  trigger_name TEXT,
  table_name TEXT,
  trigger_timing TEXT,
  trigger_events TEXT,
  trigger_orientation TEXT,
  function_name TEXT
) RETURNS VOID AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  -- Check if the trigger already exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = trigger_name
    AND pg_class.relname = table_name
    AND pg_namespace.nspname = 'public'
  ) INTO trigger_exists;
  
  -- If the trigger doesn't exist, create it
  IF NOT trigger_exists THEN
    EXECUTE format('
      CREATE TRIGGER %I
      %s %s ON public.%I
      FOR EACH %s
      EXECUTE FUNCTION %s();
    ', 
    trigger_name, 
    trigger_timing, 
    trigger_events, 
    table_name, 
    trigger_orientation, 
    function_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function for safe policy creation
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

-- =============================================
-- 3. ENSURE RLS IS ENABLED ON ALL TABLES
-- =============================================

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

-- =============================================
-- 4. CREATE OR REPLACE USER_ID FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. SAFELY CREATE ALL TRIGGERS
-- =============================================

-- Create triggers to automatically set user_id if not provided
SELECT create_trigger_if_not_exists(
  'set_categories_user_id',
  'categories',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_events_user_id',
  'events',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_focus_sessions_user_id',
  'focus_sessions',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_focus_tasks_user_id',
  'focus_tasks',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_goals_user_id',
  'goals',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_habits_user_id',
  'habits',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_resources_user_id',
  'resources',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

SELECT create_trigger_if_not_exists(
  'set_tasks_user_id',
  'tasks',
  'BEFORE',
  'INSERT',
  'ROW',
  'public.set_user_id'
);

-- =============================================
-- 6. SAFELY CREATE ALL RLS POLICIES
-- =============================================

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

-- =============================================
-- 7. CLEANUP HELPER FUNCTIONS
-- =============================================

DROP FUNCTION IF EXISTS create_trigger_if_not_exists;
DROP FUNCTION IF EXISTS create_policy_if_not_exists; 