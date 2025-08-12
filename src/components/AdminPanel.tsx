import React, { useState, useEffect } from 'react';
import { supabase, formatDate, formatFuelAmount, formatOdometerReading } from '../lib/supabase';
import { 
  Settings, 
  Home, 
  LogOut, 
  User, 
  Car, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  Fuel as FuelIcon,
  Users,
  Database,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useAuth, AppUser } from './AuthProvider';
import { UserManagement } from './UserManagement';

export type FuelRecord = {
  id: string;
  plate_number: string;
  filling_date: string;
  fuel_liters: number;
  odometer_reading?: number;
  created_at: string;
  user_id?: string;
};

type SortField = 'filling_date' | 'plate_number' | 'fuel_liters' | 'odometer_reading' | 'created_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'records' | 'users' | 'analytics';

interface GroupedRecord {
  plate_number: string;
  records: FuelRecord[];
  totalFuel: number;
  averageFuel: number;
  recordCount: number;
  latestOdometer?: number;
  firstOdometer?: number;
}

export function AdminPanel() {
  const { appUser, signOut } = useAuth();
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('records');
  const [displayMode, setDisplayMode] = useState<'grouped' | 'flat'>('grouped');

  useEffect(() => {
    if (appUser?.role === 'admin') {
      fetchAllRecords();
    }
  }, [appUser]);

  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const groupRecordsByPlate = (records: FuelRecord[]): GroupedRecord[] => {
    const grouped = records.reduce((acc, record) => {
      const plateNumber = record.plate_number;
      if (!acc[plateNumber]) {
        acc[plateNumber] = [];
      }
      acc[plateNumber].push(record);
      return acc;
    }, {} as Record<string, FuelRecord[]>);

    return Object.entries(grouped).map(([plate_number, records]) => {
      const totalFuel = records.reduce((sum, record) => sum + Number(record.fuel_liters), 0);
      const averageFuel = totalFuel / records.length;
      
      const sortedRecords = records.sort((a, b) => 
        new Date(b.filling_date).getTime() - new Date(a.filling_date).getTime()
      );

      const odometerReadings = sortedRecords
        .map(r => r.odometer_reading)
        .filter(reading => reading !== null && reading !== undefined)
        .map(reading => Number(reading));

      const latestOdometer = odometerReadings.length > 0 ? Math.max(...odometerReadings) : undefined;
      const firstOdometer = odometerReadings.length > 0 ? Math.min(...odometerReadings) : undefined;

      return {
        plate_number,
        records: sortedRecords,
        totalFuel,
        averageFuel,
        recordCount: records.length,
        latestOdometer,
        firstOdometer
      };
    }).sort((a, b) => a.plate_number.localeCompare(b.plate_number));
  };

  const sortedRecords = [...records].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === 'fuel_liters' || sortField === 'odometer_reading') {
      aValue = Number(a[sortField]) || 0;
      bValue = Number(b[sortField]) || 0;
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }

    return sortDirection === 'asc' 
      ? (aValue > bValue ? 1 : -1)
      : (aValue < bValue ? 1 : -1);
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-300'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-300'
            }`} 
          />
        </div>
      </div>
    </th>
  );

  const groupedRecords = groupRecordsByPlate(records);
  const totalFuelConsumed = records.reduce((sum, record) => sum + Number(record.fuel_liters), 0);
  const uniqueVehicles = new Set(records.map(r => r.plate_number)).size;

  if (appUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <Settings className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-4">
              You don't have administrator privileges to access this panel.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Home className="h-4 w-4" />
              Back to Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchAllRecords}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-gray-900 mr-4">ABAY CONSTRUCTION PLC</div>
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{appUser.full_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <Home className="h-4 w-4" />
                Back to Form
              </a>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('records')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'records'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="h-4 w-4" />
              Fuel Records
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'users'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              User Management
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
          </div>
        </div>

        {viewMode === 'users' && (
          <UserManagement currentUser={appUser} />
        )}

        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FuelIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Fuel Consumed</p>
                    <p className="text-2xl font-bold text-gray-900">{totalFuelConsumed.toFixed(2)}L</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900">{uniqueVehicles}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vehicle Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Records
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Fuel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average per Fill
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Latest Fill
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedRecords.map((group) => (
                      <tr key={group.plate_number} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {group.plate_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.recordCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFuelAmount(group.totalFuel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFuelAmount(group.averageFuel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(group.records[0].filling_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'records' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDisplayMode('grouped')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    displayMode === 'grouped'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Car className="h-4 w-4 inline mr-2" />
                  Grouped View
                </button>
                <button
                  onClick={() => setDisplayMode('flat')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    displayMode === 'flat'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Database className="h-4 w-4 inline mr-2" />
                  Table View
                </button>
              </div>
              
              <button
                onClick={fetchAllRecords}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  All Fuel Records ({records.length} total{displayMode === 'grouped' ? `, ${groupedRecords.length} vehicles` : ''})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {displayMode === 'grouped' ? 'Vehicle-wise fuel consumption data' : 'Complete fuel record database'}
                </p>
              </div>

              {displayMode === 'grouped' ? (
                <div className="divide-y divide-gray-200">
                  {groupedRecords.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                      <FuelIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No fuel records found.</p>
                    </div>
                  ) : (
                    groupedRecords.map((group) => (
                      <div key={group.plate_number} className="bg-white p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Car className="h-6 w-6 text-blue-600" />
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {group.plate_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {group.recordCount} records • {group.totalFuel.toFixed(2)}L total • {group.averageFuel.toFixed(2)}L average
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              Latest: {formatDate(group.records[0].filling_date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFuelAmount(group.records[0].fuel_liters)}
                              {group.latestOdometer && (
                                <span className="ml-2">• {group.latestOdometer.toLocaleString()} km</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Date
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <FuelIcon className="h-4 w-4 inline mr-1" />
                                    Fuel (L)
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Odometer (km)
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {group.records.map((record) => (
                                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(record.filling_date)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatFuelAmount(record.fuel_liters)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                      {formatOdometerReading(record.odometer_reading)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(record.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortHeader field="plate_number">Plate Number</SortHeader>
                        <SortHeader field="filling_date">Filling Date</SortHeader>
                        <SortHeader field="fuel_liters">Fuel Liters</SortHeader>
                        <SortHeader field="odometer_reading">Odometer (km)</SortHeader>
                        <SortHeader field="created_at">Created At</SortHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <FuelIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p>No fuel records found.</p>
                          </td>
                        </tr>
                      ) : (
                        sortedRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  {record.plate_number}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(record.filling_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatFuelAmount(record.fuel_liters)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatOdometerReading(record.odometer_reading)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatDate(record.created_at)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}