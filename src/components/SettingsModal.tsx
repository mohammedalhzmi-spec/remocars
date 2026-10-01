import React from 'react';
import { Gamepad2, Gauge, Monitor, SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react';
import { GamePreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: GamePreferences;
  onChange: (next: GamePreferences) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, preferences, onChange, soundEnabled, onToggleSound,
}) => {
  if (!isOpen) return null;
  const patch = (value: Partial<GamePreferences>) => onChange({ ...preferences, ...value });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-right shadow-2xl sm:p-7">
        <header className="mb-6 flex items-center justify-between">
          <button onClick={onClose} aria-label="إغلاق الإعدادات" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
          <div className="flex items-center gap-3">
            <div>
              <h2 id="settings-title" className="text-xl font-black text-white">إعدادات القيادة</h2>
              <p className="mt-1 text-xs text-slate-400">تحكم في المقود والأداء لتناسب جهازك</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-300"><SlidersHorizontal className="h-5 w-5" /></div>
          </div>
        </header>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-white"><Gamepad2 className="h-4 w-4 text-amber-300" /><h3 className="font-bold">نظام التوجيه</h3></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => patch({ steeringMode: 'buttons' })} aria-pressed={preferences.steeringMode === 'buttons'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${preferences.steeringMode === 'buttons' ? 'border-red-400 bg-red-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>أزرار المقود يساراً</button>
              <button onClick={() => patch({ steeringMode: 'tilt' })} aria-pressed={preferences.steeringMode === 'tilt'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${preferences.steeringMode === 'tilt' ? 'border-cyan-400 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>إمالة الهاتف</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">تبقى دواستا التسارع والفرامل على يمين الشاشة. يتطلب التوجيه بالإمالة مستشعر حركة فعالاً؛ إن لم يتوفر، استخدم الأزرار.</p>
          </section>

          {preferences.steeringMode === 'tilt' && (
            <label className="block rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <span className="flex items-center justify-between text-sm font-bold text-white"><span>حساسية إمالة الهاتف</span><span className="text-cyan-300">{preferences.steeringSensitivity.toFixed(1)}×</span></span>
              <input aria-label="حساسية إمالة الهاتف" type="range" min="0.5" max="1.5" step="0.1" value={preferences.steeringSensitivity} onChange={(event) => patch({ steeringSensitivity: Number(event.target.value) })} className="mt-4 w-full accent-cyan-400" />
              <span className="mt-1 flex justify-between text-[10px] text-slate-500"><span>أهدأ</span><span>أسرع استجابة</span></span>
            </label>
          )}

          <section className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-white"><Gauge className="h-4 w-4 text-emerald-300" /><h3 className="font-bold">حجم أزرار السباق</h3></div>
            <div className="grid grid-cols-3 gap-2">
              {([['small', 'صغير'], ['normal', 'متوسط'], ['large', 'كبير']] as const).map(([value, label]) => (
                <button key={value} onClick={() => patch({ controlSize: value })} aria-pressed={preferences.controlSize === value} className={`rounded-xl border px-2 py-2.5 text-sm font-bold ${preferences.controlSize === value ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>{label}</button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-white"><Monitor className="h-4 w-4 text-indigo-300" /><h3 className="font-bold">جودة الرسوم</h3></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => patch({ graphicsQuality: 'performance' })} aria-pressed={preferences.graphicsQuality === 'performance'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${preferences.graphicsQuality === 'performance' ? 'border-emerald-400 bg-emerald-500/15 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>أداء وسلاسة</button>
              <button onClick={() => patch({ graphicsQuality: 'balanced' })} aria-pressed={preferences.graphicsQuality === 'balanced'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${preferences.graphicsQuality === 'balanced' ? 'border-indigo-400 bg-indigo-500/15 text-white' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>متوازن</button>
            </div>
            <p className="mt-2 text-xs text-slate-400">وضع الأداء يخفض كثافة الظلال ودقة الرسم للأجهزة الأقدم.</p>
          </section>

          <button onClick={onToggleSound} aria-pressed={soundEnabled} className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm font-bold text-white">
            <span>{soundEnabled ? 'الصوت والمؤثرات مفعّلة' : 'الصوت والمؤثرات مكتومة'}</span>
            {soundEnabled ? <Volume2 className="h-5 w-5 text-emerald-300" /> : <VolumeX className="h-5 w-5 text-red-300" />}
          </button>
        </div>

        <button onClick={onClose} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 py-3 font-black text-white">حفظ والعودة</button>
      </section>
    </div>
  );
};
