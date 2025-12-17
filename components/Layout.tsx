import React from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  FilePlus, 
  Users, 
  LogOut, 
  Menu, 
  X,
  TrendingUp
} from 'lucide-react';

interface LayoutProps {
  user: User;
  activeTab: 'dashboard' | 'form' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'form' | 'admin') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'form', label: 'Drive Report', icon: FilePlus },
    ...(user.role === 'ADMIN' ? [{ id: 'admin', label: 'Admin Portal', icon: Users }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-navy-900 text-white fixed h-full shadow-xl">
        <div className="p-6 flex items-center gap-3">
          <img src="https://estatego.app/asset/images/logo.png" alt="Logo" className="h-8 brightness-0 invert" />
          <span className="font-bold text-xl tracking-tight">GoAgent</span>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-cyan-400 text-navy-900 font-bold' 
                : 'hover:bg-navy-800 text-gray-300'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center text-navy-900 font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-xs text-cyan-400 font-medium">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-navy-800 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-navy-900 text-white p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="https://estatego.app/asset/images/logo.png" alt="Logo" className="h-6 brightness-0 invert" />
          <span className="font-bold">GoAgent</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-navy-900 pt-20 px-6 animate-in slide-in-from-top duration-300">
          <nav className="space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg ${
                  activeTab === item.id ? 'bg-cyan-400 text-navy-900 font-bold' : 'text-gray-300'
                }`}
              >
                <item.icon size={24} />
                {item.label}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg text-red-400"
            >
              <LogOut size={24} />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};