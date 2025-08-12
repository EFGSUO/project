import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { Smartphone, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

interface Message {
  type: 'success' | 'error' | null;
  text: string;
}

export function LoginForm() {
  const { signIn } = useAuth();
  const [plateNumber, setPlateNumber] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>({ type: null, text: '' });
  const [showPlateInput, setShowPlateInput] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const clearMessage = () => {
    setMessage({ type: null, text: '' });
  };

  // Debug function to test database connectivity
  const testDatabase = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test 1: Check if we can connect to the database
      const { data: testData, error: testError } = await supabase
        .from('app_users')
        .select('count(*)', { count: 'exact' });

      console.log('🔍 Database connection test:', { testData, testError });

      // Test 2: Get all users regardless of role
      const { data: allUsers, error: allError } = await supabase
        .from('app_users')
        .select('*');

      console.log('🔍 All users in database:', { allUsers, allError });

      // Test 3: Check specifically for users with role='user'
      const { data: regularUsers, error: regularError } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'user');

      console.log('🔍 Users with role="user":', { regularUsers, regularError });

      setDebugInfo(`DB Test: ${allUsers?.length || 0} total users, ${regularUsers?.length || 0} regular users`);

    } catch (error) {
      console.error('❌ Database test failed:', error);
      setDebugInfo(`DB Error: ${error}`);
    }
  };

  // Run database test on component mount
  useEffect(() => {
    testDatabase();
  }, []);

  // Auto-submit when 4 digits are entered and plate number is provided
  useEffect(() => {
    if (enteredCode.length === 4 && plateNumber.trim()) {
      handleSignIn();
    }
  }, [enteredCode, plateNumber]);

  const handleSignIn = async () => {
    if (!plateNumber.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your vehicle plate number.'
      });
      return;
    }

    if (enteredCode.length !== 4) {
      setMessage({
        type: 'error',
        text: 'Please enter a 4-digit passcode.'
      });
      return;
    }

    setIsSubmitting(true);
    clearMessage();

    try {
      const plateUpper = plateNumber.trim().toUpperCase();

      console.log('🔍 Login Debug - Searching for plate:', plateUpper);

      // Find user by assigned vehicle plate number
      const { data: users, error: fetchError } = await supabase
        .from('app_users')
        .select('email, full_name, assigned_vehicles, role')
        .eq('role', 'user');

      console.log('🔍 Database Query Result:', { users, fetchError });

      if (fetchError) {
        console.error('❌ Database fetch error:', fetchError);
        setMessage({
          type: 'error',
          text: `Database error: ${fetchError.message}. Please contact administrator.`
        });
        setEnteredCode('');
        setIsSubmitting(false);
        return;
      }

      if (!users || users.length === 0) {
        console.warn('⚠️ No users found in database with role="user"');

        // Let's also check if there are ANY users at all
        const { data: allUsers, error: allUsersError } = await supabase
          .from('app_users')
          .select('email, role, assigned_vehicles');

        console.log('🔍 All users in database:', { allUsers, allUsersError });

        setMessage({
          type: 'error',
          text: 'No user accounts found. Please contact administrator.'
        });
        setEnteredCode('');
        setIsSubmitting(false);
        return;
      }

      console.log('🔍 Found users:', users.map(u => ({
        email: u.email,
        vehicles: u.assigned_vehicles
      })));

      // Find user who has this plate number assigned
      const matchedUser = users.find(user =>
        user.assigned_vehicles && user.assigned_vehicles.includes(plateUpper)
      );

      console.log('🔍 Matched user for plate', plateUpper, ':', matchedUser);

      if (!matchedUser) {
        console.warn('⚠️ No user found with assigned vehicle:', plateUpper);
        console.log('📋 Available vehicles:', users.flatMap(u => u.assigned_vehicles || []));

        setMessage({
          type: 'error',
          text: `Vehicle ${plateUpper} is not assigned to any user. Please contact administrator.`
        });
        setEnteredCode('');
        setIsSubmitting(false);
        return;
      }

      // Try to authenticate with the matched user's email and the passcode
      const { data: authData, error: authError } = await signIn(matchedUser.email, enteredCode);

      if (authError || !authData) {
        setMessage({
          type: 'error',
          text: 'Invalid passcode. Please try again.'
        });
        setEnteredCode('');
      } else {
        setMessage({
          type: 'success',
          text: `Welcome, ${matchedUser.full_name}! Vehicle: ${plateUpper}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
      setEnteredCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberClick = (number: string) => {
    if (enteredCode.length < 4 && !isSubmitting) {
      setEnteredCode(prev => prev + number);
      if (message.type) clearMessage();
    }
  };

  const handleClear = () => {
    setEnteredCode('');
    if (message.type) clearMessage();
  };

  const handleBackspace = () => {
    setEnteredCode(prev => prev.slice(0, -1));
    if (message.type) clearMessage();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ABAY CONSTRUCTION PLC</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Access Code</h2>
            <p className="text-gray-600 mt-2">Enter your vehicle plate number and 4-digit passcode</p>
          </div>

          <div>
            {/* Vehicle Plate Number Input */}
            {showPlateInput && (
              <div className="mb-8">
                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Vehicle Plate Number
                </label>
                <input
                  type="text"
                  id="plateNumber"
                  value={plateNumber}
                  onChange={(e) => {
                    setPlateNumber(e.target.value.toUpperCase());
                    if (message.type) clearMessage();
                  }}
                  className="w-full px-4 py-3 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="ABC-123"
                  maxLength={10}
                />
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (plateNumber.trim()) {
                        setShowPlateInput(false);
                      } else {
                        setMessage({
                          type: 'error',
                          text: 'Please enter your vehicle plate number.'
                        });
                      }
                    }}
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Passcode input display */}
            {!showPlateInput && (
              <div>
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Vehicle:</p>
                  <p className="text-lg font-bold text-blue-600">{plateNumber}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlateInput(true);
                      setEnteredCode('');
                      clearMessage();
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                  >
                    Change vehicle
                  </button>
                </div>

                <div className="mb-8">
                  <div className="flex justify-center space-x-4 mb-6">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          index < enteredCode.length
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Numeric keypad */}
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() => handleNumberClick(number.toString())}
                        disabled={isSubmitting}
                        className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-full text-xl font-semibold text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {number}
                      </button>
                    ))}

                    {/* Bottom row with 0 and controls */}
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isSubmitting}
                      className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 focus:outline-none flex items-center justify-center"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNumberClick('0')}
                      disabled={isSubmitting}
                      className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-full text-xl font-semibold text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      onClick={handleBackspace}
                      disabled={isSubmitting}
                      className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:outline-none flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message display */}
          {message.type && (
            <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
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

          {/* Status indicator */}
          {isSubmitting && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Authenticating...</span>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {showPlateInput
                ? 'Enter your assigned vehicle plate number to continue'
                : 'Enter your 4-digit passcode provided by your administrator'
              }
            </p>

            {/* Debug Info */}
            {debugInfo && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                Debug: {debugInfo}
              </div>
            )}

            {/* Admin login link */}
            <a
              href="/admin"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              Admin login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
