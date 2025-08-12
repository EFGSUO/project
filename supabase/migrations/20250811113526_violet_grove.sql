/*
  # Create fuel records table

  1. New Tables
    - `fuel_records`
      - `id` (uuid, primary key)
      - `plate_number` (text, vehicle plate number)
      - `filling_date` (date, when the fueling occurred)
      - `fuel_liters` (numeric, amount of fuel in liters)
      - `created_at` (timestamp, when record was created)

  2. Security
    - Enable RLS on `fuel_records` table
    - Add policy for public read/write access (suitable for logging app)
*/

CREATE TABLE IF NOT EXISTS fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text NOT NULL,
  filling_date date NOT NULL,
  fuel_liters numeric(8,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fuel records"
  ON fuel_records
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert fuel records"
  ON fuel_records
  FOR INSERT
  TO public
  WITH CHECK (true);