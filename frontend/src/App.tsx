import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';

// Placeholder components for other pages
import Chat from './pages/Chat';

const Dashboard = () => <div className="p-8 text-white bg-[#001f3f] min-h-screen">Admin Dashboard coming soon...</div>;
const Audit = () => <div className="p-8 text-white bg-[#001f3f] min-h-screen">Audit Panel coming soon...</div>;
const Policies = () => <div className="p-8 text-white bg-[#001f3f] min-h-screen">Policy Config coming soon...</div>;
const Forbidden = () => <div className="p-8 text-white bg-[#001f3f] min-h-screen">403 - Forbidden: You do not have access to this page.</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
                <Chat />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/audit" 
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Audit />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/policies" 
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <Policies />
              </ProtectedRoute>
            } 
          />

          <Route path="/403" element={<Forbidden />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
