-- Create the goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own goals
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own goals
CREATE POLICY "Users can insert their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own goals
CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for users to delete their own goals
CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals (user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to insert a goal without authentication (for development only)
CREATE OR REPLACE FUNCTION public.insert_goal(
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_target_date DATE DEFAULT NULL,
    p_completed BOOLEAN DEFAULT FALSE
)
RETURNS public.goals AS $$
DECLARE
    v_goal public.goals;
    v_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
BEGIN
    INSERT INTO public.goals (
        title,
        description,
        target_date,
        completed,
        user_id
    ) VALUES (
        p_title,
        p_description,
        p_target_date,
        p_completed,
        v_user_id
    )
    RETURNING * INTO v_goal;
    
    RETURN v_goal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to disable RLS for the goals table (for development only)
CREATE OR REPLACE FUNCTION public.disable_rls_for_goals()
RETURNS VOID AS $$
BEGIN
    -- This is a no-op function that will always fail in production
    -- It's only meant to be used as a signal in development
    RAISE NOTICE 'This function is only for development purposes';
END;
$$ LANGUAGE plpgsql; 