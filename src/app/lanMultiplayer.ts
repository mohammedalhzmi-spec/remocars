export interface LanPlayer {
  id: string;
  name: string;
  carName: string;
  color: string;
}

export interface LanRoundFinish {
  playerId: string;
  name: string;
  time: number;
  place: number;
  pointsEarned: number;
}

export interface LanStanding {
  playerId: string;
  name: string;
  carName: string;
  points: number;
  totalTime: number;
}

export interface LanTournamentResult {
  type: 'round_complete' | 'match_complete';
  roomCode: string;
  trackId: string;
  round: number;
  roundsTotal: number;
  finishOrder: LanRoundFinish[];
  scores: LanStanding[];
  winner?: LanStanding | null;
}

export type LanMessage = {
  type: string;
  [key: string]: unknown;
};

type Listener = (message: LanMessage) => void;

class LanMultiplayerClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  playerId = '';
  connected = false;
  roomCode = '';
  isHost = false;
  trackId = '';
  round = 1;
  roundsTotal = 3;

  connect(rawAddress: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    this.close(false);
    const address = rawAddress.trim().replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
    const url = /^[a-z]+:\/\//i.test(address) ? address : `ws://${address}`;
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(url);
      this.socket = socket;
      const timeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.close();
          reject(new Error('انتهت مهلة الاتصال. تحقق من عنوان الحاسوب وأنه متصل بالشبكة نفسها.'));
        }
      }, 7000);
      socket.onopen = () => {
        this.connected = true;
        window.clearTimeout(timeout);
        if (!settled) { settled = true; resolve(); }
      };
      socket.onmessage = (event) => {
        let message: LanMessage;
        try { message = JSON.parse(String(event.data)) as LanMessage; }
        catch { return; }
        if (message.type === 'hello' && typeof message.playerId === 'string') this.playerId = message.playerId;
        if (message.type === 'room_joined' || message.type === 'room_state' || message.type === 'race_start') {
          if (typeof message.roomCode === 'string') this.roomCode = message.roomCode;
          if (typeof message.trackId === 'string') this.trackId = message.trackId;
          if (typeof message.hostId === 'string') this.isHost = message.hostId === this.playerId;
        }
        if (typeof message.round === 'number' && Number.isFinite(message.round)) this.round = message.round;
        if (typeof message.roundsTotal === 'number' && Number.isFinite(message.roundsTotal)) this.roundsTotal = message.roundsTotal;
        this.listeners.forEach((listener) => listener(message));
      };
      socket.onerror = () => {
        window.clearTimeout(timeout);
        if (!settled) { settled = true; reject(new Error('تعذر الاتصال بخادم الشبكة المحلية.')); }
      };
      socket.onclose = () => {
        this.connected = false;
        this.listeners.forEach((listener) => listener({ type: 'disconnected' }));
      };
    });
  }

  send(message: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  finishRound(time: number): boolean {
    return this.send({ type: 'finish_round', time });
  }

  startNextRound(): boolean {
    return this.send({ type: 'start_next_round' });
  }

  close(resetRoom = true) {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    if (resetRoom) {
      this.roomCode = '';
      this.isHost = false;
      this.trackId = '';
      this.playerId = '';
      this.round = 1;
      this.roundsTotal = 3;
    }
  }
}

export const lanMultiplayer = new LanMultiplayerClient();
