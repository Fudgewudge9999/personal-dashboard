-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comment to subcategories table
COMMENT ON TABLE public.subcategories IS 'Subcategories for organizing resources';

-- Add subcategory_id to resources table
ALTER TABLE public.resources
ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies for subcategories table
CREATE POLICY "Users can view their own subcategories" 
ON public.subcategories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subcategories" 
ON public.subcategories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcategories" 
ON public.subcategories 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcategories" 
ON public.subcategories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_resources_subcategory_id ON public.resources(subcategory_id);
