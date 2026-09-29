package com.mohammedalhzmi.remocar;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "LanHost")
public class LanHostPlugin extends Plugin {
    private static final String TAG = "REMOCAR-LAN";
    private static final int DEFAULT_PORT = 3001;
    private static final int DISCOVERY_PORT = 3002;
    private static final String DISCOVERY_REQUEST = "REMOCAR_SCAN_V1";
    private final ExecutorService executor = Executors.newCachedThreadPool(runnable -> {
        Thread thread = new Thread(runnable, "remocar-lan-worker");
        thread.setDaemon(true);
        return thread;
    });
    private LanRoomServer roomServer;
    private String hostIp = "";
    private boolean discoveryRunning = false;
    private DatagramSocket discoverySocket;
    private WifiManager.MulticastLock multicastLock;

    @PluginMethod
    public void startHost(PluginCall call) {
        int requestedPort = call.getInt("port", DEFAULT_PORT);
        final int port = requestedPort >= 1024 && requestedPort <= 65535 ? requestedPort : DEFAULT_PORT;
        final String name = call.getString("hostName", "REMOCAR");
        executor.execute(() -> {
            try {
                String address = findWifiAddress();
                if (address == null) {
                    call.reject("اتصل بشبكة Wi-Fi أو فعّل نقطة الاتصال من إعدادات Android أولاً.");
                    return;
                }
                synchronized (this) {
                    acquireMulticastLock();
                    if (roomServer == null || !hostIp.equals(address)) {
                        stopServerLocked();
                        hostIp = address;
                        roomServer = new LanRoomServer(hostIp, port);
                        roomServer.start();
                        if (!roomServer.awaitReady(5, TimeUnit.SECONDS)) {
                            stopServerLocked();
                            call.reject("تعذر تشغيل خادم Wi-Fi على المنفذ " + port + ".");
                            return;
                        }
                    }
                    startDiscoveryListenerLocked();
                }
                JSObject result = new JSObject();
                result.put("ip", address);
                result.put("port", port);
                result.put("localUrl", "ws://127.0.0.1:" + port);
                result.put("hostName", name == null ? "REMOCAR" : name);
                call.resolve(result);
            } catch (Exception error) {
                Log.e(TAG, "Could not start LAN host", error);
                call.reject("تعذر تشغيل استضافة الشبكة المحلية: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void discover(PluginCall call) {
        int requestedDuration = call.getInt("durationMs", 2400);
        int durationMs = Math.max(900, Math.min(6000, requestedDuration));
        executor.execute(() -> {
            try {
                synchronized (this) {
                    acquireMulticastLock();
                }
                Map<String, JSONObject> found = scanRooms(durationMs);
                JSArray rooms = new JSArray();
                for (JSONObject room : found.values()) rooms.put(room);
                JSObject result = new JSObject();
                result.put("rooms", rooms);
                call.resolve(result);
            } catch (Exception error) {
                Log.w(TAG, "LAN room discovery failed", error);
                call.reject("تعذر البحث عن غرف Wi-Fi. تأكد من اتصالك بالشبكة نفسها.");
            } finally {
                synchronized (this) {
                    if (roomServer == null) releaseMulticastLock();
                }
            }
        });
    }

    @PluginMethod
    public void stopHost(PluginCall call) {
        executor.execute(() -> {
            synchronized (this) {
                stopServerLocked();
                releaseMulticastLock();
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        synchronized (this) {
            stopServerLocked();
            releaseMulticastLock();
        }
        executor.shutdownNow();
        super.handleOnDestroy();
    }

    private void startDiscoveryListenerLocked() {
        if (discoveryRunning) return;
        discoveryRunning = true;
        Thread listener = new Thread(() -> {
            try {
                DatagramSocket socket = new DatagramSocket(null);
                socket.setReuseAddress(true);
                socket.bind(new InetSocketAddress("0.0.0.0", DISCOVERY_PORT));
                socket.setSoTimeout(900);
                synchronized (this) { discoverySocket = socket; }
                byte[] buffer = new byte[256];
                while (discoveryRunning && !socket.isClosed()) {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    try {
                        socket.receive(packet);
                        String request = new String(packet.getData(), packet.getOffset(), packet.getLength(), java.nio.charset.StandardCharsets.UTF_8);
                        if (!DISCOVERY_REQUEST.equals(request)) continue;
                        LanRoomServer activeServer;
                        synchronized (this) { activeServer = roomServer; }
                        String snapshot = activeServer == null ? null : activeServer.discoverySnapshot();
                        if (snapshot != null) {
                            byte[] bytes = snapshot.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                            socket.send(new DatagramPacket(bytes, bytes.length, packet.getAddress(), packet.getPort()));
                        }
                    } catch (SocketTimeoutException ignored) {
                        // Poll the stop flag periodically so the listener can be closed cleanly.
                    }
                }
                socket.close();
            } catch (Exception error) {
                if (discoveryRunning) Log.w(TAG, "Room discovery listener stopped", error);
            } finally {
                synchronized (this) {
                    discoveryRunning = false;
                    discoverySocket = null;
                }
            }
        }, "remocar-lan-discovery-host");
        listener.setDaemon(true);
        listener.start();
    }

    private Map<String, JSONObject> scanRooms(int durationMs) throws Exception {
        Map<String, JSONObject> found = new HashMap<>();
        Set<InetAddress> destinations = getBroadcastAddresses();
        if (destinations.isEmpty()) destinations.add(InetAddress.getByName("255.255.255.255"));
        byte[] request = DISCOVERY_REQUEST.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        long deadline = System.currentTimeMillis() + durationMs;
        long lastSent = 0;
        try (DatagramSocket socket = new DatagramSocket()) {
            socket.setBroadcast(true);
            socket.setSoTimeout(180);
            while (System.currentTimeMillis() < deadline) {
                long now = System.currentTimeMillis();
                if (now - lastSent >= 450) {
                    for (InetAddress destination : destinations) {
                        try {
                            socket.send(new DatagramPacket(request, request.length, destination, DISCOVERY_PORT));
                        } catch (Exception ignored) {
                            // One interface can reject a broadcast while another is still usable.
                        }
                    }
                    lastSent = now;
                }
                byte[] buffer = new byte[1024];
                DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                try {
                    socket.receive(response);
                    JSONObject room = new JSONObject(new String(response.getData(), response.getOffset(), response.getLength(), java.nio.charset.StandardCharsets.UTF_8));
                    if ("remocar_room".equals(room.optString("type")) && !room.optString("roomCode").isEmpty()) {
                        found.put(room.optString("roomCode"), room);
                    }
                } catch (SocketTimeoutException ignored) {
                    // Continue sending probes until the requested scan window expires.
                } catch (JSONException ignored) {
                    // Ignore malformed packets from unrelated apps on this network.
                }
            }
        }
        return found;
    }

    private Set<InetAddress> getBroadcastAddresses() throws Exception {
        Set<InetAddress> result = new HashSet<>();
        Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
        if (interfaces == null) return result;
        while (interfaces.hasMoreElements()) {
            NetworkInterface network = interfaces.nextElement();
            try {
                if (!network.isUp() || network.isLoopback()) continue;
                for (java.net.InterfaceAddress address : network.getInterfaceAddresses()) {
                    InetAddress broadcast = address.getBroadcast();
                    if (broadcast != null && broadcast instanceof Inet4Address) result.add(broadcast);
                }
            } catch (SocketException ignored) {
                // Skip interfaces that disappear while Wi-Fi is changing.
            }
        }
        result.add(InetAddress.getByName("255.255.255.255"));
        return result;
    }

    private String findWifiAddress() throws SocketException {
        List<NetworkInterface> interfaces = new ArrayList<>();
        Enumeration<NetworkInterface> values = NetworkInterface.getNetworkInterfaces();
        if (values == null) return null;
        while (values.hasMoreElements()) {
            NetworkInterface network = values.nextElement();
            try {
                if (network.isUp() && !network.isLoopback()) interfaces.add(network);
            } catch (SocketException ignored) {
                // Skip transient network interfaces.
            }
        }
        Collections.sort(interfaces, (left, right) -> Integer.compare(interfacePriority(left.getName()), interfacePriority(right.getName())));
        for (NetworkInterface network : interfaces) {
            String name = network.getName().toLowerCase(java.util.Locale.ROOT);
            if (!(name.startsWith("wlan") || name.startsWith("ap") || name.startsWith("swlan") || name.startsWith("wifi"))) continue;
            for (java.net.InterfaceAddress address : network.getInterfaceAddresses()) {
                InetAddress ip = address.getAddress();
                if (ip instanceof Inet4Address && !ip.isLoopbackAddress() && ip.isSiteLocalAddress()) return ip.getHostAddress();
            }
        }
        return null;
    }

    private static int interfacePriority(String name) {
        String value = name.toLowerCase(java.util.Locale.ROOT);
        if (value.startsWith("wlan")) return 0;
        if (value.startsWith("ap") || value.startsWith("swlan")) return 1;
        return 2;
    }

    private void acquireMulticastLock() {
        if (multicastLock != null && multicastLock.isHeld()) return;
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi != null) {
            multicastLock = wifi.createMulticastLock("remocar-lan-discovery");
            multicastLock.setReferenceCounted(false);
            multicastLock.acquire();
        }
    }

    private void releaseMulticastLock() {
        if (multicastLock != null && multicastLock.isHeld()) multicastLock.release();
        multicastLock = null;
    }

    private void stopServerLocked() {
        discoveryRunning = false;
        if (discoverySocket != null) discoverySocket.close();
        discoverySocket = null;
        if (roomServer != null) {
            try {
                roomServer.stop(1200);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                Log.w(TAG, "Interrupted while stopping LAN host", error);
            }
            roomServer = null;
        }
        hostIp = "";
    }
}
