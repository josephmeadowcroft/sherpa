import React from 'react';
import { Sparkles } from 'lucide-react';

interface OrbProps {
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  statusText?: string;
}

export const Orb: React.FC<OrbProps> = ({ isThinking = false, size = 'md', statusText }) => {
  const dimensions = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        {/* Outer Glow Ambient Halo */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 opacity-40 blur-2xl transition-all duration-700 ${
            isThinking ? 'scale-125 opacity-70 animate-pulse' : 'scale-105 opacity-30 hover:opacity-50'
          }`}
        />

        {/* Ring 3 (Outer Pulsing Ring) */}
        <div 
          className={`absolute inset-0 rounded-full border border-cyan-500/30 transition-all duration-1000 ${
            isThinking ? 'animate-ping opacity-60' : 'scale-110 opacity-20'
          }`}
        />

        {/* Ring 2 (Rotating Dashed Ring) */}
        <div 
          className={`absolute inset-2 rounded-full border-2 border-dashed border-cyan-400/40 transition-transform duration-1000 ${
            isThinking ? 'animate-spin' : 'hover:rotate-45'
          }`}
          style={{ animationDuration: isThinking ? '3s' : '12s' }}
        />

        {/* Ring 1 (Inner Cyan Gradient Ring) */}
        <div 
          className={`absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-600/30 via-cyan-400/20 to-blue-600/30 border border-cyan-400/60 backdrop-blur-sm transition-all duration-500 ${
            isThinking ? 'scale-110 border-cyan-300' : 'scale-100'
          }`}
        />

        {/* Core Orb Center */}
        <div 
          className={`relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 shadow-inner shadow-cyan-200 flex items-center justify-center transition-all duration-500 ${
            isThinking ? 'scale-110 shadow-cyan-400/80 animate-pulse' : 'shadow-cyan-500/50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-950/40 backdrop-blur-md flex items-center justify-center text-cyan-200">
            <Sparkles className={`w-5 h-5 ${isThinking ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
          </div>
        </div>
      </div>

      {/* Status indicator pill beneath orb */}
      <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-md">
        <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
        <span className="text-xs font-semibold text-slate-300">
          {statusText || (isThinking ? 'Sherpa is processing...' : 'Sherpa AI Assistant Active')}
        </span>
      </div>
    </div>
  );
};
