-- Schema for the goals application

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Add subgoals table
CREATE TABLE IF NOT EXISTS subgoals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS subgoals_goal_id_idx ON subgoals(goal_id);
CREATE INDEX IF NOT EXISTS subgoals_position_idx ON subgoals(position);

-- Update RLS policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgoals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY IF NOT EXISTS "Users can view their own goals" 
  ON goals FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert their own goals" 
  ON goals FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own goals" 
  ON goals FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own goals" 
  ON goals FOR DELETE 
  USING (user_id = auth.uid());

-- Create policies for subgoals
CREATE POLICY IF NOT EXISTS "Users can view their own subgoals" 
  ON subgoals FOR SELECT 
  USING (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can insert their own subgoals" 
  ON subgoals FOR INSERT 
  WITH CHECK (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can update their own subgoals" 
  ON subgoals FOR UPDATE 
  USING (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())) 
  WITH CHECK (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can delete their own subgoals" 
  ON subgoals FOR DELETE 
  USING (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())); 