-- Add category column to events table
ALTER TABLE events ADD COLUMN category TEXT DEFAULT 'work' NOT NULL;

-- Add check constraint to ensure category is one of the allowed values
ALTER TABLE events ADD CONSTRAINT events_category_check 
  CHECK (category IN ('tutoring', 'work', 'personal'));

-- Comment on the column
COMMENT ON COLUMN events.category IS 'Event category: tutoring, work, or personal'; 