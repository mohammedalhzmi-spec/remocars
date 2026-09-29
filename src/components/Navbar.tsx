import React from 'react';
import { Volume2, VolumeX, Trophy, Coins, Github, Wrench, Flag, Home, User, Medal } from 'lucide-react';
import gameIcon from '../assets/images/remocar_game_icon.webp';

interface NavbarProps {
  coins: number;
  trophies: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigate: (screen: 'menu' | 'garage' | 'tracks') => void;
  currentScreen: string;
  onOpenSync: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  coins,
  trophies,
  soundEnabled,
  onToggleSound,
  onNavigate,
  currentScreen,
  onOpenSync,
  onOpenProfile,
  onOpenLeaderboard,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div 
          onClick={() => onNavigate('menu')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/30 shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform">
            <img src={gameIcon} alt="أيقونة REMOCAR" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-red-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              REMOCAR
            </h1>
            <p className="text-xs text-slate-400">لعبة سيارات التحكم عن بعد 3D</p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => onNavigate('menu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentScreen === 'menu'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </button>
          <button
            onClick={() => onNavigate('tracks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentScreen === 'tracks' || currentScreen === 'game'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Flag className="w-4 h-4" />
            الحلبات والسباق
          </button>
          <button
            onClick={() => onNavigate('garage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentScreen === 'garage'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            المرآب (10 سيارات)
          </button>
        </div>

        {/* Stats & Tools */}
        <div className="flex items-center gap-3">
          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
            title="ملف المتسابق"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">الملف</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
            title="لوحة المتصدرين"
          >
            <Medal className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">المتصدرين</span>
          </button>

          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 font-bold text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* GitHub Sync Button */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">مزامنة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
