import React, { useEffect, useState } from 'react';
import { Gift, Coins, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../audio';

interface DailyRewardModalProps {
  onClaimReward: (rewardCoins: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ onClaimReward }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const rewardAmount = 300;

  useEffect(() => {
    const lastLogin = localStorage.getItem('remocar_last_login');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
      setIsOpen(true);
    }
  }, []);

  const handleClaim = () => {
    const today = new Date().toDateString();
    localStorage.setItem('remocar_last_login', today);
    onClaimReward(rewardAmount);
    soundManager.playCoin();
    setClaimed(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-center overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30 text-slate-950 animate-bounce">
          <Gift className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1 rounded-full text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>مكافأة الدخول اليومية</span>
        </div>

        <h3 className="text-2xl font-black text-white mb-2">أهلاً بك مجدداً يا بطل!</h3>
        <p className="text-slate-300 text-sm mb-6">
          لقد حصلت على هدية الدخول اليومية المتجددة كل 24 ساعة.
        </p>

        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3 shadow-inner">
          <Coins className="w-8 h-8 text-amber-400 animate-pulse" />
          <span className="text-3xl font-black text-amber-400">+{rewardAmount}</span>
          <span className="text-slate-400 text-sm">عملة ذهبية</span>
        </div>

        {claimed ? (
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>تمت إضافة المكافأة إلى رصيدك بنجاح!</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 text-base"
          >
            استلم المكافأة الآن
          </button>
        )}
      </div>
    </div>
  );
};
