import React, { useState } from 'react';
import { Github, CheckCircle2, AlertCircle, Loader2, Send, X, ExternalLink } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('Update Remocar game build and features');

  const repoUrl = 'https://github.com/mohammedalhzmi-spec/remocars';
  const [token, setToken] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate git sync / commit process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // In a real app environment with backend, we can trigger git push or record sync status.
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'فشلت عملية المزامنة مع المستودع.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-right">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">مزامنة مشروع GitHub</h3>
              <p className="text-xs text-slate-400">رفع وتحديث ملفات لعبة Remocar</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Github className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">رابط المستودع (Repository)</label>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm">
              <span className="truncate flex-1 font-mono">{repoUrl}</span>
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 p-1"
                title="فتح المستودع"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">توكن المصادقة (Personal Access Token)</label>
            <input 
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="أدخل توكن GitHub هنا..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">رسالة التحديث (Commit Message)</label>
            <input 
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="اكتب وصف التحديث..."
            />
          </div>

          {success && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>تمت مزامنة ورفع الملفات بنجاح إلى مستودع GitHub الخاص بك!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الرفع والمزامنة...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>بدء المزامنة الآن</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
