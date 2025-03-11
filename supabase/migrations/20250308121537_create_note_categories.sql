-- Create a new table for note categories
CREATE TABLE IF NOT EXISTS public.note_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS note_categories_user_id_idx ON public.note_categories(user_id);

-- Enable Row Level Security
ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own note categories" 
    ON public.note_categories FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note categories" 
    ON public.note_categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note categories" 
    ON public.note_categories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note categories" 
    ON public.note_categories FOR DELETE 
    USING (auth.uid() = user_id);

-- Add a new column to the notes table for the new note_categories
ALTER TABLE public.notes ADD COLUMN note_category_id UUID REFERENCES public.note_categories(id);
CREATE INDEX IF NOT EXISTS notes_note_category_id_idx ON public.notes(note_category_id);

-- Create a function to migrate existing notes to use the new note_categories table
CREATE OR REPLACE FUNCTION migrate_notes_to_note_categories() RETURNS void AS $$
DECLARE
    category_record RECORD;
    new_category_id UUID;
    user_id_val UUID;
BEGIN
    -- For each distinct category used by notes
    FOR category_record IN 
        SELECT DISTINCT c.id, c.name, n.user_id
        FROM notes n
        JOIN categories c ON n.category_id = c.id
    LOOP
        -- Create a new note category with the same name
        INSERT INTO note_categories (name, user_id)
        VALUES (category_record.name, category_record.user_id)
        RETURNING id INTO new_category_id;
        
        -- Update all notes that use this category to use the new note category
        UPDATE notes
        SET note_category_id = new_category_id
        WHERE category_id = category_record.id
        AND user_id = category_record.user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_notes_to_note_categories();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_notes_to_note_categories();

-- Note: We're keeping the original category_id column for backward compatibility
-- In a future migration, we can remove it if needed
