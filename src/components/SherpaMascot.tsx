import React from 'react';

interface SherpaMascotProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}

export const SherpaMascot: React.FC<SherpaMascotProps> = ({ size = 'md', isThinking = false, className = '' }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center ${dimensions} ${className}`}>
      {/* Background glow when thinking */}
      {isThinking && (
        <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping" />
      )}
      
      {/* SVG Sherpa Mascot Icon */}
      <div className={`relative w-full h-full rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/40 p-1.5 overflow-hidden ${isThinking ? 'animate-bounce' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          {/* Mountain Peak Base */}
          <path d="M20 80 L50 25 L80 80 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="7" />
          {/* Snow Cap / Beanie */}
          <path d="M38 46 L50 25 L62 46 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="4" />
          {/* Warm Beanie Pom / Summit Flag */}
          <circle cx="50" cy="18" r="6" fill="#F59E0B" stroke="#F59E0B" />
          {/* Cute Mascot Eyes */}
          <circle cx="43" cy="60" r="3.5" fill="#FFFFFF" stroke="none" />
          <circle cx="57" cy="60" r="3.5" fill="#FFFFFF" stroke="none" />
          {/* Friendly Smile */}
          <path d="M46 68 Q50 72 54 68" stroke="#FFFFFF" strokeWidth="4" fill="none" />
        </svg>
      </div>
    </div>
  );
};
