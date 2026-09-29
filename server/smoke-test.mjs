import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomInt } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const port = randomInt(34000, 48000);
const server = spawn(process.execPath, [new URL('./multiplayer.mjs', import.meta.url).pathname], {
  env: { ...process.env, LAN_HOST: '127.0.0.1', LAN_PORT: String(port) },
  stdio: ['ignore', 'ignore', 'inherit'],
});
let host;
let guest;

function waitFor(socket, type, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.removeEventListener('message', handler); reject(new Error(`Timed out waiting for ${type}`)); }, timeoutMs);
    const handler = (event) => {
      let data;
      try { data = JSON.parse(String(event.data)); } catch { return; }
      if (data.type !== type) return;
      clearTimeout(timer);
      socket.removeEventListener('message', handler);
      resolve(data);
    };
    socket.addEventListener('message', handler);
  });
}

async function connect() {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await once(socket, 'open');
  return socket;
}

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) { ready = true; break; } } catch { /* server is starting */ }
    await delay(100);
  }
  assert.ok(ready, 'LAN host should expose its health endpoint');
  host = await connect();
  guest = await connect();

  const hostRoom = waitFor(host, 'room_joined');
  host.send(JSON.stringify({ type: 'create_room', name: 'Host', carName: 'Sport', color: '#ef4444', trackId: 'mp_desert_canyon' }));
  const created = await hostRoom;
  assert.equal(created.roomCode.length, 6);

  const hostState = waitFor(host, 'room_state');
  const guestRoom = waitFor(guest, 'room_joined');
  guest.send(JSON.stringify({ type: 'join_room', roomCode: created.roomCode, name: 'Guest', carName: 'GT', color: '#38bdf8' }));
  const [room, joined] = await Promise.all([hostState, guestRoom]);
  assert.equal(joined.players.length, 2);
  assert.equal(room.players.length, 2);

  const hostStart = waitFor(host, 'race_start');
  const guestStart = waitFor(guest, 'race_start');
  host.send(JSON.stringify({ type: 'start_race', trackId: 'mp_neon_docks' }));
  const [hostRace, guestRace] = await Promise.all([hostStart, guestStart]);
  assert.equal(hostRace.trackId, 'mp_neon_docks');
  assert.equal(guestRace.trackId, hostRace.trackId);

  const remoteState = waitFor(guest, 'player_state');
  host.send(JSON.stringify({ type: 'player_state', x: 12.5, z: -7, heading: 0.4, speed: 9 }));
  const state = await remoteState;
  assert.equal(state.x, 12.5);
  assert.equal(state.playerId, created.playerId);
  console.log('LAN multiplayer smoke test passed: create, join, shared start, and vehicle state sync.');
} finally {
  host?.close();
  guest?.close();
  server.kill('SIGTERM');
  await once(server, 'exit').catch(() => undefined);
}
