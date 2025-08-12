import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { FuelForm } from './components/FuelForm';
import { AdminPanel } from './components/AdminPanel';
import { LoginForm } from './components/LoginFormNew';
import { AdminLoginForm } from './components/AdminLoginForm';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show AdminLoginForm for /admin route, regular LoginForm for others
    if (location.pathname === '/admin') {
      return <AdminLoginForm />;
    }
    return <LoginForm />;
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<FuelForm />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;