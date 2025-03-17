-- Update tutoring_sessions table to handle fixed session rates
ALTER TABLE public.tutoring_sessions 
  RENAME COLUMN hourly_rate TO session_rate;

COMMENT ON COLUMN public.tutoring_sessions.session_rate IS 'Fixed rate for the session based on duration (not hourly rate)';

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS validate_session_duration_trigger ON public.tutoring_sessions;
DROP FUNCTION IF EXISTS validate_session_duration(); 