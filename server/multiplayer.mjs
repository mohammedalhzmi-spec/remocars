import { createServer } from 'node:http';
import { randomInt, randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { WebSocket, WebSocketServer } from 'ws';

const host = process.env.LAN_HOST || '0.0.0.0';
const port = Number(process.env.LAN_PORT || 3001);
const rooms = new Map();
const socketPlayers = new Map();
const httpServer = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ ok: true, service: 'remocar-lan', rooms: rooms.size, clients: socketPlayers.size }));
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain' });
  response.end('REMOCAR LAN server. Use WebSocket on this port.');
});
const wss = new WebSocketServer({ server: httpServer, maxPayload: 4096, perMessageDeflate: false });

const cleanText = (value, max = 28) => String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};
const playerList = (room) => [...room.players.values()].map(({ id, name, carName, color }) => ({ id, name, carName, color }));
function broadcast(room, message, omitId = '') {
  for (const [id, player] of room.players) {
    if (id !== omitId) send(player.socket, message);
  }
}
function broadcastRoomState(room) {
  broadcast(room, { type: 'room_state', roomCode: room.code, trackId: room.trackId, hostId: room.hostId, raceStarted: room.raceStarted, players: playerList(room) });
}
function leaveRoom(socket) {
  const record = socketPlayers.get(socket);
  if (!record) return;
  const room = rooms.get(record.roomCode);
  if (room) {
    room.players.delete(record.playerId);
    if (room.players.size === 0) rooms.delete(room.code);
    else {
      if (room.hostId === record.playerId) room.hostId = room.players.keys().next().value;
      broadcastRoomState(room);
      broadcast(room, { type: 'player_left', playerId: record.playerId });
    }
  }
  socketPlayers.delete(socket);
}

wss.on('connection', (socket) => {
  const playerId = randomUUID();
  socket.isAlive = true;
  socket.lastStateAt = 0;
  send(socket, { type: 'hello', playerId });

  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('message', (buffer) => {
    let message;
    try { message = JSON.parse(buffer.toString()); } catch { return send(socket, { type: 'error', message: 'صيغة رسالة غير صالحة.' }); }
    const kind = String(message.type || '');

    if (kind === 'create_room') {
      leaveRoom(socket);
      let code;
      do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
      const player = { id: playerId, name: cleanText(message.name) || 'المضيف', carName: cleanText(message.carName) || 'سيارة سباق', color: cleanText(message.color, 16) || '#ef4444', socket };
      const room = { code, hostId: playerId, trackId: cleanText(message.trackId, 40) || 'coastal_highway', raceStarted: false, players: new Map([[playerId, player]]) };
      rooms.set(code, room);
      socketPlayers.set(socket, { playerId, roomCode: code });
      send(socket, { type: 'room_joined', roomCode: code, playerId, hostId: playerId, trackId: room.trackId, players: playerList(room) });
      return;
    }

    if (kind === 'join_room') {
      leaveRoom(socket);
      const code = cleanText(message.roomCode, 6);
      const room = rooms.get(code);
      if (!room) return send(socket, { type: 'error', message: 'لم يتم العثور على الغرفة. تأكد من الرمز وأن المضيف على الشبكة نفسها.' });
      if (room.raceStarted) return send(socket, { type: 'error', message: 'السباق بدأ بالفعل؛ أنشئ غرفة جديدة.' });
      if (room.players.size >= 6) return send(socket, { type: 'error', message: 'الغرفة مكتملة (الحد الأقصى 6 لاعبين).' });
      const player = { id: playerId, name: cleanText(message.name) || 'متسابق', carName: cleanText(message.carName) || 'سيارة سباق', color: cleanText(message.color, 16) || '#38bdf8', socket };
      room.players.set(playerId, player);
      socketPlayers.set(socket, { playerId, roomCode: code });
      send(socket, { type: 'room_joined', roomCode: code, playerId, hostId: room.hostId, trackId: room.trackId, players: playerList(room) });
      broadcastRoomState(room, playerId);
      broadcast(room, { type: 'player_joined', player: { id: player.id, name: player.name, carName: player.carName, color: player.color } }, playerId);
      return;
    }

    const identity = socketPlayers.get(socket);
    if (!identity) return send(socket, { type: 'error', message: 'أنشئ غرفة أو انضم إليها أولاً.' });
    const room = rooms.get(identity.roomCode);
    if (!room) return send(socket, { type: 'error', message: 'انتهت صلاحية الغرفة.' });

    if (kind === 'start_race') {
      if (room.hostId !== playerId) return send(socket, { type: 'error', message: 'المضيف فقط يمكنه بدء السباق.' });
      const trackId = cleanText(message.trackId, 40);
      if (trackId) room.trackId = trackId;
      room.raceStarted = true;
      broadcast(room, { type: 'race_start', roomCode: room.code, trackId: room.trackId, players: playerList(room) });
      return;
    }

    if (kind === 'player_state') {
      const now = Date.now();
      if (now - socket.lastStateAt < 45) return;
      socket.lastStateAt = now;
      const state = {
        type: 'player_state', playerId, color: room.players.get(playerId)?.color || '#38bdf8',
        x: Number.isFinite(message.x) ? Math.max(-500, Math.min(500, message.x)) : 0,
        z: Number.isFinite(message.z) ? Math.max(-500, Math.min(500, message.z)) : 0,
        heading: Number.isFinite(message.heading) ? message.heading : 0,
        speed: Number.isFinite(message.speed) ? Math.max(-100, Math.min(100, message.speed)) : 0,
        sentAt: now,
      };
      broadcast(room, state, playerId);
    }
  });

  socket.on('close', () => leaveRoom(socket));
  socket.on('error', () => leaveRoom(socket));
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) { socket.terminate(); continue; }
    socket.isAlive = false;
    socket.ping();
  }
}, 25000);

httpServer.listen(port, host, () => {
  console.log(`REMOCAR LAN server listening on ws://${host}:${port}`);
  const localAddresses = Object.values(networkInterfaces()).flatMap((items) => items ?? [])
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
  for (const address of localAddresses) console.log(`Connect devices on this Wi-Fi to ws://${address}:${port}`);
  console.log(`Health check: http://127.0.0.1:${port}/health`);
  console.log('Keep this private-network server running while friends join the same Wi-Fi.');
});

function shutdown() {
  clearInterval(heartbeat);
  for (const socket of wss.clients) socket.close(1001, 'Server shutting down');
  httpServer.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
