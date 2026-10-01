import React from 'react';
import { CheckCircle2, Lock, Play, Star, Trophy, X } from 'lucide-react';
import { CareerEvent, getCareerEventTracks } from '../data/careerEvents';
import { Track } from '../types';

interface CareerEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CareerEvent[];
  tracks: Track[];
  playerLevel: number;
  completedEventIds: string[];
  onStart: (eventId: string) => void;
}

export const CareerEventsModal: React.FC<CareerEventsModalProps> = ({
  isOpen, onClose, events, tracks, playerLevel, completedEventIds, onStart,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="career-events-title">
      <section className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-right shadow-2xl sm:p-7">
        <header className="mb-5 flex items-center justify-between">
          <button onClick={onClose} aria-label="إغلاق البطولات" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
          <div className="flex items-center gap-3">
            <div><h2 id="career-events-title" className="text-2xl font-black text-white">بطولات REMOCAR</h2><p className="mt-1 text-xs text-slate-400">سلسلة سباقات فردية تعمل دون اتصال بالإنترنت</p></div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-amber-300"><Trophy className="h-5 w-5" /></div>
          </div>
        </header>
        <div className="space-y-3">
          {events.map((event) => {
            const locked = playerLevel < event.requiredLevel;
            const completed = completedEventIds.includes(event.id);
            const eventTracks = getCareerEventTracks(event, tracks);
            return (
              <article key={event.id} className={`rounded-2xl border p-4 ${locked ? 'border-slate-800 bg-slate-950/60 opacity-75' : 'border-slate-700 bg-slate-950/70'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><h3 className="text-lg font-black text-white">{event.name}</h3>{completed && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}</div>
                    <p className="mt-1 text-sm text-slate-400">{event.subtitle}</p>
                    <ol className="mt-3 grid gap-1 text-xs text-slate-300 sm:grid-cols-3">
                      {eventTracks.map((track, index) => <li key={track.id} className="rounded-lg bg-slate-900 px-2.5 py-2"><span className="ml-1 font-mono text-amber-300">{index + 1}.</span>{track.name}</li>)}
                    </ol>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-amber-200"><span>{event.rewardCoins} عملة مكافأة نهائية</span><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" />{event.rewardStars} نجوم</span></div>
                  </div>
                  <button disabled={locked} onClick={() => onStart(event.id)} className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${locked ? 'cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500' : 'bg-gradient-to-r from-red-600 to-amber-500 text-white hover:brightness-110'}`}>
                    {locked ? <><Lock className="h-4 w-4" />المستوى {event.requiredLevel}</> : completed ? <><Play className="h-4 w-4" />إعادة البطولة</> : <><Play className="h-4 w-4" />ابدأ البطولة</>}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">لا تحتاج البطولات إلى تسجيل دخول أو اتصال بخادم خارجي.</p>
      </section>
    </div>
  );
};
