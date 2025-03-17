-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS validate_session_duration_trigger ON public.tutoring_sessions;
DROP FUNCTION IF EXISTS validate_session_duration();

-- Create new function to validate session duration
CREATE OR REPLACE FUNCTION validate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure duration is positive
  IF NEW.duration_minutes <= 0 THEN
    RAISE EXCEPTION 'Session duration must be greater than 0 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger to validate session duration
CREATE TRIGGER validate_session_duration_trigger
  BEFORE INSERT OR UPDATE ON public.tutoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_session_duration();

COMMENT ON FUNCTION validate_session_duration() IS 'Validates that session duration is positive'; 