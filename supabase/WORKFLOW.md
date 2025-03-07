# Supabase Development Workflow

This document outlines the workflow for making changes to the Supabase database and keeping the TypeScript types in sync.

## Setup

The project is set up to use:
- Supabase CLI for database migrations and type generation
- TypeScript types in `src/types/supabase-generated.ts` that reflect the database schema

## Making Database Changes

### Option 1: Using the Supabase CLI (Recommended)

1. Create a new migration:
   ```bash
   npx supabase migration new your_migration_name
   ```

2. Edit the generated SQL file in `supabase/migrations/`

3. Apply the migration to your remote database:
   ```bash
   npx supabase db push
   ```

4. Update the TypeScript types:
   ```bash
   npx supabase gen types typescript > src/types/supabase-generated.ts
   ```

### Option 2: Using the Supabase Dashboard

1. Make changes in the Supabase dashboard

2. Pull the changes to your local project:
   ```bash
   npx supabase db pull
   ```

3. Update the TypeScript types:
   ```bash
   npx supabase gen types typescript > src/types/supabase-generated.ts
   ```

## Troubleshooting

If you encounter issues with migrations:

1. Check the migration status:
   ```bash
   npx supabase migration list
   ```

2. If needed, repair the migration history:
   ```bash
   npx supabase migration repair --status applied MIGRATION_ID
   ```

## Important Notes

- Always keep `src/types/supabase-generated.ts` as the source of truth for database types
- All components should import types from `src/types/supabase-generated.ts`
- The simplified interfaces in `src/types/supabase.ts` can be used for convenience but should be kept in sync with the generated types 