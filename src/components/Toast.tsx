import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-gray-900 shadow-lg shadow-emerald-500/5',
    error: 'bg-white border-rose-200 text-gray-900 shadow-lg shadow-rose-500/5',
    info: 'bg-white border-blue-200 text-gray-900 shadow-lg shadow-blue-500/5'
  }[toast.type];

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    info: 'text-blue-600'
  }[toast.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }[toast.type];

  return (
    <div className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border font-sans ${bgStyles}`}>
      <div className="flex items-center gap-2.5 text-xs font-semibold">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span>{toast.text}</span>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)} 
        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
