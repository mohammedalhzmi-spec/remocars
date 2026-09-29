import React from 'react';
import { Trophy, Clock, X, Award, Medal } from 'lucide-react';
import { LeaderboardEntry, Track } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  tracks: Track[];
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  tracks,
  leaderboard,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-right">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">لوحة المتصدرين المحلية (Leaderboard)</h3>
              <p className="text-xs text-slate-400">أفضل أوقات اللفات المسجلة في كل حلبة مع سيارة الشبح</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
          {tracks.map((track) => {
            const entry = leaderboard.find((l) => l.trackId === track.id);
            return (
              <div key={track.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{track.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Medal className="w-4 h-4 text-amber-400" />
                    <span>المتزعم: {entry ? entry.playerName : 'لم يتم التسجيل بعد'}</span>
                  </div>
                </div>

                <div className="text-left">
                  {entry ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{entry.bestTime.toFixed(2)} ث</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl">لا يوجد رقم قياسي</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-2xl transition-colors text-sm"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
