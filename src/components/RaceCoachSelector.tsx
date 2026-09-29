import React from 'react';
import { Check, Lock, Volume2 } from 'lucide-react';
import { RACE_COACHES, getSelectedCoach } from '../data/raceCoaches';

interface RaceCoachSelectorProps {
  level: number;
  selectedCoachId: string;
  onSelect: (coachId: string) => void;
  onPlayVoice: (coachId: string) => void;
}

export const RaceCoachSelector: React.FC<RaceCoachSelectorProps> = ({ level, selectedCoachId, onSelect, onPlayVoice }) => {
  const activeCoach = getSelectedCoach(selectedCoachId, level);
  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 p-5 shadow-xl md:p-7" aria-label="مرشدات السباق">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-right">
        <div><h3 className="text-xl font-black text-white">مرشدة السباق العربية</h3><p className="mt-1 text-xs text-slate-400">اختاري مرشدتك؛ تُفتح مرشدات جديدات مع تقدم مستواك.</p></div>
        <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">المستوى {level}</span>
      </div>
      <div className="grid gap-5 md:grid-cols-[190px_1fr]">
        <div className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 md:max-w-none">
          <img src={activeCoach.portrait} alt={`المرشدة ${activeCoach.name}`} className="aspect-[4/5] w-full object-cover" loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-3 pt-10 text-right">
            <div className="text-lg font-black text-white">{activeCoach.name}</div><div className="text-[10px] font-bold text-amber-200">{activeCoach.title}</div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 text-right">
          <div><p className="text-sm font-bold leading-7 text-slate-200">{activeCoach.bio}</p><div className="mt-3 rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-3 text-xs leading-6 text-indigo-100"><strong className="text-indigo-200">نصيحة السباق: </strong>{activeCoach.hint}</div></div>
          <button onClick={() => onPlayVoice(activeCoach.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-110 sm:w-fit sm:self-start"><Volume2 className="h-4 w-4" />استمعي إلى المرشدة</button>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {RACE_COACHES.map((coach) => {
              const unlocked = level >= coach.requiredLevel;
              const selected = activeCoach.id === coach.id;
              return <button key={coach.id} disabled={!unlocked} onClick={() => onSelect(coach.id)} className={`relative min-w-0 overflow-hidden rounded-xl border text-right transition ${selected ? 'border-amber-300 ring-1 ring-amber-300/40' : 'border-slate-700'} ${unlocked ? 'bg-slate-950/65 hover:border-slate-500' : 'cursor-not-allowed bg-slate-950/30 opacity-55'}`} aria-label={unlocked ? `اختيار المرشدة ${coach.name}` : `${coach.name} تُفتح عند المستوى ${coach.requiredLevel}`}>
                <div className="flex items-center gap-2 p-2"><img src={coach.portrait} alt="" className="h-10 w-9 shrink-0 rounded-lg object-cover" loading="lazy" /><span className="min-w-0"><span className="block truncate text-xs font-bold text-white">{coach.name}</span><span className="block truncate text-[9px] text-slate-400">{unlocked ? coach.title : `المستوى ${coach.requiredLevel}`}</span></span></div>
                <span className="absolute left-1.5 top-1.5 text-amber-300">{selected ? <Check className="h-3.5 w-3.5" /> : !unlocked ? <Lock className="h-3 w-3" /> : null}</span>
              </button>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
