package com.mohammedalhzmi.remocar;

import android.util.Log;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

final class LanRoomServer extends WebSocketServer {
    private static final String TAG = "REMOCAR-LAN";
    private static final int MAX_PLAYERS = 6;
    private final String hostIp;
    private final int port;
    private final CountDownLatch ready = new CountDownLatch(1);
    private final Map<String, Player> players = new LinkedHashMap<>();
    private final Map<WebSocket, String> playerBySocket = new LinkedHashMap<>();
    private String roomCode = "";
    private String hostId = "";
    private String trackId = "coastal_highway";
    private String hostName = "REMOCAR";
    private boolean raceStarted = false;
    private boolean roundComplete = false;
    private boolean matchStarted = false;
    private boolean matchComplete = false;
    private int currentRound = 1;
    private int roundsTotal = 3;
    private final Map<String, Integer> scores = new LinkedHashMap<>();
    private final Map<String, Double> totalTimes = new LinkedHashMap<>();
    private final Map<String, RoundFinish> roundResults = new LinkedHashMap<>();
    private static final int[] POINTS_BY_PLACE = {25, 18, 15, 12, 10, 8};

    LanRoomServer(String hostIp, int port) {
        super(new InetSocketAddress("0.0.0.0", port));
        this.hostIp = hostIp;
        this.port = port;
        setReuseAddr(true);
        setConnectionLostTimeout(25);
    }

    @Override
    public void onOpen(WebSocket connection, ClientHandshake handshake) {
        String playerId = UUID.randomUUID().toString();
        synchronized (this) {
            playerBySocket.put(connection, playerId);
        }
        send(connection, json("type", "hello", "playerId", playerId));
    }

    @Override
    public void onClose(WebSocket connection, int code, String reason, boolean remote) {
        synchronized (this) {
            String playerId = playerBySocket.remove(connection);
            if (playerId == null) return;
            players.remove(playerId);
            scores.remove(playerId);
            totalTimes.remove(playerId);
            roundResults.remove(playerId);
            if (players.isEmpty()) {
                roomCode = "";
                hostId = "";
                raceStarted = false;
                roundComplete = false;
                matchStarted = false;
                matchComplete = false;
                currentRound = 1;
                roundsTotal = 3;
                scores.clear();
                totalTimes.clear();
                roundResults.clear();
            } else {
                if (hostId.equals(playerId)) hostId = players.keySet().iterator().next();
                broadcastRoomState();
                broadcast(json("type", "player_left", "playerId", playerId), null);
                completeRound();
            }
        }
    }

    @Override
    public void onMessage(WebSocket connection, String text) {
        try {
            handleMessage(connection, new JSONObject(text));
        } catch (JSONException error) {
            sendError(connection, "صيغة رسالة غير صالحة.");
        }
    }

    private synchronized void handleMessage(WebSocket connection, JSONObject message) {
        String type = message.optString("type", "");
        String playerId = playerBySocket.get(connection);
        if (playerId == null) return;

        if ("create_room".equals(type)) {
            removeFromRoom(connection, false);
            do {
                roomCode = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
            } while (players.containsKey(roomCode));
            Player player = new Player(playerId, clean(message.optString("name", "المضيف"), 28),
                    clean(message.optString("carName", "سيارة سباق"), 48), clean(message.optString("color", "#ef4444"), 16), connection);
            if (player.name.isEmpty()) player.name = "المضيف";
            players.put(playerId, player);
            hostId = playerId;
            hostName = player.name;
            trackId = clean(message.optString("trackId", "coastal_highway"), 40);
            if (trackId.isEmpty()) trackId = "coastal_highway";
            roundsTotal = Math.max(1, Math.min(9, message.optInt("roundsTotal", 3)));
            currentRound = 1;
            raceStarted = false;
            roundComplete = false;
            matchStarted = false;
            matchComplete = false;
            roundResults.clear();
            scores.clear();
            totalTimes.clear();
            scores.put(playerId, 0);
            totalTimes.put(playerId, 0.0);
            send(connection, roomJoined(playerId));
            return;
        }

        if ("join_room".equals(type)) {
            String requestedCode = clean(message.optString("roomCode", ""), 6);
            if (roomCode.isEmpty() || !roomCode.equals(requestedCode)) {
                sendError(connection, "لم يتم العثور على الغرفة. تأكد من الرمز وأن المضيف على الشبكة نفسها.");
                return;
            }
            if (matchStarted || raceStarted) {
                sendError(connection, "بدأت البطولة بالفعل؛ لا يمكن الانضمام إلى منتصف الجولات.");
                return;
            }
            if (players.size() >= MAX_PLAYERS) {
                sendError(connection, "الغرفة مكتملة (الحد الأقصى 6 لاعبين).");
                return;
            }
            removeFromRoom(connection, false);
            Player player = new Player(playerId, clean(message.optString("name", "متسابق"), 28),
                    clean(message.optString("carName", "سيارة سباق"), 48), clean(message.optString("color", "#38bdf8"), 16), connection);
            if (player.name.isEmpty()) player.name = "متسابق";
            players.put(playerId, player);
            scores.put(playerId, 0);
            totalTimes.put(playerId, 0.0);
            send(connection, roomJoined(playerId));
            broadcastRoomState();
            broadcast(json("type", "player_joined", "player", player.toJson()), playerId);
            return;
        }

        Player player = players.get(playerId);
        if (player == null || roomCode.isEmpty()) {
            sendError(connection, "أنشئ غرفة أو انضم إليها أولاً.");
            return;
        }

        if ("start_race".equals(type)) {
            if (!hostId.equals(playerId)) {
                sendError(connection, "المضيف فقط يمكنه بدء السباق.");
                return;
            }
            if (matchStarted || matchComplete) {
                sendError(connection, "بدأت البطولة بالفعل.");
                return;
            }
            if (players.size() < 2) {
                sendError(connection, "يلزم لاعبان على الأقل لبدء البطولة.");
                return;
            }
            String requestedTrack = clean(message.optString("trackId", trackId), 40);
            if (!requestedTrack.isEmpty()) trackId = requestedTrack;
            matchStarted = true;
            currentRound = 1;
            raceStarted = true;
            roundComplete = false;
            roundResults.clear();
            broadcastRaceStart();
            broadcastRoomState();
            return;
        }

        if ("start_next_round".equals(type)) {
            if (!hostId.equals(playerId)) {
                sendError(connection, "المضيف فقط يمكنه بدء الجولة التالية.");
                return;
            }
            if (matchComplete || !roundComplete || raceStarted || currentRound >= roundsTotal) {
                sendError(connection, "لا يمكن بدء الجولة التالية الآن.");
                return;
            }
            currentRound += 1;
            roundResults.clear();
            roundComplete = false;
            raceStarted = true;
            broadcastRaceStart();
            broadcastRoomState();
            return;
        }

        if ("finish_round".equals(type)) {
            if (!raceStarted || roundResults.containsKey(playerId)) return;
            double time = message.optDouble("time", Double.NaN);
            if (Double.isNaN(time) || Double.isInfinite(time) || time < 0.1 || time > 36000) {
                sendError(connection, "زمن الجولة غير صالح.");
                return;
            }
            roundResults.put(playerId, new RoundFinish(time, System.currentTimeMillis()));
            broadcast(json("type", "round_progress", "round", currentRound, "roundsTotal", roundsTotal,
                    "finishedCount", roundResults.size(), "playerCount", players.size(),
                    "finishedPlayerId", playerId, "finishedPlayerName", players.get(playerId).name), null);
            completeRound();
            return;
        }

        if ("player_state".equals(type)) {
            long now = System.currentTimeMillis();
            if (now - player.lastStateAt < 45) return;
            player.lastStateAt = now;
            JSONObject state = new JSONObject();
            try {
                state.put("type", "player_state");
                state.put("playerId", playerId);
                state.put("color", player.color);
                state.put("x", clamp(message.optDouble("x", 0), -500, 500));
                state.put("z", clamp(message.optDouble("z", 0), -500, 500));
                state.put("heading", clamp(message.optDouble("heading", 0), -100000, 100000));
                state.put("speed", clamp(message.optDouble("speed", 0), -100, 100));
                state.put("sentAt", now);
            } catch (JSONException ignored) { return; }
            broadcast(state, playerId);
        }
    }

    private void broadcastRaceStart() {
        broadcast(json("type", "race_start", "roomCode", roomCode, "trackId", trackId,
                "round", currentRound, "roundsTotal", roundsTotal, "scores", currentStandings(),
                "players", playerList()), null);
    }

    private void completeRound() {
        if (roundComplete || !raceStarted || players.isEmpty() || roundResults.size() < players.size()) return;
        List<Map.Entry<String, RoundFinish>> ordered = new ArrayList<>(roundResults.entrySet());
        Collections.sort(ordered, Comparator
                .comparingDouble((Map.Entry<String, RoundFinish> entry) -> entry.getValue().time)
                .thenComparingLong(entry -> entry.getValue().finishedAt));
        JSONArray finishOrder = new JSONArray();
        for (int index = 0; index < ordered.size(); index++) {
            Map.Entry<String, RoundFinish> entry = ordered.get(index);
            Player player = players.get(entry.getKey());
            if (player == null) continue;
            int points = index < POINTS_BY_PLACE.length ? POINTS_BY_PLACE[index] : 0;
            scores.put(player.id, scores.getOrDefault(player.id, 0) + points);
            totalTimes.put(player.id, totalTimes.getOrDefault(player.id, 0.0) + entry.getValue().time);
            finishOrder.put(json("playerId", player.id, "name", player.name,
                    "time", Math.round(entry.getValue().time * 1000.0) / 1000.0,
                    "place", index + 1, "pointsEarned", points));
        }
        raceStarted = false;
        roundComplete = true;
        JSONArray standings = currentStandings();
        JSONObject common = json("roomCode", roomCode, "trackId", trackId, "round", currentRound,
                "roundsTotal", roundsTotal, "finishOrder", finishOrder, "scores", standings);
        if (currentRound >= roundsTotal) {
            matchComplete = true;
            Object winner = standings.length() > 0 ? standings.optJSONObject(0) : JSONObject.NULL;
            try {
                common.put("type", "match_complete");
                common.put("winner", winner);
            } catch (JSONException error) {
                throw new IllegalStateException("Could not encode tournament winner", error);
            }
        } else {
            try {
                common.put("type", "round_complete");
            } catch (JSONException error) {
                throw new IllegalStateException("Could not encode round result", error);
            }
        }
        broadcast(common, null);
        broadcastRoomState();
    }

    private JSONArray currentStandings() {
        List<Player> ordered = new ArrayList<>(players.values());
        Collections.sort(ordered, (left, right) -> {
            int byPoints = Integer.compare(scores.getOrDefault(right.id, 0), scores.getOrDefault(left.id, 0));
            if (byPoints != 0) return byPoints;
            int byTime = Double.compare(totalTimes.getOrDefault(left.id, 0.0), totalTimes.getOrDefault(right.id, 0.0));
            return byTime != 0 ? byTime : left.name.compareToIgnoreCase(right.name);
        });
        JSONArray result = new JSONArray();
        for (Player player : ordered) {
            result.put(json("playerId", player.id, "name", player.name, "carName", player.carName,
                    "points", scores.getOrDefault(player.id, 0),
                    "totalTime", Math.round(totalTimes.getOrDefault(player.id, 0.0) * 1000.0) / 1000.0));
        }
        return result;
    }

    private JSONObject roomJoined(String playerId) {
        return json("type", "room_joined", "roomCode", roomCode, "playerId", playerId,
                "hostId", hostId, "trackId", trackId, "round", currentRound,
                "roundsTotal", roundsTotal, "scores", currentStandings(), "players", playerList());
    }

    private JSONArray playerList() {
        JSONArray list = new JSONArray();
        for (Player player : players.values()) list.put(player.toJson());
        return list;
    }

    private void broadcastRoomState() {
        broadcast(json("type", "room_state", "roomCode", roomCode, "trackId", trackId,
                "hostId", hostId, "raceStarted", raceStarted, "round", currentRound,
                "roundsTotal", roundsTotal, "scores", currentStandings(), "players", playerList()), null);
    }

    private void removeFromRoom(WebSocket connection, boolean notify) {
        String oldId = playerBySocket.get(connection);
        if (oldId == null || !players.containsKey(oldId)) return;
        players.remove(oldId);
        scores.remove(oldId);
        totalTimes.remove(oldId);
        roundResults.remove(oldId);
        if (players.isEmpty()) {
            roomCode = "";
            hostId = "";
            raceStarted = false;
            roundComplete = false;
            matchStarted = false;
            matchComplete = false;
            currentRound = 1;
            roundsTotal = 3;
            scores.clear();
            totalTimes.clear();
            roundResults.clear();
        } else {
            if (hostId.equals(oldId)) hostId = players.keySet().iterator().next();
            if (notify) {
                broadcastRoomState();
                broadcast(json("type", "player_left", "playerId", oldId), null);
                completeRound();
            }
        }
    }

    private void broadcast(JSONObject message, String exceptPlayerId) {
        for (Player player : new ArrayList<>(players.values())) {
            if (exceptPlayerId == null || !exceptPlayerId.equals(player.id)) send(player.socket, message);
        }
    }

    private void send(WebSocket connection, JSONObject message) {
        if (connection != null && connection.isOpen()) connection.send(message.toString());
    }

    private void sendError(WebSocket connection, String message) {
        send(connection, json("type", "error", "message", message));
    }

    synchronized String discoverySnapshot() {
        if (roomCode.isEmpty() || players.isEmpty()) return null;
        return json("type", "remocar_room", "ip", hostIp, "port", port, "roomCode", roomCode,
                "hostName", hostName, "trackId", trackId, "players", players.size(),
                "maxPlayers", MAX_PLAYERS).toString();
    }

    boolean awaitReady(long timeout, TimeUnit unit) throws InterruptedException {
        return ready.await(timeout, unit);
    }

    private static String clean(String value, int maxLength) {
        if (value == null) return "";
        String safe = value.replaceAll("[<>\\u0000-\\u001f]", "").trim();
        return safe.substring(0, Math.min(maxLength, safe.length()));
    }

    private static JSONObject json(Object... values) {
        JSONObject result = new JSONObject();
        for (int index = 0; index + 1 < values.length; index += 2) {
            try {
                result.put(String.valueOf(values[index]), values[index + 1]);
            } catch (JSONException error) {
                throw new IllegalArgumentException("Invalid LAN message", error);
            }
        }
        return result;
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    @Override
    public void onError(WebSocket connection, Exception error) {
        Log.w(TAG, "WebSocket room error", error);
    }

    @Override
    public void onStart() {
        Log.i(TAG, "LAN WebSocket host ready at " + hostIp + ":" + port);
        ready.countDown();
    }

    private static final class RoundFinish {
        final double time;
        final long finishedAt;

        RoundFinish(double time, long finishedAt) {
            this.time = time;
            this.finishedAt = finishedAt;
        }
    }

    private static final class Player {
        final String id;
        String name;
        final String carName;
        final String color;
        final WebSocket socket;
        long lastStateAt = 0;

        Player(String id, String name, String carName, String color, WebSocket socket) {
            this.id = id;
            this.name = name;
            this.carName = carName;
            this.color = color;
            this.socket = socket;
        }

        JSONObject toJson() {
            return json("id", id, "name", name, "carName", carName, "color", color);
        }
    }
}
