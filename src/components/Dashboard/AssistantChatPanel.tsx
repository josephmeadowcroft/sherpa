import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { AssistantChat } from './AssistantChat';
import { ApplicationRecord } from '../../types';

interface AssistantChatPanelProps {
  open: boolean;
  onClose: () => void;
  applications: Record<string, ApplicationRecord>;
  latestCvScore: number | null;
  onNavigate: (tab: 'dashboard' | 'cv' | 'tracker') => void;
}

export const AssistantChatPanel: React.FC<AssistantChatPanelProps> = ({
  open,
  onClose,
  applications,
  latestCvScore,
  onNavigate,
}) => {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-gray-900/40 backdrop-blur-xs font-sans"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Sherpa AI Chat"
        >
          <motion.div
            className="w-full sm:w-[420px] lg:w-[480px] h-[92vh] sm:h-full bg-white border-l border-gray-200/80 shadow-xl relative flex flex-col overflow-hidden rounded-t-2xl sm:rounded-none"
            initial={reduceMotion ? false : { x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { x: '100%', opacity: 0.9 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3 z-10 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 min-h-0 p-0 sm:p-0">
              <AssistantChat
                applications={applications}
                latestCvScore={latestCvScore}
                onNavigate={(tab) => {
                  onNavigate(tab);
                  if (tab !== 'dashboard') onClose();
                }}
                variant="panel"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
