-- Consolidated fixes for Supabase migration issues

-- 1. Fix the type order issue
-- First, drop the function that depends on the type if it exists
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

-- 2. Fix the trigger creation issue
-- Create a function to safely create triggers without IF NOT EXISTS syntax
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

-- Safely create all the user_id triggers
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

-- 3. Fix any system table access issues by using standard ALTER statements
-- Instead of directly updating pg_class or other system tables, use ALTER statements
-- For example, to change ownership of a table:
-- ALTER TABLE table_name OWNER TO new_owner;

-- 4. Ensure all tables have proper RLS enabled
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

-- 5. Clean up the helper function when done
DROP FUNCTION IF EXISTS create_trigger_if_not_exists; 