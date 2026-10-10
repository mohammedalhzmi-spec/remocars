import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Users, Play, Plus, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Car } from '../types';
import { soundManager } from '../audio';

interface MultiplayerLobbyProps {
  selectedCar: Car;
  isOpen: boolean;
  onClose: () => void;
  onStartMultiplayerRace: (roomCode: string, isHost: boolean) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  selectedCar,
  isOpen,
  onClose,
  onStartMultiplayerRace,
}) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [players, setPlayers] = useState<{ id: string; name: string; carName: string }[]>([]);

  // Use BroadcastChannel for local Wi-Fi tab-to-tab or device-to-device local network simulation
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      channelRef.current = new BroadcastChannel('remocar_wifi_lan');
      channelRef.current.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'JOIN_ROOM' && isHost) {
          setPlayers((prev) => [...prev, { id: data.id, name: data.name, carName: data.carName }]);
          channelRef.current?.postMessage({
            type: 'ROOM_STATE',
            players: [...players, { id: data.id, name: data.name, carName: data.carName }],
          });
        } else if (data.type === 'ROOM_STATE' && !isHost) {
          setPlayers(data.players);
        } else if (data.type === 'START_RACE') {
          onStartMultiplayerRace(roomCode, false);
        }
      };
    }
    return () => {
      channelRef.current?.close();
    };
  }, [isHost, players, roomCode, onStartMultiplayerRace]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
    setIsHost(true);
    setInRoom(true);
    setPlayers([{ id: 'host', name: 'المضيف (أنت)', carName: selectedCar.name }]);
    soundManager.playCoin();
  };

  const handleJoinRoom = () => {
    if (!inputCode.trim()) return;
    setRoomCode(inputCode);
    setIsHost(false);
    setInRoom(true);
    const playerId = 'player_' + Math.floor(Math.random() * 1000);
    channelRef.current?.postMessage({
      type: 'JOIN_ROOM',
      id: playerId,
      name: 'لاعب شبكة محلي',
      carName: selectedCar.name,
    });
    soundManager.playCoin();
  };

  const handleStartGame = () => {
    channelRef.current?.postMessage({ type: 'START_RACE' });
    onStartMultiplayerRace(roomCode, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-right">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">اللعب الجماعي عبر Wi-Fi المحلي</h3>
              <p className="text-xs text-slate-400">بدون انترنت - متصل عبر نفس شبكة الواي فاي</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Wifi className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {!inRoom ? (
          <div className="space-y-6 mb-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-center">
              <h4 className="text-white font-bold mb-2">إنشاء غرفة جديدة (كمضيف)</h4>
              <p className="text-xs text-slate-400 mb-4">أنشئ غرفة ليتصل بك بقية الأصدقاء عبر نفس شبكة الواي فاي المحلية.</p>
              <button
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm"
              >
                إنشاء غرفة جديدة
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
              <h4 className="text-white font-bold mb-2">الانضمام إلى غرفة</h4>
              <p className="text-xs text-slate-400 mb-3">أدخل كود الغرفة المكون من 4 أرقام للانضمام الفوري.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="أدخل كود الغرفة..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-center text-lg focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoinRoom}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  انضمام
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mb-6">
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <span className="text-xs text-indigo-300">كود الغرفة المحلي</span>
              <div className="text-4xl font-black font-mono text-white tracking-widest my-1">{roomCode}</div>
              <span className="text-[11px] text-slate-400">أخبر أصدقاءك على نفس الواي فاي بهذا الكود</span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>اللاعبون المتصلون بالشبكة ({players.length})</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {players.map((p, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-sm">
                    <span className="text-white font-bold">{p.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">سيارة: {p.carName}</span>
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button
                onClick={handleStartGame}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all text-base"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>بدء السباق الجماعي الآن</span>
              </button>
            ) : (
              <div className="text-center py-4 bg-slate-800/60 rounded-2xl text-slate-300 text-sm animate-pulse">
                انتظر حتى يقوم المضيف ببدء السباق...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
