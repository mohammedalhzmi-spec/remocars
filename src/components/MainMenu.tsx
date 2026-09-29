import React from 'react';
import { Play, Wrench, Flag, Trophy, Sparkles, Gamepad2, Info } from 'lucide-react';
import { Car } from '../types';

interface MainMenuProps {
  selectedCar: Car;
  onNavigate: (screen: 'menu' | 'garage' | 'tracks' | 'game') => void;
  onOpenInstructions: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedCar,
  onNavigate,
  onOpenInstructions,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl mb-10 text-right">
        {/* Background neon glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>النسخة الاحترافية المحدثة</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              سباق سيارات التحكم عن بعد <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">REMOCAR</span>
            </h2>
            <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed">
              انطلق بأقصى سرعة، تفادى المنعطفات، اجمع العملات المعدنية، وقم بترقية سيارتك لتصبح بطل حلبات الريموت كنترول بلا منازع!
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('tracks')}
                className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 text-lg"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>ابدأ السباق الآن</span>
              </button>
              <button
                onClick={() => onNavigate('garage')}
                className="flex items-center gap-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-base"
              >
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>المرآب والتطوير</span>
              </button>
            </div>
          </div>

          {/* Featured Car Showcase Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl w-full md:w-80 text-center relative group">
            <div className="absolute top-3 left-3 bg-red-600/20 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
              سيارتك الحالية
            </div>
            <div className="text-7xl mb-4 py-4 group-hover:scale-110 transition-transform duration-300">
              {selectedCar.imageIcon}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedCar.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedCar.description}</p>
            
            <div className="space-y-2 text-xs text-right">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>السرعة</span>
                  <span>{selectedCar.speed}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${selectedCar.speed}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>التسارع</span>
                  <span>{selectedCar.acceleration}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedCar.acceleration}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>التحكم</span>
                  <span>{selectedCar.handling}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedCar.handling}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div 
          onClick={() => onNavigate('tracks')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <Flag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">الحلبات والمسارات</h3>
          <p className="text-sm text-slate-400">اختر من بين 4 حلبات متميزة بتحديات مختلفة واختبر مهارات قيادتك.</p>
        </div>

        <div 
          onClick={() => onNavigate('garage')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">مرآب السيارات والتطوير</h3>
          <p className="text-sm text-slate-400">افتح سيارات جديدة وطور المحرك والنيترو والإطارات لأداء أقوى.</p>
        </div>

        <div 
          onClick={onOpenInstructions}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">طريقة اللعب والتحكم</h3>
          <p className="text-sm text-slate-400">تعرف على مفاتيح الأسهم أو أزرار الشاشة للتحكم وتفعيل النيترو.</p>
        </div>
      </div>
    </div>
  );
};
