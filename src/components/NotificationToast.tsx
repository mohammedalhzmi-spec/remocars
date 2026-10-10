import React, { useEffect } from 'react';
import { Trophy, Sparkles, X, Bell } from 'lucide-react';
import { soundManager } from '../audio';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'upgrade' | 'reward';
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = 'success',
  onClose,
}) => {
  useEffect(() => {
    soundManager.playCoin();
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-bounce duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-right max-w-sm backdrop-blur-md">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
          {type === 'upgrade' ? <Sparkles className="w-6 h-6 animate-spin" /> : <Bell className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-indigo-400 mb-0.5">إشعار إنجاز لعبة Remocar</h4>
          <p className="text-sm font-semibold text-white leading-snug">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
