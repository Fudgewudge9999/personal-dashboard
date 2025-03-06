-- Enable the storage extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a storage bucket for resource files
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the resources bucket
-- Allow public read access to all files
CREATE POLICY "Resources Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Allow authenticated users to upload files
CREATE POLICY "Resources Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resources');

-- Allow users to update their own files
CREATE POLICY "Resources Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resources');

-- Allow users to delete their own files
CREATE POLICY "Resources Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resources');

-- Add file-related columns to the resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_type TEXT; 