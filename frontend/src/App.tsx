import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import AuditPage from './pages/Audit';
import PoliciesPage from './pages/Policies';

const Forbidden = () => (
  <div className="p-8 text-white bg-[#001f3f] min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-2">403</h1>
      <p className="text-blue-300">You do not have access to this page.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />

          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <AppLayout><Chat /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AppLayout><AuditPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/policies" element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AppLayout><PoliciesPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
