import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FuelRecord = {
  id: string;
  plate_number: string;
  filling_date: string;
  fuel_liters: number;
  odometer_reading?: number;
  created_at: string;
  user_id?: string;
};

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  assigned_vehicles: string[];
  created_at: string;
  created_by?: string;
};

// Utility functions for common operations
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatFuelAmount = (liters: number) => {
  return `${Number(liters).toFixed(2)} L`;
};

export const formatOdometerReading = (reading?: number) => {
  return reading ? `${Number(reading).toLocaleString()} km` : 'N/A';
};