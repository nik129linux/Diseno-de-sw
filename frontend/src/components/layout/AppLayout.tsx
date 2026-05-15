import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart2, FileText, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';

const NAV_EMPLOYEE = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
];

const NAV_ADMIN = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/chat',      label: 'Chat',      icon: MessageSquare },
  { to: '/audit',     label: 'Audit',     icon: FileText },
  { to: '/policies',  label: 'Policies',  icon: Shield },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === 'ROLE_ADMIN' ? NAV_ADMIN : NAV_EMPLOYEE;

  const handleLogout = () => {
    authApi.logout();
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#001f3f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#001229] border-r border-blue-900/50">
        <div className="px-5 py-5 border-b border-blue-900/50">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-400" size={20} />
            <span className="font-bold text-sm tracking-wide">DataShield AI</span>
          </div>
          {user && (
            <p className="text-[11px] text-blue-400 mt-1 truncate" title={user.email}>
              {user.email}
            </p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-blue-300 hover:bg-blue-900/40 hover:text-white'
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-900/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-blue-300 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
