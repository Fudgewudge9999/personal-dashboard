ALTER TABLE tasks
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Backfill completed_at for any tasks that are already marked as completed
UPDATE tasks
SET completed_at = created_at
WHERE status = 'completed' AND completed_at IS NULL;
