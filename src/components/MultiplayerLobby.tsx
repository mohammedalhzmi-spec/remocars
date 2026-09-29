import React, { useEffect, useState } from 'react';
import { Wifi, Users, Play, X, CheckCircle2, LoaderCircle, Unplug } from 'lucide-react';
import { Car, Track } from '../types';
import { soundManager } from '../audio';
import { lanMultiplayer, LanPlayer } from '../app/lanMultiplayer';

interface MultiplayerLobbyProps {
  selectedCar: Car;
  playerName: string;
  tracks: Track[];
  isOpen: boolean;
  onClose: () => void;
  onStartMultiplayerRace: (roomCode: string, trackId: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  selectedCar, playerName, tracks, isOpen, onClose, onStartMultiplayerRace,
}) => {
  const defaultAddress = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `ws://${window.location.hostname}:3001`
    : '';
  const [serverAddress, setServerAddress] = useState(() => localStorage.getItem('remocar_lan_server') || defaultAddress);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState<LanPlayer[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id ?? 'coastal_highway');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => lanMultiplayer.subscribe((message) => {
    if (message.type === 'room_joined' || message.type === 'room_state') {
      setRoomCode(String(message.roomCode ?? lanMultiplayer.roomCode));
      setIsHost(lanMultiplayer.isHost);
      setPlayers(Array.isArray(message.players) ? message.players as LanPlayer[] : []);
      if (typeof message.trackId === 'string') setSelectedTrackId(message.trackId);
      setInRoom(true);
      setBusy(false);
      setError('');
      return;
    }
    if (message.type === 'race_start') {
      const trackId = typeof message.trackId === 'string' ? message.trackId : selectedTrackId;
      onStartMultiplayerRace(String(message.roomCode ?? roomCode), trackId);
      return;
    }
    if (message.type === 'error') {
      setError(String(message.message ?? 'حدث خطأ في اتصال الشبكة.'));
      setBusy(false);
    }
    if (message.type === 'disconnected' && inRoom) {
      setInRoom(false);
      setPlayers([]);
      setError('انقطع اتصال الشبكة. أعد الاتصال بخادم الغرفة.');
    }
  }), [inRoom, onStartMultiplayerRace, roomCode, selectedTrackId]);

  if (!isOpen) return null;

  const connectAndSend = async (action: 'create_room' | 'join_room') => {
    if (!serverAddress.trim()) {
      setError('أدخل عنوان الحاسوب الذي يشغّل خادم اللعب الجماعي، مثال: 192.168.1.10:3001');
      return;
    }
    setBusy(true);
    setError('');
    localStorage.setItem('remocar_lan_server', serverAddress.trim());
    try {
      await lanMultiplayer.connect(serverAddress.trim());
      const details = { name: playerName || 'متسابق', carName: selectedCar.name, color: selectedCar.color, trackId: selectedTrackId };
      const sent = lanMultiplayer.send(action === 'create_room'
        ? { type: action, ...details }
        : { type: action, ...details, roomCode: inputCode.trim() });
      if (!sent) throw new Error('تعذر إرسال طلب الغرفة. حاول مجدداً.');
      soundManager.playCoin();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'تعذر الوصول إلى خادم الشبكة.');
    }
  };

  const handleStartRace = () => {
    if (!lanMultiplayer.send({ type: 'start_race', trackId: selectedTrackId })) {
      setError('انقطع الاتصال بالخادم.');
    } else setBusy(true);
  };

  const leaveRoom = () => {
    lanMultiplayer.close();
    setInRoom(false);
    setPlayers([]);
    setRoomCode('');
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-5 relative">
          <button onClick={onClose} aria-label="إغلاق" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"><X className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <div className="text-left"><h3 className="text-xl font-bold text-white">سباق عبر شبكة Wi‑Fi</h3><p className="text-xs text-slate-400">اتصال فعلي بين الأجهزة على الشبكة المحلية</p></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Wifi className="w-6 h-6" /></div>
          </div>
        </div>

        {!inRoom ? <div className="space-y-5 relative">
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/30 p-4 text-xs text-indigo-100 leading-6">
            شغّل خادم REMOCAR على جهاز واحد متصل بنقطة Wi‑Fi، ثم أدخل عنوانه هنا. كل اللاعبين يستخدمون الخادم نفسه ورمز الغرفة نفسه.
          </div>
          <label className="block text-sm font-bold text-slate-300">عنوان خادم الشبكة
            <input value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} placeholder="مثال: 192.168.1.10:3001" className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-left font-mono focus:outline-none focus:border-indigo-400" dir="ltr" />
          </label>
          <label className="block text-sm font-bold text-slate-300">مضمار الغرفة
            <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">
              {tracks.filter((item) => item.unlocked).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button disabled={busy} onClick={() => void connectAndSend('create_room')} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">
            {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} إنشاء غرفة واستضافة السباق
          </button>
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-white font-bold mb-2">الانضمام إلى غرفة</h4>
            <div className="flex gap-2">
              <input value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="رمز الغرفة من 6 أرقام" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-center" />
              <button disabled={busy || inputCode.length !== 6} onClick={() => void connectAndSend('join_room')} className="bg-indigo-600 disabled:opacity-50 text-white font-bold px-6 rounded-xl">انضمام</button>
            </div>
          </div>
        </div> : <div className="space-y-5 relative">
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 text-center">
            <span className="text-xs text-indigo-300">رمز الغرفة</span>
            <div className="text-4xl font-black font-mono text-white tracking-widest my-1">{roomCode}</div>
            <span className="text-[11px] text-slate-400">أرسله للأصدقاء المتصلين بنقطة Wi‑Fi نفسها</span>
          </div>
          <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> المتسابقون ({players.length}/6)</h4><span className="text-xs text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />متصل</span></div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((player) => <div key={player.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-sm"><span className="text-white font-bold">{player.name}{player.id === lanMultiplayer.playerId ? ' (أنت)' : ''}{player.id === lanMultiplayer.playerId && isHost ? ' · المضيف' : ''}</span><span className="text-xs text-slate-400">{player.carName}</span></div>)}
          </div>
          <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">المضمار: <strong className="text-white">{tracks.find((item) => item.id === selectedTrackId)?.name ?? selectedTrackId}</strong></div>
          {isHost ? <>
            <label className="block text-sm font-bold text-slate-300">اختيار مضمار لجميع اللاعبين
              <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">
                {tracks.filter((item) => item.unlocked).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button disabled={busy || players.length < 2} onClick={handleStartRace} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl">{busy ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}بدء السباق لجميع الأجهزة</button>
            {players.length < 2 && <p className="text-xs text-amber-300 text-center">انتظر انضمام لاعب واحد على الأقل.</p>}
          </> : <div className="text-center py-3 bg-slate-800/60 rounded-2xl text-slate-300 text-sm animate-pulse">انتظر اختيار المضمار وبدء المضيف للسباق.</div>}
          <button onClick={leaveRoom} className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2"><Unplug className="w-4 h-4" /> مغادرة الغرفة</button>
        </div>}
        {error && <p role="alert" className="relative mt-4 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        <p className="relative mt-4 text-[11px] leading-5 text-slate-500">للاتصال عبر الإنترنت تحتاج إلى خادم عام آمن (WSS). خادم Wi‑Fi المضمّن يعمل على شبكتك الخاصة فقط؛ لا تفتَح منفذه للعامة.</p>
      </div>
    </div>
  );
};
