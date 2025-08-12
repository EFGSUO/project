/*
  # Add odometer field to fuel records

  1. Schema Changes
    - Add `odometer_reading` column to `fuel_records` table
    - Column will store odometer reading as numeric value
    - Add index for better query performance

  2. Data Migration
    - New column allows NULL values for existing records
    - Future records can optionally include odometer readings
*/

-- Add odometer_reading column to fuel_records table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fuel_records' AND column_name = 'odometer_reading'
  ) THEN
    ALTER TABLE fuel_records ADD COLUMN odometer_reading numeric(10,2);
  END IF;
END $$;

-- Add index for odometer_reading for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fuel_records' AND indexname = 'idx_fuel_records_odometer'
  ) THEN
    CREATE INDEX idx_fuel_records_odometer ON fuel_records (odometer_reading);
  END IF;
END $$;

-- Add index for plate_number and odometer_reading combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fuel_records' AND indexname = 'idx_fuel_records_plate_odometer'
  ) THEN
    CREATE INDEX idx_fuel_records_plate_odometer ON fuel_records (plate_number, odometer_reading DESC);
  END IF;
END $$;