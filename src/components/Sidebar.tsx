import React from 'react';
import { LayoutDashboard, FileText, Compass, LogOut, Compass as SherpaIcon, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: 'dashboard' | 'cv' | 'tracker';
  onSelectTab: (tab: 'dashboard' | 'cv' | 'tracker') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { userProfile, signOutUser } = useAuth();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cv' as const, label: 'CV Improver', icon: FileText },
    { id: 'tracker' as const, label: 'Application Tracker', icon: Compass },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <SherpaIcon className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg tracking-wide text-white font-sans">SHERPA</h1>
              <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Student Career OS</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 font-semibold text-sm overflow-hidden">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userProfile?.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {userProfile?.displayName || 'Student'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              @{userProfile?.username || 'user'}
            </p>
          </div>
          <button
            onClick={signOutUser}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
