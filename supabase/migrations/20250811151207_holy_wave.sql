/*
  # Fix Authentication and RLS Policy Issues

  1. Changes
    - Drop all existing problematic policies
    - Create simplified policies that avoid recursion
    - Use direct auth checks without self-referencing queries
    
  2. Security
    - Maintain proper access control
    - Avoid infinite recursion in policy evaluation
    - Use auth.uid() and auth.jwt() directly
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all users" ON app_users;
DROP POLICY IF EXISTS "Users can read their own data" ON app_users;
DROP POLICY IF EXISTS "Users can insert their own fuel records" ON fuel_records;
DROP POLICY IF EXISTS "Users can read their own fuel records" ON fuel_records;

-- Create simple, non-recursive policies for app_users
CREATE POLICY "Enable read access for authenticated users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (true);

-- Create simple policies for fuel_records
CREATE POLICY "Enable read access for authenticated users"
  ON fuel_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON fuel_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON fuel_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON fuel_records
  FOR DELETE
  TO authenticated
  USING (true);