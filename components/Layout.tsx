
import React, { useState } from 'react';
import { User } from '../types';
import { LayoutDashboard, FilePlus, Users, LogOut, Menu, X, UserCircle, Shield, User as UserIcon, BarChart3 } from 'lucide-react';

interface LayoutProps {
  user: User;
  activeTab: 'dashboard' | 'form' | 'admin' | 'profile';
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'form', label: 'Drive Report', icon: FilePlus },
    ...(user.role === 'ADMIN' ? [{ id: 'admin', label: 'Reports & Analytics', icon: BarChart3 }] : []),
    { id: 'profile', label: 'Profile Settings', icon: UserCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-navy-900 text-white fixed h-full shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-navy-800/50">
          <img src="https://estatego.app/asset/images/logo.png" alt="Logo" className="h-8 brightness-0 invert" />
          <span className="font-bold text-xl tracking-tighter uppercase italic">GoAgent</span>
        </div>

        {/* User Profile Identity Section */}
        <div className="px-6 py-8 border-b border-navy-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center text-cyan-400">
              {user.role === 'ADMIN' ? <Shield size={20} /> : <UserIcon size={20} />}
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-sm uppercase tracking-tight truncate leading-none mb-1">
                {user.fullName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                  user.role === 'ADMIN' 
                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                  : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                }`}>
                  {user.role}
                </span>
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                <span className="text-[8px] font-bold text-navy-400 uppercase">Online</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-cyan-400 text-navy-900 font-bold shadow-lg' : 'hover:bg-navy-800 text-gray-400'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors font-bold text-sm">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <header className="md:hidden bg-navy-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="https://estatego.app/asset/images/logo.png" alt="Logo" className="h-6 brightness-0 invert" />
          <div className="h-4 w-px bg-navy-800 mx-1"></div>
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            {user.fullName.split(' ')[0]}
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 hover:bg-navy-800 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-navy-900 pt-20 px-6 animate-in slide-in-from-top duration-300">
          {/* Mobile Identity Block */}
          <div className="mb-8 p-6 bg-navy-800 rounded-3xl border border-navy-700">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 flex items-center justify-center text-cyan-400">
                {user.role === 'ADMIN' ? <Shield size={24} /> : <UserIcon size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{user.fullName}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{user.role} TERMINAL</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-navy-700 flex justify-between items-center">
               <span className="text-[9px] font-bold text-gray-500 uppercase">Agent Identity Module Verified</span>
               <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase text-emerald-500">Live</span>
               </div>
            </div>
          </div>

          <nav className="space-y-3">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-base font-bold transition-all ${activeTab === item.id ? 'bg-cyan-400 text-navy-900 shadow-xl' : 'text-gray-400 bg-navy-800/50'}`}
              >
                <item.icon size={20} /> {item.label}
              </button>
            ))}
            <div className="pt-6">
              <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 bg-red-400/5 font-bold border border-red-400/20">
                <LogOut size={20} /> Sign Out Terminal
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
