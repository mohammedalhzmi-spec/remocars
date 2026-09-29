import React from 'react';
import { Track } from '../types';
import { Flag, Play, Lock, Trophy, Timer } from 'lucide-react';
import { soundManager } from '../audio';

interface TrackSelectProps {
  tracks: Track[];
  playerLevel: number;
  onSelectTrack: (track: Track) => void;
  onBack: () => void;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({
  tracks,
  playerLevel,
  onSelectTrack,
  onBack,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn text-right">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">اختيار حلبة السباق</h2>
          <p className="text-slate-400 text-sm">اختر المسار والتحدي الذي يناسب مهارات قيادتك.</p>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tracks.map((track) => {
          return (
            <div
              key={track.id}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${track.background} border ${
                track.unlocked ? 'border-slate-700 hover:border-red-500 shadow-xl' : 'border-slate-800 opacity-75'
              } p-8 transition-all duration-300 group`}
            >
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                      track.difficulty === 'سهل' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      track.difficulty === 'متوسط' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      الصعوبة: {track.difficulty}
                    </span>
                    <h3 className="text-2xl font-black text-white mb-2">{track.name}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl shadow-lg">
                    🏁
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-300 mb-8">
                  <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10">
                    <Flag className="w-4 h-4 text-red-400" />
                    <span>{track.laps} لفات سباق</span>
                  </div>
                  {track.recordTime && (
                    <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10">
                      <Timer className="w-4 h-4 text-amber-400" />
                      <span>أفضل توقيت: {track.recordTime} ثانية</span>
                    </div>
                  )}
                </div>

                <div>
                  {track.unlocked ? (
                    <button
                      onClick={() => {
                        onSelectTrack(track);
                        soundManager.playBeep(700, 0.1);
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>انطلق إلى السباق</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 bg-slate-900/80 border border-slate-700 text-slate-400 py-4 rounded-2xl font-bold text-sm">
                      <Lock className="w-4 h-4" />
                      <span>{track.requiredLevel ? `مقفلة — افتحها عند المستوى ${track.requiredLevel} (مستواك ${playerLevel})` : 'الحلبة مقفلة — أكمل متطلبات التقدم لفتحها'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
