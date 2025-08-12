/*
  # Fix foreign key constraint for user creation

  1. Changes
    - Drop the problematic foreign key constraint that references the wrong table
    - The created_by field will still store the admin user's ID but without the constraint
    - This allows user creation to work properly

  2. Security
    - RLS policies still protect the data
    - Application logic handles the created_by relationship
*/

-- Drop the problematic foreign key constraint
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_created_by_fkey;

-- The created_by column will remain but without the foreign key constraint
-- This allows flexibility in user creation while maintaining the audit trail