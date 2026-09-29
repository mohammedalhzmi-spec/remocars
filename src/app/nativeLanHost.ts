import { Capacitor, registerPlugin } from '@capacitor/core';

export interface DiscoveredLanRoom {
  type: 'remocar_room';
  ip: string;
  port: number;
  roomCode: string;
  hostName: string;
  trackId: string;
  players: number;
  maxPlayers: number;
}

interface NativeLanHostPlugin {
  startHost(options: { port?: number; hostName?: string }): Promise<{ ip: string; port: number; localUrl: string }>;
  discover(options?: { durationMs?: number }): Promise<{ rooms: DiscoveredLanRoom[] }>;
  stopHost(): Promise<void>;
}

const nativeLanHost = registerPlugin<NativeLanHostPlugin>('LanHost');

export const isAndroidLanHostAvailable = () => Capacitor.getPlatform() === 'android';

export async function startAndroidLanHost(hostName: string) {
  if (!isAndroidLanHostAvailable()) throw new Error('استضافة الغرفة من الهاتف متاحة في تطبيق Android فقط.');
  return nativeLanHost.startHost({ port: 3001, hostName });
}

export async function discoverAndroidLanRooms(durationMs = 2400): Promise<DiscoveredLanRoom[]> {
  if (!isAndroidLanHostAvailable()) return [];
  const result = await nativeLanHost.discover({ durationMs });
  return Array.isArray(result.rooms) ? result.rooms : [];
}

export async function stopAndroidLanHost() {
  if (isAndroidLanHostAvailable()) await nativeLanHost.stopHost();
}
