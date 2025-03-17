-- Create tutoring_students table
CREATE TABLE IF NOT EXISTS public.tutoring_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tutoring_students_user_id_idx ON public.tutoring_students(user_id);
CREATE INDEX IF NOT EXISTS tutoring_students_name_idx ON public.tutoring_students(name);

-- Enable Row Level Security for tutoring_students
ALTER TABLE public.tutoring_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tutoring_students
CREATE POLICY "Users can view their own tutoring students" 
    ON public.tutoring_students FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutoring students" 
    ON public.tutoring_students FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutoring students" 
    ON public.tutoring_students FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutoring students" 
    ON public.tutoring_students FOR DELETE 
    USING (auth.uid() = user_id);

-- Create tutoring_sessions table
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.tutoring_students(id) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    payment_date DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tutoring_sessions_user_id_idx ON public.tutoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS tutoring_sessions_student_id_idx ON public.tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS tutoring_sessions_payment_status_idx ON public.tutoring_sessions(payment_status);
CREATE INDEX IF NOT EXISTS tutoring_sessions_session_date_idx ON public.tutoring_sessions(session_date);

-- Enable Row Level Security for tutoring_sessions
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tutoring_sessions
CREATE POLICY "Users can view their own tutoring sessions" 
    ON public.tutoring_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutoring sessions" 
    ON public.tutoring_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutoring sessions" 
    ON public.tutoring_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutoring sessions" 
    ON public.tutoring_sessions FOR DELETE 
    USING (auth.uid() = user_id);

-- Create trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at fields
CREATE TRIGGER set_tutoring_students_updated_at
BEFORE UPDATE ON public.tutoring_students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_tutoring_sessions_updated_at
BEFORE UPDATE ON public.tutoring_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
