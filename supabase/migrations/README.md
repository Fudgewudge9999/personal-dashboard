# Supabase Migration Best Practices

This document outlines best practices for creating and managing Supabase migrations to avoid common issues.

## Common Issues and Solutions

### 1. Type Order Issues

**Problem**: Functions are defined before the types they depend on.

**Solution**: Always define types before functions that use them. If you need to modify a function that uses a custom type:

```sql
-- First, drop the function that depends on the type
DROP FUNCTION IF EXISTS my_function;

-- Then modify or recreate the type
DROP TYPE IF EXISTS my_type;
CREATE TYPE my_type AS (...);

-- Finally, recreate the function with the updated type
CREATE OR REPLACE FUNCTION my_function(...) 
RETURNS ... AS $$
...
$$ LANGUAGE ...;
```

### 2. Unsupported `IF NOT EXISTS` Syntax

**Problem**: PostgreSQL doesn't support `CREATE TRIGGER IF NOT EXISTS` or `CREATE POLICY IF NOT EXISTS`.

**Solution**: Use PL/pgSQL blocks to check for existence before creating:

For triggers:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_trigger.tgname = 'my_trigger'
    AND pg_class.relname = 'my_table'
    AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TRIGGER my_trigger
      BEFORE INSERT ON my_table
      FOR EACH ROW
      EXECUTE FUNCTION my_function();
  END IF;
END;
$$;
```

For policies:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'my_table'
    AND policyname = 'my_policy'
  ) THEN
    CREATE POLICY my_policy ON my_table
      FOR SELECT USING (condition);
  END IF;
END;
$$;
```

### 3. System Table Access Issues

**Problem**: Direct updates to system tables like `pg_class` require superuser privileges.

**Solution**: Use standard PostgreSQL commands instead:

```sql
-- Instead of updating pg_class directly
ALTER TABLE my_table OWNER TO my_role;

-- Instead of updating pg_attribute directly
ALTER TABLE my_table ALTER COLUMN my_column SET DATA TYPE new_type;
```

### 4. Duplicate Object Creation

**Problem**: Multiple migration files trying to create the same objects.

**Solution**: 
- Use `IF NOT EXISTS` for objects that support it (tables, schemas, etc.)
- Use PL/pgSQL blocks to check existence for objects that don't support it
- Consider using helper functions for repetitive tasks

## Migration Workflow

1. Create a new migration:
   ```bash
   npx supabase migration new my_migration_name
   ```

2. Edit the generated SQL file following these best practices

3. Test locally:
   ```bash
   npx supabase start
   ```

4. Push changes:
   ```bash
   npx supabase db push
   ```

5. Generate updated types:
   ```bash
   npx supabase gen types typescript > src/types/supabase-generated.ts
   ```

## Helper Functions

This repository includes helper functions to simplify common tasks:

- `create_trigger_if_not_exists`: Safely creates triggers
- `create_policy_if_not_exists`: Safely creates policies

Example usage:
```sql
SELECT create_policy_if_not_exists(
  'Users can view their own data',
  'my_table',
  'SELECT',
  'auth.uid() = user_id'
);
```

## Row Level Security (RLS)

Always ensure RLS is properly configured:

1. Enable RLS on all tables:
   ```sql
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   ```

2. Create appropriate policies for each operation (SELECT, INSERT, UPDATE, DELETE)

3. Test policies thoroughly to ensure data is properly protected

## Recommended Migration Structure

1. Schema changes (CREATE/ALTER TABLE)
2. Type definitions
3. Function definitions
4. Trigger definitions
5. RLS policy definitions
6. Data migrations (if needed)
7. Cleanup (DROP statements for temporary objects) 