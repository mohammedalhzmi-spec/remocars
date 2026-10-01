import React, { useState, useEffect } from 'react';
import { Play, Wrench, Flag, Trophy, Sparkles, Gamepad2, Target, Video, Wifi, Star } from 'lucide-react';
import { Car } from '../types';
import heroBanner from '../assets/images/remocar_home_hero.webp';
import gameIcon from '../assets/images/remocar_game_icon.webp';
import { getLevelTitle } from '../data/progression';
import { RaceCoachSelector } from './RaceCoachSelector';
import { VehicleArtwork } from './VehicleArtwork';
const CarShowroom = React.lazy(() => import('./CarShowroom').then((module) => ({ default: module.CarShowroom })));

interface MainMenuProps {
  selectedCar: Car;
  playerName: string;
  profileLevel: number;
  profileXp: number;
  stars: number;
  carsCount: number;
  tracksCount: number;
  selectedCoachId: string;
  onSelectCoach: (coachId: string) => void;
  onPlayCoachVoice: (coachId: string) => void;
  hasReplay: boolean;
  onNavigate: (screen: 'menu' | 'garage' | 'tracks' | 'game' | 'replay') => void;
  onOpenInstructions: () => void;
  onOpenMissions: () => void;
  onOpenMultiplayer: () => void;
  onOpenCareerEvents: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedCar,
  playerName,
  profileLevel,
  profileXp,
  stars,
  carsCount,
  tracksCount,
  selectedCoachId,
  onSelectCoach,
  onPlayCoachVoice,
  hasReplay,
  onNavigate,
  onOpenInstructions,
  onOpenMissions,
  onOpenMultiplayer,
  onOpenCareerEvents,
}) => {
  const [showCopyright, setShowCopyright] = useState(true);
  const levelXp = Math.max(0, profileXp - (profileLevel - 1) * 500);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCopyright((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 animate-fadeIn">
      {/* Developer Copyright Pulsing Banner */}
      <div aria-live="polite" className={`mb-6 text-center transition-opacity duration-1000 ${showCopyright ? 'opacity-100' : 'opacity-0'}`}>
        <div className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 px-6 py-2 rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-amber-500/10 backdrop-blur-md">
          <span className="block">هذه اللعبة من برمجة وتطوير المطور محمد الحزمي</span>
          <span className="block">جميع الحقوق محفوظة 2026</span>
        </div>
      </div>

      {/* Hero Banner with Generated AI Image */}
      <div className="relative min-h-[320px] md:min-h-[360px] overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-6 text-right">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBanner}
            alt="سيارة REMOCAR على طريق جبلي سريع"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-75 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-950/55 to-slate-950/10" />
        </div>

        <div className="relative z-10 p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold text-amber-200">أهلاً {playerName} · موسم السباقات الجديد</p>
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span>دعم اللعب الجماعي عبر Wi-Fi المحلي بدون إنترنت</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight drop-shadow-md">
              سباق سيارات التحكم عن بعد <span className="bg-gradient-to-r from-red-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent">REMOCAR</span>
            </h2>
            <p className="text-slate-200 text-base md:text-lg mb-6 leading-relaxed drop-shadow">
              تنافس مع أصدقائك عبر شبكة الواي فاي المحلية (بدون إنترنت)، في مضامير طويلة وممتعة شبه واقعية مع مكافآت مضاعفة وأجواء 3D مذهلة!
            </p>
            <div className="mb-6 max-w-xl rounded-2xl border border-white/15 bg-slate-950/65 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-black text-amber-200">المستوى {profileLevel} · {getLevelTitle(profileLevel)}</span>
                <span className="inline-flex items-center gap-1 text-amber-300"><Star className="h-4 w-4 fill-current" />{stars} نجمة</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${Math.min(100, levelXp / 5)}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-300"><span>{levelXp} / 500 XP إلى المستوى التالي</span><span>{carsCount} سيارة · {tracksCount} مضمار</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('tracks')}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-red-600/40 transition-all hover:scale-105 active:scale-95 text-base"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>السباق الفردي</span>
              </button>
              <button
                onClick={onOpenMultiplayer}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 text-base"
              >
                <Wifi className="w-6 h-6 animate-pulse" />
                <span>اللعب الجماعي Wi-Fi</span>
              </button>
              {hasReplay && (
                <button
                  onClick={() => onNavigate('replay')}
                  className="flex items-center gap-3 bg-emerald-600/90 hover:bg-emerald-600 backdrop-blur-md border border-emerald-400/30 text-white font-bold px-6 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-base"
                >
                  <Video className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>الإعادة</span>
                </button>
              )}
            </div>
          </div>

          {/* Featured Car Showcase Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl w-full md:w-80 text-center relative group">
            <div className="absolute top-3 right-3 w-10 h-10 rounded-2xl overflow-hidden border border-amber-500/40 shadow-md">
              <img
                src={gameIcon}
                alt="Remocar Icon"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-3 left-3 bg-red-600/20 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
              سيارتك الحالية
            </div>
            <React.Suspense fallback={<div className="h-40"><VehicleArtwork car={selectedCar} /></div>}>
              <CarShowroom car={selectedCar} compact />
            </React.Suspense>
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

      <RaceCoachSelector level={profileLevel} selectedCoachId={selectedCoachId} onSelect={onSelectCoach} onPlayVoice={onPlayCoachVoice} />

      {/* Quick Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5 mb-10">
        <div 
          onClick={() => onNavigate('tracks')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <Flag className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">المضامير الطويلة</h3>
          <p className="text-sm text-slate-400">مضامير طويلة وشبه واقعية بمكافئات مضاعفة.</p>
        </div>

        <div 
          onClick={() => onNavigate('garage')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">المرآب ({carsCount} سيارة)</h3>
          <p className="text-sm text-slate-400">سيارات 3D عالية التفاصيل، مع ألوان ومكافآت تفتح مع تقدم مستواك.</p>
        </div>

        <div 
          onClick={onOpenMissions}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">المهام اليومية</h3>
          <p className="text-sm text-slate-400">أنجز التحديات اليومية واجمع عملات إضافية.</p>
        </div>

        <div
          onClick={onOpenCareerEvents}
          className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-400/60 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">بطولات المسيرة</h3>
          <p className="text-sm text-slate-400">سلاسل سباق فردية من عدة جولات ومكافآت نهائية.</p>
        </div>

        <div 
          onClick={onOpenInstructions}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 cursor-pointer group transition-all hover:-translate-y-1 shadow-xl text-right"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">طريقة اللعب والتحكم</h3>
          <p className="text-sm text-slate-400">تعرف على مفاتيح لوحة المفاتيح والنيترو وزوايا الكاميرا.</p>
        </div>
      </div>
    </div>
  );
};
