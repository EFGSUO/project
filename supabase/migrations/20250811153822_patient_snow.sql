/*
  # Create Admin User Record

  1. New Records
    - Insert admin user record for admin@admin.com
    - Set role to 'admin' with full access
  
  2. Security
    - Admin user can access all features
    - No vehicle restrictions for admin
*/

-- Insert admin user record
INSERT INTO app_users (email, full_name, role, assigned_vehicles)
VALUES ('admin@admin.com', 'System Administrator', 'admin', '{}')
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  assigned_vehicles = '{}';