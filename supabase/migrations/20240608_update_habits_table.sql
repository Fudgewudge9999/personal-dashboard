-- No need to update the habits table as it doesn't have a category column
-- This migration is kept for documentation purposes to show that we've considered
-- updating any references to "Habits & Goals" in the database

-- If you have any UI settings or user preferences stored in the database that reference
-- "Habits & Goals", you would update them here.

-- Example (uncomment and modify if needed):
-- UPDATE public.user_preferences
-- SET preference_value = 'Habits'
-- WHERE preference_key = 'sidebar_section_name' AND preference_value = 'Habits & Goals';

-- Note: The actual UI changes have been made in the frontend code 