import React, { useEffect, useState } from 'react';
import { User, Award, Sparkles, X, Check, Star, Coins } from 'lucide-react';
import { PlayerProfile } from '../types';
import { soundManager } from '../audio';
import { getLevelBenefits, getLevelReward, getLevelTitle, getNextMilestone } from '../data/progression';

interface PlayerProfileModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  stars: number;
  onUpdateProfile: (name: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  profile,
  stars,
  onUpdateProfile,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(profile.name);

  useEffect(() => {
    if (isOpen) setNameInput(profile.name);
  }, [isOpen, profile.name]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (nameInput.trim()) {
      onUpdateProfile(nameInput.trim());
      soundManager.playCoin();
      onClose();
    }
  };

  const benefits = getLevelBenefits(profile.level);
  const xpInCurrentLevel = Math.max(0, profile.xp - (profile.level - 1) * 500);
  const nextLevelReward = getLevelReward(profile.level + 1);
  const nextMilestone = getNextMilestone(profile.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-right">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">ملف المتسابق الاحترافي</h3>
              <p className="text-xs text-slate-400">تخصيص الاسم ومستوى التقدم (XP)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1 rounded-full text-xs font-bold mb-2">
              <Award className="w-4 h-4" />
              <span>{getLevelTitle(profile.level)} (المستوى {profile.level})</span>
            </div>
            <div className="text-2xl font-black text-white mb-1">{profile.name}</div>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>خبرة هذا المستوى: {xpInCurrentLevel} / 500 XP</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-300"><Star className="h-4 w-4 fill-current" />{stars}</span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                style={{ width: `${Math.min(100, (xpInCurrentLevel / 500) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">اسم المتسابق</label>
            <input
              type="text"
              dir="auto"
              maxLength={18}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="أدخل اسمك المستعار..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>ميزات المستوى الحالي الحصرية:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              السرعة القصوى +{benefits.speedBonusPct.toFixed(1)}% · التسارع +{benefits.accelerationBonusPct.toFixed(1)}% · التوجيه +{benefits.handlingBonusPct.toFixed(1)}% · سعة النيترو {benefits.nitroCapacity}% · مكافآت السباق ×{benefits.coinMultiplier.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-slate-300">
            <div className="mb-2 flex items-center gap-2 font-bold text-amber-300"><Coins className="h-4 w-4" />جائزة المستوى التالي: +{nextLevelReward.coins} عملة ونجمة جديدة</div>
            <p>{nextMilestone ? `مكافأة المستوى ${nextMilestone.level}: ${nextMilestone.description}` : 'واصل السباق لزيادة السرعة ومكافآت العملات.'}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>حفظ وتحديث الملف</span>
        </button>
      </div>
    </div>
  );
};
