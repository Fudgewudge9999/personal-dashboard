-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a storage bucket for resource files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow authenticated users to upload files
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'resources');

-- Create a policy to allow public access to read files
CREATE POLICY "Allow public downloads" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'resources');

-- Add file_path column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add file_size column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add file_type column to resources table (MIME type)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_type TEXT; 