export interface LanPlayer {
  id: string;
  name: string;
  carName: string;
  color: string;
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
    }
  }
}

export const lanMultiplayer = new LanMultiplayerClient();
