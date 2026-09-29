import React, { useEffect, useState } from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import { soundManager } from '../audio';
import splashArtwork from '../assets/images/developer_splash.png';

interface SplashIntroProps {
  onEnterGame: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onEnterGame }) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const artwork = new Image();
    artwork.onload = async () => {
      try { await artwork.decode(); } catch { /* onload is sufficient on older Android WebViews */ }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (alive) {
          setProgress(100);
          setReady(true);
        }
      }));
    };
    artwork.onerror = () => {
      if (alive) setReady(true);
    };
    artwork.src = splashArtwork;
    if (artwork.complete && artwork.naturalWidth > 0) artwork.onload?.(new Event('load'));
    return () => { alive = false; };
  }, []);

  return (
    <main className="fixed inset-0 z-50 bg-[#050505] overflow-hidden" aria-label="شاشة بدء REMOCAR">
      <img src={splashArtwork} alt="شاشة ترحيب المطور محمد الحزمي" className="absolute inset-0 w-full h-full object-contain" fetchPriority="high" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-center">
        <div className="w-full max-w-xs rounded-2xl border border-amber-400/25 bg-black/55 p-2 backdrop-blur-md">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between px-1 text-[11px] text-slate-300"><span>{ready ? 'اكتمل تجهيز شاشة الدخول' : 'جارٍ تحميل صورة البداية…'}</span><span className="font-mono text-amber-300">{progress}%</span></div>
        </div>
        {ready ? <button onClick={() => { soundManager.playVictory(); onEnterGame(); }} className="flex items-center gap-2 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-400 to-yellow-300 px-8 py-3.5 font-black text-slate-950 shadow-xl shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"><Play className="h-5 w-5 fill-current" /> الدخول إلى اللعبة</button> : <div className="flex items-center gap-2 text-xs text-amber-100/70"><ShieldCheck className="h-4 w-4 text-emerald-400" />جارٍ تجهيز موارد الواجهة</div>}
      </div>
    </main>
  );
};
