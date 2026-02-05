-- Fix for duplicate entry error: Remove incorrect unique constraint
-- This allows multiple inactive datasets per user while maintaining single active dataset via logic

USE dataforge;

-- Drop the problematic unique constraint
DROP INDEX IF EXISTS uq_user_active_dataset ON datasets;

-- Verify constraint is removed
SHOW INDEX FROM datasets WHERE Key_name = 'uq_user_active_dataset';