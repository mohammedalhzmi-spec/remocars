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

const POINTS_BY_PLACE = [25, 18, 15, 12, 10, 8];
const cleanText = (value, max = 28) => String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};
const playerList = (room) => [...room.players.values()].map(({ id, name, carName, color }) => ({ id, name, carName, color }));
function broadcast(room, message, omitId = '') {
  for (const [id, player] of room.players) if (id !== omitId) send(player.socket, message);
}
function currentStandings(room) {
  return [...room.players.values()].map((player) => {
    const score = room.scores.get(player.id) ?? { points: 0, totalTime: 0 };
    return { playerId: player.id, name: player.name, carName: player.carName, points: score.points, totalTime: Number(score.totalTime.toFixed(3)) };
  }).sort((a, b) => b.points - a.points || a.totalTime - b.totalTime || a.name.localeCompare(b.name));
}
function broadcastRoomState(room) {
  broadcast(room, {
    type: 'room_state', roomCode: room.code, trackId: room.trackId, hostId: room.hostId,
    raceStarted: room.raceStarted, round: room.currentRound, roundsTotal: room.roundsTotal,
    scores: currentStandings(room), players: playerList(room),
  });
}
function completeRound(room) {
  if (room.roundComplete || !room.raceStarted || room.roundResults.size < room.players.size || room.players.size === 0) return;
  const finishOrder = [...room.roundResults.entries()]
    .map(([playerId, result]) => ({ playerId, name: room.players.get(playerId)?.name ?? 'متسابق', time: result.time, finishedAt: result.finishedAt }))
    .sort((a, b) => a.time - b.time || a.finishedAt - b.finishedAt)
    .map((entry, index) => {
      const points = POINTS_BY_PLACE[index] ?? 0;
      const current = room.scores.get(entry.playerId) ?? { points: 0, totalTime: 0 };
      current.points += points;
      current.totalTime += entry.time;
      room.scores.set(entry.playerId, current);
      return { playerId: entry.playerId, name: entry.name, time: Number(entry.time.toFixed(3)), place: index + 1, pointsEarned: points };
    });
  room.raceStarted = false;
  room.roundComplete = true;
  const scores = currentStandings(room);
  const common = { roomCode: room.code, trackId: room.trackId, round: room.currentRound, roundsTotal: room.roundsTotal, finishOrder, scores };
  if (room.currentRound >= room.roundsTotal) {
    room.matchComplete = true;
    broadcast(room, { type: 'match_complete', ...common, winner: scores[0] ?? null });
  } else {
    broadcast(room, { type: 'round_complete', ...common });
  }
  broadcastRoomState(room);
}
function removePlayer(room, playerId) {
  room.players.delete(playerId);
  room.scores.delete(playerId);
  room.roundResults.delete(playerId);
  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }
  if (room.hostId === playerId) room.hostId = room.players.keys().next().value;
  broadcastRoomState(room);
  broadcast(room, { type: 'player_left', playerId });
  completeRound(room);
}
function leaveRoom(socket) {
  const record = socketPlayers.get(socket);
  if (!record) return;
  const room = rooms.get(record.roomCode);
  if (room) removePlayer(room, record.playerId);
  socketPlayers.delete(socket);
}
function startNextRound(room) {
  if (room.matchComplete || !room.roundComplete || room.raceStarted || room.currentRound >= room.roundsTotal) return false;
  room.currentRound += 1;
  room.roundResults.clear();
  room.roundComplete = false;
  room.raceStarted = true;
  broadcast(room, {
    type: 'race_start', roomCode: room.code, trackId: room.trackId,
    round: room.currentRound, roundsTotal: room.roundsTotal, scores: currentStandings(room), players: playerList(room),
  });
  broadcastRoomState(room);
  return true;
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
      const requestedRounds = Number(message.roundsTotal);
      const room = {
        code, hostId: playerId, trackId: cleanText(message.trackId, 40) || 'coastal_highway',
        roundsTotal: Number.isInteger(requestedRounds) ? Math.max(1, Math.min(9, requestedRounds)) : 3,
        currentRound: 1, raceStarted: false, roundComplete: false, matchStarted: false, matchComplete: false,
        players: new Map([[playerId, player]]), scores: new Map([[playerId, { points: 0, totalTime: 0 }]]), roundResults: new Map(),
      };
      rooms.set(code, room);
      socketPlayers.set(socket, { playerId, roomCode: code });
      send(socket, { type: 'room_joined', roomCode: code, playerId, hostId: playerId, trackId: room.trackId, round: room.currentRound, roundsTotal: room.roundsTotal, scores: currentStandings(room), players: playerList(room) });
      return;
    }

    if (kind === 'join_room') {
      leaveRoom(socket);
      const code = cleanText(message.roomCode, 6);
      const room = rooms.get(code);
      if (!room) return send(socket, { type: 'error', message: 'لم يتم العثور على الغرفة. تأكد من الرمز وأن المضيف على الشبكة نفسها.' });
      if (room.matchStarted || room.raceStarted) return send(socket, { type: 'error', message: 'بدأت البطولة بالفعل؛ لا يمكن الانضمام إلى منتصف الجولات.' });
      if (room.players.size >= 6) return send(socket, { type: 'error', message: 'الغرفة مكتملة (الحد الأقصى 6 لاعبين).' });
      const player = { id: playerId, name: cleanText(message.name) || 'متسابق', carName: cleanText(message.carName) || 'سيارة سباق', color: cleanText(message.color, 16) || '#38bdf8', socket };
      room.players.set(playerId, player);
      room.scores.set(playerId, { points: 0, totalTime: 0 });
      socketPlayers.set(socket, { playerId, roomCode: code });
      send(socket, { type: 'room_joined', roomCode: code, playerId, hostId: room.hostId, trackId: room.trackId, round: room.currentRound, roundsTotal: room.roundsTotal, scores: currentStandings(room), players: playerList(room) });
      broadcastRoomState(room);
      broadcast(room, { type: 'player_joined', player: { id: player.id, name: player.name, carName: player.carName, color: player.color } }, playerId);
      return;
    }

    const identity = socketPlayers.get(socket);
    if (!identity) return send(socket, { type: 'error', message: 'أنشئ غرفة أو انضم إليها أولاً.' });
    const room = rooms.get(identity.roomCode);
    if (!room) return send(socket, { type: 'error', message: 'انتهت صلاحية الغرفة.' });

    if (kind === 'start_race') {
      if (room.hostId !== playerId) return send(socket, { type: 'error', message: 'المضيف فقط يمكنه بدء السباق.' });
      if (room.matchStarted || room.matchComplete) return send(socket, { type: 'error', message: 'البطولة بدأت بالفعل.' });
      if (room.players.size < 2) return send(socket, { type: 'error', message: 'يلزم لاعبان على الأقل لبدء البطولة.' });
      const trackId = cleanText(message.trackId, 40);
      if (trackId) room.trackId = trackId;
      room.matchStarted = true;
      room.currentRound = 1;
      room.raceStarted = true;
      room.roundComplete = false;
      room.roundResults.clear();
      broadcast(room, { type: 'race_start', roomCode: room.code, trackId: room.trackId, round: room.currentRound, roundsTotal: room.roundsTotal, scores: currentStandings(room), players: playerList(room) });
      broadcastRoomState(room);
      return;
    }

    if (kind === 'start_next_round') {
      if (room.hostId !== playerId) return send(socket, { type: 'error', message: 'المضيف فقط يمكنه بدء الجولة التالية.' });
      if (!startNextRound(room)) return send(socket, { type: 'error', message: 'لا يمكن بدء الجولة التالية الآن.' });
      return;
    }

    if (kind === 'finish_round') {
      if (!room.raceStarted || room.roundResults.has(playerId)) return;
      const time = Number(message.time);
      if (!Number.isFinite(time) || time < 0.1 || time > 36000) return send(socket, { type: 'error', message: 'زمن الجولة غير صالح.' });
      room.roundResults.set(playerId, { time, finishedAt: Date.now() });
      broadcast(room, { type: 'round_progress', round: room.currentRound, roundsTotal: room.roundsTotal, finishedCount: room.roundResults.size, playerCount: room.players.size, finishedPlayerId: playerId, finishedPlayerName: room.players.get(playerId)?.name ?? 'متسابق' });
      completeRound(room);
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
