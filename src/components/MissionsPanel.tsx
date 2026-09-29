import React from 'react';
import { Target, CheckCircle2, Coins, Sparkles, X } from 'lucide-react';
import { soundManager } from '../audio';

interface Mission {
  id: string;
  title: string;
  reward: number;
  completed: boolean;
}

interface MissionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  onClaimMission: (missionId: string, reward: number) => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  isOpen,
  onClose,
  missions,
  onClaimMission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-right">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">المهام والتحديات اليومية</h3>
              <p className="text-xs text-slate-400">أنجز المهام واجمع جوائز إضافية</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{mission.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>مكافأة: +{mission.reward} عملة</span>
                </div>
              </div>

              {mission.completed ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الإنجاز</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClaimMission(mission.id, mission.reward);
                    soundManager.playCoin();
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>استلم الجائزة</span>
                </button>
              )}
            </div>
          ))}
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
