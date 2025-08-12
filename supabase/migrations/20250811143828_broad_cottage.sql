/*
  # User Management System

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text, default 'user')
      - `assigned_vehicles` (text array)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
  2. Security
    - Enable RLS on `app_users` table
    - Add policies for admin access and user self-access
    - Update fuel_records policies for user-specific access
    
  3. Changes
    - Add user_id column to fuel_records table
    - Create indexes for performance
    - Add foreign key constraints
*/

-- Create app_users table for managing application users
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  assigned_vehicles text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add user_id to fuel_records to track ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fuel_records' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE fuel_records ADD COLUMN user_id uuid REFERENCES app_users(id);
  END IF;
END $$;

-- Enable RLS on app_users
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_id ON fuel_records(user_id);

-- Policies for app_users table
CREATE POLICY "Admins can manage all users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = (
        SELECT id FROM app_users 
        WHERE email = auth.jwt() ->> 'email'
      ) 
      AND au.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = (
        SELECT id FROM app_users 
        WHERE email = auth.jwt() ->> 'email'
      ) 
      AND au.role = 'admin'
    )
  );

CREATE POLICY "Users can read their own data"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Update fuel_records policies to be user-specific
DROP POLICY IF EXISTS "Anyone can insert fuel records" ON fuel_records;
DROP POLICY IF EXISTS "Anyone can read fuel records" ON fuel_records;

CREATE POLICY "Users can insert their own fuel records"
  ON fuel_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (
      SELECT id FROM app_users 
      WHERE email = auth.jwt() ->> 'email'
    )
    OR
    -- Allow records without user_id for backward compatibility
    user_id IS NULL
  );

CREATE POLICY "Users can read their own fuel records"
  ON fuel_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM app_users 
      WHERE email = auth.jwt() ->> 'email'
    )
    OR
    -- Admins can see all records
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.email = auth.jwt() ->> 'email' 
      AND au.role = 'admin'
    )
    OR
    -- Allow access to records without user_id for backward compatibility
    user_id IS NULL
  );

-- Create a default admin user (this will need to be updated with actual admin email)
-- This is commented out as it should be done manually with the actual admin's email
-- INSERT INTO app_users (email, full_name, role, created_by)
-- VALUES ('admin@example.com', 'System Administrator', 'admin', auth.uid())
-- ON CONFLICT (email) DO NOTHING;