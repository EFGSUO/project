/*
  # Create Auth Trigger for User Management

  1. New Functions
    - `handle_new_user()` - Automatically creates app_users record when auth user is created
    - Ensures proper user management flow

  2. Triggers
    - Trigger on auth.users insert to create corresponding app_users record

  3. Security
    - Function runs with security definer privileges
    - Maintains data consistency between auth.users and app_users tables
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create app_users record if one doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users WHERE email = NEW.email
  ) THEN
    INSERT INTO public.app_users (
      id,
      email,
      full_name,
      role,
      assigned_vehicles
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'user',
      '{}'::text[]
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create app_users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();