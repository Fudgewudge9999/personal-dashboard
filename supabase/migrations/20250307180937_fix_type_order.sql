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
