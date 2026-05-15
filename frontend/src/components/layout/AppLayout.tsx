import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart2, FileText, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { cn } from '../../lib/utils';

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
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-primary text-primary-foreground border-r border-primary/20">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-accent" />
            <span className="font-bold text-sm tracking-wide">DataShield AI</span>
          </div>
          {user && (
            <p className="text-[11px] text-white/50 mt-1 truncate" title={user.email}>
              {user.email}
            </p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
