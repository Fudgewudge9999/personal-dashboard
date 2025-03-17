-- Drop the habits table and related policies
-- First, drop any policies related to the habits table
DROP POLICY IF EXISTS "Users can view their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can insert their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can update their own habits" ON "public"."habits";
DROP POLICY IF EXISTS "Users can delete their own habits" ON "public"."habits";

-- Drop any triggers related to the habits table
DROP TRIGGER IF EXISTS set_habits_user_id ON "public"."habits";

-- Finally, drop the habits table
DROP TABLE IF EXISTS "public"."habits";
