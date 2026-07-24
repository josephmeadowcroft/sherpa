import React from 'react';
import { LogOut, User as UserIcon, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: 'dashboard' | 'cv' | 'tracker';
  onSelectTab: (tab: 'dashboard' | 'cv' | 'tracker') => void;
  onOpenPeers?: () => void;
  onOpenChat?: () => void;
  /** When true, header floats over content (full-bleed overview). */
  overlay?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenPeers,
  onOpenChat,
  overlay = false,
}) => {
  const { userProfile, signOutUser } = useAuth();

  const tabs: { id: 'dashboard' | 'cv' | 'tracker'; label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'cv', label: 'CV Optimizer' },
    { id: 'tracker', label: 'Applications' },
  ];

  return (
    <header
      className={`w-full bg-transparent z-40 select-none ${
        overlay ? 'absolute top-0 inset-x-0' : 'sticky top-0 shrink-0'
      }`}
    >      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand name only */}
        <button
          type="button"
          className="flex flex-col text-left cursor-pointer group"
          onClick={() => onSelectTab('dashboard')}
        >
          <span className="font-bold text-base tracking-tight text-gray-900 font-sans leading-none group-hover:text-blue-600 transition-colors">
            Sherpa
          </span>
          <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
            AI Career Co-Pilot
          </span>
        </button>

        {/* Tabs — solid surfaces on interactive pills */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 p-1 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-sm">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 font-semibold bg-blue-50 border border-blue-100 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/90'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right actions — solid control cluster */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-sm">
          {onOpenPeers && (
            <button
              type="button"
              onClick={onOpenPeers}
              title="Peer Network"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              title="AI Chat"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          <div className="h-4 w-px bg-gray-200 mx-0.5 hidden sm:block" />

          <div className="flex items-center gap-2 px-1.5 py-0.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs overflow-hidden shrink-0">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile?.displayName?.charAt(0).toUpperCase() || (
                  <UserIcon className="w-4 h-4 text-gray-500" />
                )
              )}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-semibold text-gray-900 leading-none">
                {userProfile?.displayName || 'Student'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-none">
                {userProfile?.university
                  ? userProfile.university
                  : `@${userProfile?.username || 'student'}`}
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 mx-0.5 hidden sm:block" />

          <button
            onClick={signOutUser}
            title="Sign Out"
            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium pr-1">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
