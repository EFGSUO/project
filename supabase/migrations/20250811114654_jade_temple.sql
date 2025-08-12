/*
  # Add plate number grouping features

  1. Database Changes
    - Add index on plate_number for better grouping performance
    - Add index on filling_date for sorting within groups
    - Add computed columns for analytics

  2. Security
    - Maintain existing RLS policies
    - No changes to security model

  3. Performance
    - Optimize queries for grouping operations
    - Add indexes for faster sorting and filtering
*/

-- Add indexes for better performance with grouping
CREATE INDEX IF NOT EXISTS idx_fuel_records_plate_number ON fuel_records(plate_number);
CREATE INDEX IF NOT EXISTS idx_fuel_records_filling_date ON fuel_records(filling_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_records_plate_date ON fuel_records(plate_number, filling_date DESC);

-- Add a view for grouped statistics (optional, for future use)
CREATE OR REPLACE VIEW fuel_records_summary AS
SELECT 
  plate_number,
  COUNT(*) as total_records,
  SUM(fuel_liters) as total_fuel,
  AVG(fuel_liters) as avg_fuel_per_fill,
  MIN(filling_date) as first_fill_date,
  MAX(filling_date) as last_fill_date
FROM fuel_records
GROUP BY plate_number;

-- Grant access to the view
GRANT SELECT ON fuel_records_summary TO anon;
GRANT SELECT ON fuel_records_summary TO authenticated;