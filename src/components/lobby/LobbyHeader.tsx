import React, { useState } from 'react';
import { Radio, LogOut, User as UserIcon, ShieldCheck, Wallet, TrendingUp, Compass, LayoutDashboard, Settings, Home, Menu, X } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '../../../shared/constants/constants';
import { User } from '../../../shared/types';

interface LobbyHeaderProps {
  currentUser: User | null;
  currentPath?: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  currentUser,
  currentPath = '/',
  onNavigate,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { label: 'Home', path: '/', icon: Home, id: 'nav-home-btn' },
    { label: 'Discovery', path: '/discovery', icon: Compass, id: 'nav-discovery-btn' },
    { label: 'Wallet', path: '/wallet', icon: Wallet, id: 'nav-wallet-btn' },
    { label: 'Creator Dashboard', path: '/dashboard', icon: LayoutDashboard, id: 'nav-dashboard-btn' },
    { label: 'Earnings', path: '/earnings', icon: TrendingUp, id: 'nav-earnings-btn' },
    { label: 'Profile', path: '/profile', icon: UserIcon, id: 'nav-profile-btn' },
    { label: 'Settings', path: '/settings', icon: Settings, id: 'nav-settings-btn' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          id="nav-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight">{APP_NAME}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest hidden sm:inline-block">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                id={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Badge & Logout / Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">{currentUser?.email}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
          </div>

          <button
            id="logout-button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all duration-150 shadow-sm cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white lg:hidden cursor-pointer"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
