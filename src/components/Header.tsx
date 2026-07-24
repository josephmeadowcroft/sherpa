import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SherpaMascot } from './SherpaMascot';

interface HeaderProps {
  currentTab: 'dashboard' | 'cv' | 'tracker';
  onSelectTab: (tab: 'dashboard' | 'cv' | 'tracker') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { userProfile, signOutUser } = useAuth();

  const tabs: { id: 'dashboard' | 'cv' | 'tracker'; label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'cv', label: 'CV Optimizer' },
    { id: 'tracker', label: 'Applications' },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Top Left: Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onSelectTab('dashboard')}
        >
          <SherpaMascot size="sm" />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-gray-900 font-sans leading-none group-hover:text-blue-600 transition-colors">
              Sherpa
            </span>
            <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
              AI Career Co-Pilot
            </span>
          </div>
        </div>

        {/* Top Middle: Simplified Text-Only Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 font-semibold bg-blue-50/80 border border-blue-100 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Top Right: Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs overflow-hidden shrink-0">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile?.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-none">
                {userProfile?.displayName || 'Student'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-none">
                {userProfile?.university ? userProfile.university : `@${userProfile?.username || 'student'}`}
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

          <button
            onClick={signOutUser}
            title="Sign Out"
            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
