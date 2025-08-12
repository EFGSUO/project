/*
  # Fix Login Access Issue
  
  1. Problem
    - Login form runs as anonymous user
    - Cannot access app_users table due to RLS policies
    - Only authenticated users can read app_users
    
  2. Solution
    - Add anonymous read policy for app_users table
    - Restrict to role='user' for security
    - Allow login process to find users by vehicle plate
*/

-- Allow anonymous read access for login purposes
CREATE POLICY "Enable read access for anonymous users (login)"
  ON app_users
  FOR SELECT
  TO anon
  USING (role = 'user');
