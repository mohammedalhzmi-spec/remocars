import React, { useEffect, useState } from 'react';
import { Wifi, Users, Play, X, CheckCircle2, LoaderCircle, Unplug, Search, Smartphone } from 'lucide-react';
import { Car, Track } from '../types';
import { soundManager } from '../audio';
import { lanMultiplayer, LanPlayer } from '../app/lanMultiplayer';
import { discoverAndroidLanRooms, DiscoveredLanRoom, isAndroidLanHostAvailable, startAndroidLanHost, stopAndroidLanHost } from '../app/nativeLanHost';

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
  const nativeAndroid = isAndroidLanHostAvailable();
  const [serverAddress, setServerAddress] = useState(() => localStorage.getItem('remocar_lan_server') || defaultAddress);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [hostIp, setHostIp] = useState('');
  const [discoveredRooms, setDiscoveredRooms] = useState<DiscoveredLanRoom[]>([]);
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState<LanPlayer[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id ?? 'coastal_highway');
  const [roundsTotal, setRoundsTotal] = useState(3);
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
      setBusy(false);
      setError('انقطع اتصال الشبكة. أعد الاتصال بالمضيف أو ابحث عن الغرفة مجدداً.');
    }
  }), [inRoom, onStartMultiplayerRace, roomCode, selectedTrackId]);

  if (!isOpen) return null;

  const connectAndSend = async (action: 'create_room' | 'join_room', addressOverride?: string, codeOverride?: string) => {
    let address = addressOverride || serverAddress.trim();
    if (nativeAndroid && action === 'create_room') {
      setBusy(true);
      setError('');
      try {
        const host = await startAndroidLanHost(playerName || 'مضيف REMOCAR');
        setIsHosting(true);
        setHostIp(host.ip);
        address = host.localUrl;
      } catch (err) {
        setBusy(false);
        setError(err instanceof Error ? err.message : 'تعذر استضافة الغرفة على شبكة Wi-Fi الحالية.');
        return;
      }
    }
    if (!address) {
      setError('أدخل عنوان الخادم المحلي، ثم استخدم رمز الغرفة للانضمام.');
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    if (addressOverride) setServerAddress(addressOverride);
    localStorage.setItem('remocar_lan_server', address);
    try {
      await lanMultiplayer.connect(address);
      const details = { name: playerName || 'متسابق', carName: selectedCar.name, color: selectedCar.color, trackId: selectedTrackId, roundsTotal };
      const sent = lanMultiplayer.send(action === 'create_room'
        ? { type: action, ...details }
        : { type: action, ...details, roomCode: (codeOverride || inputCode).trim() });
      if (!sent) throw new Error('تعذر إرسال طلب الغرفة. حاول مجدداً.');
      soundManager.playCoin();
    } catch (err) {
      setBusy(false);
      if (nativeAndroid && action === 'create_room') {
        setIsHosting(false);
        void stopAndroidLanHost();
      }
      setError(err instanceof Error ? err.message : 'تعذر الوصول إلى خادم الشبكة.');
    }
  };

  const scanRooms = async () => {
    setBusy(true);
    setError('');
    try {
      const rooms = await discoverAndroidLanRooms(2600);
      setDiscoveredRooms(rooms);
      if (rooms.length === 0) setError('لم نعثر على غرف. تأكد من أن الأجهزة على شبكة Wi-Fi/نقطة الاتصال نفسها؛ إذا كانت الشبكة تحظر الاكتشاف التلقائي فاستخدم عنوان IP يدوياً.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر البحث عن الغرف القريبة.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartRace = () => {
    if (!lanMultiplayer.send({ type: 'start_race', trackId: selectedTrackId })) {
      setError('انقطع الاتصال بالخادم.');
    } else setBusy(true);
  };

  const leaveRoom = () => {
    lanMultiplayer.close();
    if (isHosting) void stopAndroidLanHost();
    setIsHosting(false);
    setHostIp('');
    setDiscoveredRooms([]);
    setInRoom(false);
    setPlayers([]);
    setRoomCode('');
    setBusy(false);
  };

  const trackPicker = (
    <label className="block text-sm font-bold text-slate-300">{isHost && inRoom ? 'اختيار مضمار لجميع اللاعبين' : 'مضمار الغرفة'}
      <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">
        {tracks.filter((item) => item.unlocked).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );

  const roundsPicker = (
    <label className="block text-sm font-bold text-slate-300">عدد جولات البطولة
      <select value={roundsTotal} onChange={(event) => setRoundsTotal(Number(event.target.value))} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white">
        {[1, 3, 5].map((rounds) => <option key={rounds} value={rounds}>{rounds === 1 ? 'جولة واحدة' : `${rounds} جولات`}</option>)}
      </select>
      <span className="mt-1 block text-[10px] font-normal text-slate-500">نقاط ترتيب شبيهة بسباقات الجائزة الكبرى، ويُحسم البطل بعد الجولة الأخيرة.</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-5 relative">
          <button onClick={onClose} aria-label="إغلاق" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"><X className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <div className="text-left"><h3 className="text-xl font-bold text-white">سباق عبر شبكة Wi‑Fi</h3><p className="text-xs text-slate-400">{nativeAndroid ? 'استضافة واكتشاف الغرف من الهاتف' : 'اتصال فعلي بين الأجهزة على الشبكة المحلية'}</p></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Wifi className="w-6 h-6" /></div>
          </div>
        </div>

        {!inRoom ? <div className="space-y-5 relative">
          {nativeAndroid ? <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/30 p-4 text-xs text-indigo-100 leading-6">
            اتصلوا جميعاً بشبكة Wi‑Fi نفسها، أو فعّلوا نقطة اتصال الهاتف المضيف من إعدادات Android ثم صِلوا بقية الأجهزة بها. لا يستطيع Android السماح للتطبيق بتغيير شبكة Wi‑Fi تلقائياً؛ سيستخدم التطبيق الشبكة المتصلة حالياً ويبحث عن الغرف القريبة.
          </div> : <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/30 p-4 text-xs text-indigo-100 leading-6">
            شغّل خادم REMOCAR على جهاز واحد متصل بنقطة Wi‑Fi نفسها، ثم أدخل عنوانه هنا. كل اللاعبين يستخدمون الخادم نفسه ورمز الغرفة نفسه.
          </div>}

          {nativeAndroid ? <>
            {trackPicker}
            {roundsPicker}
            <button disabled={busy} onClick={() => void connectAndSend('create_room')} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">
              {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />} إنشاء غرفة واستضافة السباق على هذا الهاتف
            </button>
            <button disabled={busy} onClick={() => void scanRooms()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">
              {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} البحث عن غرف على الشبكة
            </button>
            {discoveredRooms.length > 0 && <div className="space-y-2">
              <h4 className="text-sm text-white font-bold">الغرف القريبة ({discoveredRooms.length})</h4>
              {discoveredRooms.map((room) => <div key={`${room.ip}:${room.roomCode}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3">
                <div className="min-w-0"><p className="truncate text-sm text-white font-bold">{room.hostName} · غرفة {room.roomCode}</p><p className="text-xs text-slate-400">{room.players}/{room.maxPlayers} لاعبين · {tracks.find((track) => track.id === room.trackId)?.name ?? room.trackId}</p><p className="text-[10px] text-slate-500 font-mono" dir="ltr">{room.ip}:{room.port}</p></div>
                <button disabled={busy || room.players >= room.maxPlayers} onClick={() => void connectAndSend('join_room', `ws://${room.ip}:${room.port}`, room.roomCode)} className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">انضمام</button>
              </div>)}
            </div>}
            <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <summary className="cursor-pointer text-xs font-bold text-slate-400">الاتصال اليدوي إذا تعذر العثور على المضيف</summary>
              <label className="mt-3 block text-xs font-bold text-slate-300">عنوان خادم المضيف
                <input value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} placeholder="مثال: ws://192.168.1.10:3001" className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-left font-mono" dir="ltr" />
              </label>
              <div className="mt-2 flex gap-2"><input value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="رمز الغرفة من 6 أرقام" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-center" /><button disabled={busy || inputCode.length !== 6} onClick={() => void connectAndSend('join_room')} className="bg-emerald-600 disabled:opacity-50 text-white font-bold px-5 rounded-xl">انضمام</button></div>
            </details>
          </> : <>
            <label className="block text-sm font-bold text-slate-300">عنوان خادم الشبكة
              <input value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} placeholder="مثال: 192.168.1.10:3001" className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-left font-mono focus:outline-none focus:border-indigo-400" dir="ltr" />
            </label>
            {trackPicker}
            {roundsPicker}
            <button disabled={busy} onClick={() => void connectAndSend('create_room')} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">
              {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} إنشاء غرفة
            </button>
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-white font-bold mb-2">الانضمام إلى غرفة</h4>
              <div className="flex gap-2"><input value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="رمز الغرفة من 6 أرقام" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-center" /><button disabled={busy || inputCode.length !== 6} onClick={() => void connectAndSend('join_room')} className="bg-indigo-600 disabled:opacity-50 text-white font-bold px-6 rounded-xl">انضمام</button></div>
            </div>
          </>}
        </div> : <div className="space-y-5 relative">
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 text-center">
            <span className="text-xs text-indigo-300">رمز الغرفة</span>
            <div className="text-4xl font-black font-mono text-white tracking-widest my-1">{roomCode}</div>
            <span className="text-[11px] text-slate-400">الأجهزة الأخرى تختار «البحث عن غرف» أو تدخل عنوان المضيف</span>
            {hostIp && <p className="mt-2 text-[11px] text-emerald-300 font-mono" dir="ltr">{hostIp}:3001</p>}
          </div>
          <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> المتسابقون ({players.length}/6)</h4><span className="text-xs text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />متصل</span></div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((player) => <div key={player.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-sm"><span className="text-white font-bold">{player.name}{player.id === lanMultiplayer.playerId ? ' (أنت)' : ''}{player.id === lanMultiplayer.playerId && isHost ? ' · المضيف' : ''}</span><span className="text-xs text-slate-400">{player.carName}</span></div>)}
          </div>
          <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">المضمار: <strong className="text-white">{tracks.find((item) => item.id === selectedTrackId)?.name ?? selectedTrackId}</strong></div>
          {isHost ? <>
            {trackPicker}
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">عدد الجولات: <strong className="text-amber-200">{lanMultiplayer.roundsTotal}</strong></div>
            <button disabled={busy || players.length < 2} onClick={handleStartRace} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl">{busy ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}بدء السباق لجميع الأجهزة</button>
            {players.length < 2 && <p className="text-xs text-amber-300 text-center">انتظر انضمام لاعب واحد على الأقل.</p>}
          </> : <div className="text-center py-3 bg-slate-800/60 rounded-2xl text-slate-300 text-sm animate-pulse">انتظر اختيار المضمار وبدء المضيف للسباق.</div>}
          <button onClick={leaveRoom} className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2"><Unplug className="w-4 h-4" /> مغادرة الغرفة</button>
        </div>}
        {error && <p role="alert" className="relative mt-4 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        <p className="relative mt-4 text-[11px] leading-5 text-slate-500">اللعب الجماعي يعمل على الشبكة المحلية. قد تمنع بعض نقاط الاتصال عزل الأجهزة من الاكتشاف؛ عندها استخدم عنوان IP ورمز الغرفة اليدويين. خادم الهاتف يتوقف عند إغلاقه؛ لا تفتح منافذه على الإنترنت العام.</p>
      </div>
    </div>
  );
};
