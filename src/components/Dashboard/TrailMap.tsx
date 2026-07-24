import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TrailMapProps {
  nextStep?: React.ReactNode;
  activityFeed?: React.ReactNode;
}

export const TrailMap: React.FC<TrailMapProps> = ({ nextStep, activityFeed }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-full h-dvh overflow-hidden bg-[#FAFAF8]"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Layered mountain scene */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8F0FE" />
            <stop offset="55%" stopColor="#F5F7FA" />
            <stop offset="100%" stopColor="#FAFAF8" />
          </linearGradient>
          <linearGradient id="farRidge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="midRidge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="nearRidge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
            <stop offset="40%" stopColor="#A7F3D0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <rect width="1200" height="700" fill="url(#skyGrad)" />

        <circle cx="980" cy="110" r="42" fill="#FDE68A" fillOpacity="0.45" />
        <circle cx="980" cy="110" r="28" fill="#FBBF24" fillOpacity="0.35" />

        <motion.g
          animate={reduceMotion ? undefined : { x: [0, 28, 0] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 28, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <ellipse cx="180" cy="90" rx="48" ry="18" fill="#FFFFFF" fillOpacity="0.55" />
          <ellipse cx="210" cy="85" rx="32" ry="14" fill="#FFFFFF" fillOpacity="0.5" />
          <ellipse cx="150" cy="95" rx="28" ry="12" fill="#FFFFFF" fillOpacity="0.45" />
        </motion.g>
        <motion.g
          animate={reduceMotion ? undefined : { x: [0, -22, 0] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 34, repeat: Infinity, ease: 'easeInOut', delay: 2 }
          }
        >
          <ellipse cx="620" cy="70" rx="40" ry="14" fill="#FFFFFF" fillOpacity="0.4" />
          <ellipse cx="650" cy="66" rx="26" ry="11" fill="#FFFFFF" fillOpacity="0.35" />
        </motion.g>

        <path
          d="M0 320 L120 220 L240 300 L360 180 L480 280 L600 200 L720 290 L840 160 L960 270 L1080 210 L1200 300 L1200 700 L0 700 Z"
          fill="url(#farRidge)"
        />
        <path
          d="M0 400 L100 310 L220 380 L340 260 L460 360 L580 290 L700 370 L820 250 L940 350 L1060 280 L1200 380 L1200 700 L0 700 Z"
          fill="url(#midRidge)"
        />
        <path
          d="M0 480 L140 400 L280 460 L420 380 L560 450 L700 390 L840 470 L980 400 L1200 460 L1200 700 L0 700 Z"
          fill="url(#nearRidge)"
        />
        <path
          d="M0 560 Q300 520 600 550 T1200 540 L1200 700 L0 700 Z"
          fill="#ECFDF5"
          fillOpacity="0.65"
        />
        <path d="M340 260 L360 180 L380 240 Z" fill="#FFFFFF" fillOpacity="0.7" />
        <path d="M820 250 L840 160 L860 230 Z" fill="#FFFFFF" fillOpacity="0.75" />
        <path d="M1060 280 L1080 210 L1100 260 Z" fill="#FFFFFF" fillOpacity="0.65" />
      </svg>

      {/* Sherpa next-step chat — centered */}
      {nextStep && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none px-4 sm:px-8 pt-16 pb-8">
          <div className="w-full max-w-4xl pointer-events-auto">{nextStep}</div>
        </div>
      )}

      {/* Activity feed — top right */}
      {activityFeed && (
        <div className="absolute top-20 right-4 z-30 w-[min(100%-2rem,20rem)] max-h-[min(45vh,26rem)] overflow-y-auto pointer-events-auto hidden lg:block">
          {activityFeed}
        </div>
      )}
    </motion.div>
  );
};
