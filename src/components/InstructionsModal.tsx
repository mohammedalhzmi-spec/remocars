import React from 'react';
import { X, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
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
              <h3 className="text-xl font-bold text-white">تعليمات ومفاتيح التحكم</h3>
              <p className="text-xs text-slate-400">كيف تتحكم بسيارة الريموت باحتراف</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8 text-sm text-slate-300">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
            <span>التسارع / التحرك للأمام</span>
            <div className="flex gap-1">
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">W</kbd>
              <span className="text-slate-500">أو</span>
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">↑</kbd>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
            <span>الفرامل / الرجوع للخلف</span>
            <div className="flex gap-1">
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">S</kbd>
              <span className="text-slate-500">أو</span>
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">↓</kbd>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
            <span>التوجيه يمين ويسار</span>
            <div className="flex gap-1">
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">A / D</kbd>
              <span className="text-slate-500">أو</span>
              <kbd className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white">← / →</kbd>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
            <span>تفعيل نيترو السرعة القصوى (Nitro)</span>
            <kbd className="px-4 py-1.5 bg-red-600/30 border border-red-500/50 rounded-lg text-xs font-mono text-red-300 font-bold">Space (المسافة)</kbd>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-4 text-xs leading-6 text-cyan-100">
            على الهاتف: المقود وزرا الانعطاف في يسار الشاشة، ودواستا التسارع والفرامل والنيترو في يمينها. يمكن تبديل المقود إلى إمالة الهاتف من الإعدادات. في مضامير الاستعراض، اضغط <kbd className="rounded border border-cyan-400/30 bg-slate-950 px-1.5 py-0.5 font-mono">E</kbd> أو زر «استعراض» أثناء القفز لتنفيذ لفة هوائية.
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-950/30 p-4 text-xs leading-6 text-sky-100">
            <strong className="text-sky-200">ميزة REMOCAR الخاصة — صدى الزمن:</strong> بعد إنهاء لفتك الأولى يظهر ظلّ شبحي لمسارك. حاول أن تتزامن معه عند بوابات النور الثلاث؛ عند شحن المؤشر بالكامل تحصل على اندفاع زمني محاط بهالة زرقاء ومكافأة عملات.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-sm"
        >
          فهمت، لنبدأ اللعب!
        </button>
      </div>
    </div>
  );
};
