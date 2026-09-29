import React, { useEffect, useState } from 'react';
import { Play, Sparkles, ShieldCheck } from 'lucide-react';
import { soundManager } from '../audio';

interface SplashIntroProps {
  onEnterGame: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onEnterGame }) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setReady(true);
          return 100;
        }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fadeIn overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Developer Logo & Visual Badge */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-red-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
        <div className="relative w-40 h-40 rounded-3xl bg-slate-900 border-2 border-amber-500/50 flex flex-col items-center justify-center p-4 shadow-2xl">
          <span className="text-6xl mb-2">🏎️</span>
          <h2 className="text-amber-400 font-black text-xl tracking-wider">REMOCAR</h2>
          <span className="text-[10px] text-slate-400">3D Racing Experience</span>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm">
        <Sparkles className="w-4 h-4" />
        <span>إصدار النخبة الفاخرة</span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-wide">
        لعبة سيارات التحكم عن بعد <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">الاحترافية</span>
      </h1>
      <p className="text-slate-400 text-sm md:text-base max-w-md mb-8">
        جاري تحميل الحلبات، الفيزياء الواقعية، وجمسيات السيارات الفاخرة...
      </p>

      {/* Loading Bar */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-8 shadow-inner">
        <div className="w-full h-3 bg-slate-950 rounded-xl overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-red-600 to-yellow-400 transition-all duration-100 rounded-xl"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 mt-2 px-1">
          <span>تحميل الموارد 3D</span>
          <span className="font-mono font-bold text-amber-400">{progress}%</span>
        </div>
      </div>

      {ready ? (
        <button
          onClick={() => {
            soundManager.playVictory();
            onEnterGame();
          }}
          className="flex items-center gap-3 bg-gradient-to-r from-amber-500 via-red-600 to-yellow-500 hover:scale-105 active:scale-95 text-slate-950 font-black px-10 py-4 rounded-2xl shadow-2xl shadow-amber-500/40 transition-all text-lg animate-bounce"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>الدخول إلى اللعبة الآن</span>
        </button>
      ) : (
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>جميع الحقوق محفوظة للمطور محمد الحزمي 2026</span>
        </div>
      )}
    </div>
  );
};
