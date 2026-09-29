import React, { useState } from 'react';
import { User, Award, Shield, Sparkles, X, Check } from 'lucide-react';
import { PlayerProfile } from '../types';
import { soundManager } from '../audio';

interface PlayerProfileModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onUpdateProfile: (name: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(profile.name);

  if (!isOpen) return null;

  const handleSave = () => {
    if (nameInput.trim()) {
      onUpdateProfile(nameInput.trim());
      soundManager.playCoin();
      onClose();
    }
  };

  const getPerksForLevel = (lvl: number) => {
    if (lvl >= 5) return 'سرعة قصوى +20% | نيترو لا ينفد بسرعة | أرباح مضاعفة x3';
    if (lvl >= 3) return 'سرعة قصوى +10% | تحكم احترافي في المنعطفات';
    if (lvl >= 2) return 'نيترو إضافي +15%';
    return 'المستوى الأساسي للمتسابقيين';
  };

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
              <span>{profile.title} (المستوى {profile.level})</span>
            </div>
            <div className="text-2xl font-black text-white mb-1">{profile.name}</div>
            <p className="text-xs text-slate-400 mb-3">خبرة اللعب (XP): {profile.xp} / {profile.level * 500}</p>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                style={{ width: `${Math.min(100, (profile.xp / (profile.level * 500)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">اسم المتسابق</label>
            <input
              type="text"
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
              {getPerksForLevel(profile.level)}
            </p>
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
