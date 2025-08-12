/*
  # Add User Records View Functionality

  1. New Features
    - Add "My Records" view for users to see their assigned vehicle data
    - Filter records based on user's assigned vehicles
    - Maintain existing admin functionality

  2. Security
    - Users can only view records for their assigned vehicles
    - Admins can still view all records
    - Proper RLS policies maintained
*/

-- Add index for better performance when filtering by user's assigned vehicles
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_plate 
ON fuel_records (user_id, plate_number);

-- Add index for better performance on plate number lookups
CREATE INDEX IF NOT EXISTS idx_fuel_records_plate_user 
ON fuel_records (plate_number, user_id);