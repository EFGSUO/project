import React, { useState } from 'react';
import { supabase, formatDate } from '../lib/supabase';
import { Fuel, CheckCircle, AlertCircle, LogOut, User } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface FormData {
  plateNumber: string;
  fillingDate: string;
  fuelLiters: string;
  odometerReading: string;
}

interface Message {
  type: 'success' | 'error' | null;
  text: string;
}

export function FuelForm() {
  const { appUser, signOut } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    plateNumber: '',
    fillingDate: new Date().toISOString().split('T')[0],
    fuelLiters: '',
    odometerReading: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>({ type: null, text: '' });

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      fillingDate: new Date().toISOString().split('T')[0],
      fuelLiters: '',
      odometerReading: ''
    });
  };

  const clearMessage = () => {
    setMessage({ type: null, text: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (appUser && appUser.assigned_vehicles.length > 0) {
      const plateUpper = formData.plateNumber.toUpperCase();
      if (!appUser.assigned_vehicles.includes(plateUpper)) {
        setMessage({
          type: 'error',
          text: `You are not authorized to add records for vehicle ${plateUpper}. Contact your administrator.`
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    clearMessage();

    try {
      const { error } = await supabase
        .from('fuel_records')
        .insert([
          {
            plate_number: formData.plateNumber.toUpperCase(),
            filling_date: formData.fillingDate,
            fuel_liters: parseFloat(formData.fuelLiters),
            odometer_reading: formData.odometerReading ? parseFloat(formData.odometerReading) : null,
            user_id: appUser?.id
          }
        ]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Fuel record submitted successfully!'
      });
      
      resetForm();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit record'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message.type) clearMessage();
  };

  const isVehicleRestricted = appUser && appUser.assigned_vehicles.length > 0;
  const vehicleListText = isVehicleRestricted 
    ? `Record fuel data for: ${appUser.assigned_vehicles.join(', ')}`
    : 'Record your vehicle\'s fuel consumption';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ABAY CONSTRUCTION PLC</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>
          
          {appUser && (
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{appUser.full_name}</p>
                  <p className="text-xs text-gray-500">{appUser.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Fuel className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Fuel Data Logger</h2>
            <p className="text-gray-600 mt-2">{vehicleListText}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Plate Number
              </label>
              <input
                type="text"
                id="plateNumber"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="e.g., ABC-123"
                list={isVehicleRestricted ? "vehicles" : undefined}
              />
              {isVehicleRestricted && (
                <datalist id="vehicles">
                  {appUser.assigned_vehicles.map((vehicle) => (
                    <option key={vehicle} value={vehicle} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label htmlFor="fillingDate" className="block text-sm font-medium text-gray-700 mb-2">
                Filling Date
              </label>
              <input
                type="date"
                id="fillingDate"
                name="fillingDate"
                value={formData.fillingDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="fuelLiters" className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Liters
              </label>
              <input
                type="number"
                id="fuelLiters"
                name="fuelLiters"
                value={formData.fuelLiters}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="e.g., 45.50"
              />
            </div>

            <div>
              <label htmlFor="odometerReading" className="block text-sm font-medium text-gray-700 mb-2">
                Odometer Reading (km)
              </label>
              <input
                type="number"
                id="odometerReading"
                name="odometerReading"
                value={formData.odometerReading}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="e.g., 15000.5"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Enter the current odometer reading
              </p>
            </div>

            {message.type && (
              <div className={`flex items-center gap-2 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Record'}
            </button>
          </form>

          <div className="mt-8 text-center">
            {appUser?.role === 'admin' && (
              <a
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                View Admin Panel →
              </a>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}