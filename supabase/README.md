# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Running Migrations

To apply the migrations to your Supabase project, you can use the Supabase CLI:

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply the migrations:
   ```bash
   supabase db push
   ```

## Manual Migration

If you prefer to run the migrations manually:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file (e.g., `20240601000000_add_resource_storage.sql`)
4. Paste into the SQL Editor and run the query

## Migration Files

- `20240601000000_add_resource_storage.sql`: Sets up storage for resource files and adds file-related columns to the resources table.

## Storage Setup

The migrations will:

1. Create a storage bucket named 'resources'
2. Set up appropriate access policies
3. Add file-related columns to the resources table:
   - `file_path`: Path to the file in storage
   - `file_size`: Size of the file in bytes
   - `file_type`: MIME type of the file 