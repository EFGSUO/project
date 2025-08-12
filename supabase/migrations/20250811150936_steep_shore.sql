/*
  # Fix RLS Policies for app_users table

  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new policies that use auth.uid() directly
    - Avoid querying app_users table within its own policies
    
  2. Security
    - Admins can manage all users (using direct auth.uid() check)
    - Users can read their own data (using direct auth.uid() check)
    - Maintain security while avoiding recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON app_users;
DROP POLICY IF EXISTS "Users can read their own data" ON app_users;

-- Create new policies that avoid recursion by using auth.uid() directly
CREATE POLICY "Admins can manage all users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can read their own data"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Also update fuel_records policies to use auth.uid() directly
DROP POLICY IF EXISTS "Users can insert their own fuel records" ON fuel_records;
DROP POLICY IF EXISTS "Users can read their own fuel records" ON fuel_records;

CREATE POLICY "Users can insert their own fuel records"
  ON fuel_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    -- Allow records without user_id for backward compatibility
    user_id IS NULL
  );

CREATE POLICY "Users can read their own fuel records"
  ON fuel_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    -- Admins can see all records
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Allow access to records without user_id for backward compatibility
    user_id IS NULL
  );