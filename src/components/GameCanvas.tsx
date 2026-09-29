import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car, Track, ReplayFrame, LeaderboardEntry, PlayerProfile, Upgrade } from '../types';
import { getTrackLayout } from '../data/trackLayouts';
import { getLevelBenefits } from '../data/progression';
import { RaceCoach } from '../data/raceCoaches';
import { lanMultiplayer, LanTournamentResult } from '../app/lanMultiplayer';
import { makeVehicle as makeVehicleModel } from '../app/vehicleModel';
import { createCoastalWater, createSkyDome, createSurfaceTexture, createTerrainMesh } from '../app/trackEnvironment';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, Thermometer, Camera, Flame, Pause, Play, RotateCcw } from 'lucide-react';

interface GameCanvasProps {
  car: Car;
  track: Track;
  profile: PlayerProfile;
  upgrades: Upgrade[];
  leaderboardEntry?: LeaderboardEntry;
  isReplayMode?: boolean;
  isMultiplayerRoom?: boolean;
  multiplayerRound?: number;
  multiplayerRoundsTotal?: number;
  multiplayerResult?: LanTournamentResult | null;
  multiplayerFinishedCount?: number;
  multiplayerPlayerCount?: number;
  multiplayerDidSubmit?: boolean;
  multiplayerIsHost?: boolean;
  coach: RaceCoach;
  replayFrames?: ReplayFrame[];
  onFinishRace: (won: boolean, coinsEarned: number, frames: ReplayFrame[], lapTime: number) => void;
  onFinishMultiplayerRound?: (lapTime: number) => void;
  onStartNextMultiplayerRound?: () => void;
  onExitMultiplayer?: () => void;
  onQuit: () => void;
}

type DriveInput = 'accelerate' | 'brake' | 'left' | 'right' | 'nitro';
type Vehicle = { group: THREE.Group; progress: number; speed: number; finished: boolean };

function makeVehicle(color: string, secondaryColor: string, modelType: Car['modelType']): THREE.Group {
  const group = new THREE.Group();
  const bodyColor = new THREE.Color(color);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(modelType === 'monster' ? 2.5 : 2.1, modelType === 'monster' ? 1.05 : 0.62, modelType === 'sport' ? 4.5 : 3.9),
    new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.65, roughness: 0.28 })
  );
  body.position.y = 0.66;
  body.castShadow = true;
  group.add(body);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.16, 1.25),
    new THREE.MeshStandardMaterial({ color: bodyColor.clone().multiplyScalar(1.16), metalness: 0.7, roughness: 0.25 })
  );
  hood.position.set(0, 1.02, 1.05);
  hood.castShadow = true;
  group.add(hood);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.67, 1.85),
    new THREE.MeshStandardMaterial({ color: secondaryColor, metalness: 0.35, roughness: 0.2 })
  );
  cabin.position.set(0, 1.24, -0.3);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelRadius = modelType === 'monster' ? 0.58 : 0.42;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.34, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.76 });
  for (const [x, z] of [[-1.08, 1.15], [1.08, 1.15], [-1.08, -1.2], [1.08, -1.2]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, wheelRadius, z);
    wheel.castShadow = true;
    group.add(wheel);
  }

  const headlampMat = new THREE.MeshBasicMaterial({ color: 0xfff2c2 });
  for (const x of [-0.63, 0.63]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), headlampMat);
    lamp.position.set(x, 0.73, 2.27);
    group.add(lamp);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  for (const x of [-0.66, 0.66]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.08), tailMat);
    lamp.position.set(x, 0.76, -2.1);
    group.add(lamp);
  }

  if (modelType === 'sport' || modelType === 'cyber' || modelType === 'drift') {
    const spoiler = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.12, 0.48),
      new THREE.MeshStandardMaterial({ color: secondaryColor, metalness: 0.45, roughness: 0.38 })
    );
    spoiler.position.set(0, 1.16, -1.86);
    spoiler.castShadow = true;
    group.add(spoiler);
  }
  if (modelType === 'monster') {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 1.7), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.2 }));
    roof.position.set(0, 1.82, -0.15);
    group.add(roof);
  }
  return group;
}

function createRibbon(curve: THREE.CatmullRomCurve3, width: number, segments: number, elevation = 0.12): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = curve.getLength();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize().multiplyScalar(width / 2);
    positions.push(point.x + side.x, elevation, point.z + side.z);
    positions.push(point.x - side.x, elevation, point.z - side.z);
    uvs.push((t * length) / 7, 0, (t * length) / 7, 1);
    if (i < segments) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function closestProgress(samples: readonly THREE.Vector3[], x: number, z: number): { t: number; distance: number } {
  let bestT = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < samples.length - 1; i++) {
    const point = samples[i];
    const distance = Math.hypot(point.x - x, point.z - z);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestT = i / (samples.length - 1);
    }
  }
  return { t: bestT, distance: bestDistance };
}

function createCockpitModel(): { group: THREE.Group; steeringWheel: THREE.Group } {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x11151a, metalness: 0.45, roughness: 0.42 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x38414a, metalness: 0.72, roughness: 0.3 });
  const glass = new THREE.MeshBasicMaterial({ color: 0x9bb8c6, transparent: true, opacity: 0.045, side: THREE.DoubleSide });
  const emissive = new THREE.MeshBasicMaterial({ color: 0x21d4fd });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffa846 });
  const white = new THREE.MeshBasicMaterial({ color: 0xe8eef4 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  };

  const windshield = add(new THREE.PlaneGeometry(2.35, 1.34), glass, [0, 0.16, -1.34]);
  windshield.renderOrder = 2;
  add(new THREE.BoxGeometry(0.12, 1.55, 0.18), dark, [-1.12, 0.12, -1.28]).rotation.z = -0.18;
  add(new THREE.BoxGeometry(0.12, 1.55, 0.18), dark, [1.12, 0.12, -1.28]).rotation.z = 0.18;
  add(new THREE.BoxGeometry(2.3, 0.13, 0.18), dark, [0, 0.86, -1.3]);
  add(new THREE.BoxGeometry(3.1, 0.38, 1.0), dark, [0, -0.52, -0.92]);
  add(new THREE.BoxGeometry(2.85, 0.08, 0.82), trim, [0, -0.33, -0.94]);

  for (const x of [-0.58, -0.02]) {
    const dial = add(new THREE.CircleGeometry(0.18, 28), new THREE.MeshBasicMaterial({ color: 0x090e15 }), [x, 0.01, -0.51]);
    dial.rotation.y = Math.PI;
    add(new THREE.TorusGeometry(0.18, 0.018, 8, 28), trim, [x, 0.01, -0.505]);
    const needle = add(new THREE.BoxGeometry(0.014, 0.13, 0.012), amber, [x, 0.045, -0.49]);
    needle.rotation.z = -0.35;
  }

  const screen = add(new THREE.BoxGeometry(0.52, 0.3, 0.035), new THREE.MeshBasicMaterial({ color: 0x071b28 }), [0.53, -0.13, -0.56]);
  screen.rotation.x = -0.16;
  add(new THREE.BoxGeometry(0.35, 0.022, 0.012), emissive, [0.53, -0.06, -0.535]);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.07, 0.025, 0.012), i === 1 ? amber : white, [0.42 + i * 0.105, -0.17, -0.535]);
  for (const x of [-0.96, 0.96]) {
    const vent = add(new THREE.TorusGeometry(0.12, 0.025, 8, 20), trim, [x, -0.12, -0.56]);
    vent.scale.y = 0.78;
  }

  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(-0.53, -0.29, -0.55);
  group.add(steeringWheel);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 10, 36), dark);
  steeringWheel.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.08, 24), trim);
  hub.rotation.x = Math.PI / 2;
  steeringWheel.add(hub);
  for (const angle of [0, Math.PI * 0.68, Math.PI * 1.32]) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.31, 0.045), trim);
    spoke.position.set(Math.sin(angle) * 0.15, Math.cos(angle) * 0.15, 0);
    spoke.rotation.z = -angle;
    steeringWheel.add(spoke);
  }
  add(new THREE.BoxGeometry(0.62, 0.12, 0.1), dark, [0, 0.91, -0.91]);
  add(new THREE.BoxGeometry(0.54, 0.16, 0.12), trim, [0, 0.86, -0.78]);
  group.traverse((object) => { if (object instanceof THREE.Mesh) object.frustumCulled = false; });
  group.visible = false;
  return { group, steeringWheel };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  car,
  track,
  profile,
  upgrades,
  leaderboardEntry,
  isReplayMode = false,
  isMultiplayerRoom = false,
  multiplayerRound = 1,
  multiplayerRoundsTotal = 3,
  multiplayerResult = null,
  multiplayerFinishedCount = 0,
  multiplayerPlayerCount = 0,
  multiplayerDidSubmit = false,
  multiplayerIsHost = false,
  coach,
  replayFrames = [],
  onFinishRace,
  onFinishMultiplayerRound,
  onStartNextMultiplayerRound,
  onExitMultiplayer,
  onQuit,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<Record<DriveInput, boolean>>({ accelerate: false, brake: false, left: false, right: false, nitro: false });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const gameStateRef = useRef<'countdown' | 'racing' | 'finished' | 'paused'>(isReplayMode ? 'racing' : 'countdown');
  const cameraModeRef = useRef<'chase' | 'hood' | 'cockpit' | 'topdown'>('chase');
  const nitroActiveRef = useRef(false);
  const finishedRef = useRef(false);
  const replayIndexRef = useRef(0);
  const recordedFramesRef = useRef<ReplayFrame[]>([]);
  const previousProgressRef = useRef(0.01);
  const coinMeshesRef = useRef<{ mesh: THREE.Mesh; collected: boolean }[]>([]);
  const physicsRef = useRef({ x: 0, z: 0, heading: 0, speed: 0 });
  const lapRef = useRef(1);
  const runRef = useRef({
    gameState: 'countdown' as 'countdown' | 'racing' | 'finished' | 'paused',
    cameraMode: 'chase' as 'chase' | 'hood' | 'cockpit' | 'topdown',
    nitroActive: false,
    pausedFrom: 'racing' as 'racing' | 'countdown',
  });

  const [gameState, setGameState] = useState<'countdown' | 'racing' | 'finished' | 'paused'>(isReplayMode ? 'racing' : 'countdown');
  const [countdownNum, setCountdownNum] = useState(3);
  const [lap, setLap] = useState(1);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [raceTime, setRaceTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [engineTemp, setEngineTemp] = useState(45);
  const [nitroCharge, setNitroCharge] = useState(() => getLevelBenefits(profile.level).nitroCapacity);
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood' | 'cockpit' | 'topdown'>('chase');
  const [driftScore, setDriftScore] = useState(0);
  const [raceWon, setRaceWon] = useState(false);

  const layout = useMemo(() => getTrackLayout(track.id), [track.id]);
  const [trackProgress, setTrackProgress] = useState(0.01);
  const minimapPoints = useMemo(() => {
    const xs = layout.points.map(([x]) => x);
    const zs = layout.points.map(([, z]) => z);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    return layout.points.map(([x, z]) => `${10 + ((x - minX) / Math.max(1, maxX - minX)) * 80},${7 + ((maxZ - z) / Math.max(1, maxZ - minZ)) * 56}`);
  }, [layout]);
  const minimapMarker = minimapPoints[Math.floor(trackProgress * minimapPoints.length) % minimapPoints.length]?.split(',').map(Number) ?? [50, 35];
  const levelBenefits = useMemo(() => getLevelBenefits(profile.level), [profile.level]);
  const baseRef = useMemo(() => ({
    maxSpeed: (car.speed / 2.8) * levelBenefits.speedMultiplier,
    acceleration: (car.acceleration / 22) * levelBenefits.accelerationMultiplier,
    handling: (1.3 + car.handling / 90 + ((upgrades.find((u) => u.id === 'tires')?.level ?? 1) - 1) * 0.12) * levelBenefits.handlingMultiplier,
  }), [car.id, car.speed, car.acceleration, car.handling, levelBenefits, upgrades]);

  // Keep the animation loop in sync without re-creating WebGL state on each HUD render.
  runRef.current.gameState = gameState;
  runRef.current.cameraMode = cameraMode;

  const setInput = (key: DriveInput, pressed: boolean) => {
    inputRef.current[key] = pressed;
  };

  useEffect(() => {
    if (gameState !== 'countdown' || isReplayMode) return;
    if (countdownNum > 0) {
      soundManager.playStartBeep(false);
      const timer = window.setTimeout(() => setCountdownNum((n) => n - 1), 1000);
      return () => window.clearTimeout(timer);
    }
    soundManager.playStartBeep(true);
    gameStateRef.current = 'racing';
    setGameState('racing');
  }, [gameState, countdownNum, isReplayMode]);

  useEffect(() => {
    if (gameState !== 'racing') return;
    const timer = window.setInterval(() => setRaceTime((time) => time + 0.1), 100);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    const handleDown = (event: KeyboardEvent) => {
      const map: Record<string, DriveInput | undefined> = {
        KeyW: 'accelerate', ArrowUp: 'accelerate', KeyS: 'brake', ArrowDown: 'brake',
        KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'nitro',
      };
      const key = map[event.code];
      if (key) {
        if (key === 'nitro') {
          event.preventDefault();
          activateNitro();
        } else setInput(key, true);
      }
      if (event.code === 'KeyC') cycleCamera();
    };
    const handleUp = (event: KeyboardEvent) => {
      const map: Record<string, DriveInput | undefined> = {
        KeyW: 'accelerate', ArrowUp: 'accelerate', KeyS: 'brake', ArrowDown: 'brake',
        KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
      };
      const key = map[event.code];
      if (key) setInput(key, false);
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      inputRef.current = { accelerate: false, brake: false, left: false, right: false, nitro: false };
    };
  }, [nitroCharge, engineTemp, gameState, profile.level]);

  function cycleCamera() {
    setCameraMode((mode) => {
      const next = mode === 'chase' ? 'hood' : mode === 'hood' ? 'cockpit' : mode === 'cockpit' ? 'topdown' : 'chase';
      cameraModeRef.current = next;
      return next;
    });
  }

  function activateNitro() {
    if (nitroCharge < 18 || engineTemp >= 108 || gameStateRef.current !== 'racing' || nitroActiveRef.current) return;
    nitroActiveRef.current = true;
    runRef.current.nitroActive = true;
    const nitroCost = Math.max(16, 28 - Math.max(0, profile.level - 1) * 0.7);
    const nitroDuration = 1350 + Math.min(650, Math.max(0, profile.level - 1) * 45);
    setNitroCharge((charge) => Math.max(0, charge - nitroCost));
    soundManager.playNitro();
    window.setTimeout(() => {
      nitroActiveRef.current = false;
      runRef.current.nitroActive = false;
    }, nitroDuration);
  }

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(layout.sky);
    scene.fog = new THREE.Fog(layout.fog, layout.fogDensity);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(62, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight), 0.1, 1200);
    camera.position.set(0, 7, -15);
    scene.add(camera);
    cameraRef.current = camera;
    const cockpitRig = createCockpitModel();
    camera.add(cockpitRig.group);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
    } catch (error) {
      console.error('WebGL is unavailable on this device.', error);
      return;
    }
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowEndDevice = (navigator.hardwareConcurrency || 4) <= 4 || (deviceMemory ?? 4) <= 3;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEndDevice ? 1.35 : 1.75));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc7ddff, layout.ground, 1.45));
    const sun = new THREE.DirectionalLight(0xfff1d5, 2.25);
    sun.position.set(-60, 110, -30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(lowEndDevice ? 512 : 1024, lowEndDevice ? 512 : 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 520;
    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    sun.shadow.bias = -0.00035;
    sun.shadow.normalBias = 0.025;
    scene.add(sun);
    scene.add(createSkyDome(layout.sky, layout.fog));

    const points = layout.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.42);
    curve.closed = true;
    curve.arcLengthDivisions = 500;
    const trackLength = curve.getLength();
    const trackSamples = Array.from({ length: 241 }, (_, index) => curve.getPointAt(index / 240));

    if (track.id.includes('coastal')) scene.add(createCoastalWater());
    scene.add(createTerrainMesh(curve, layout, track.id));

    const gravelTexture = createSurfaceTexture('#807e75', track.id.length * 71, 6000);

    const shoulder = new THREE.Mesh(
      createRibbon(curve, layout.width + 2.6, 440, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xe7e5dc, map: gravelTexture, roughness: 0.96, side: THREE.DoubleSide })
    );
    shoulder.receiveShadow = true;
    scene.add(shoulder);

    const asphaltTexture = createSurfaceTexture('#45494c', track.id.length * 149, 10000);
    const road = new THREE.Mesh(
      createRibbon(curve, layout.width, 440),
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: asphaltTexture, roughness: 0.91, metalness: 0.01, side: THREE.DoubleSide })
    );
    road.receiveShadow = true;
    road.castShadow = false;
    scene.add(road);

    const lanePaint = new THREE.MeshStandardMaterial({ color: 0xf6f0d3, roughness: 0.88, side: THREE.DoubleSide });
    const dummy = new THREE.Object3D();
    const laneDashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.022, 1.6), lanePaint, 36);
    for (let i = 0; i < 36; i++) {
      const t = (i + 0.5) / 36;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      dummy.position.set(p.x, 0.15, p.z);
      dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
      dummy.updateMatrix();
      laneDashes.setMatrixAt(i, dummy.matrix);
    }
    scene.add(laneDashes);

    const curbRed = new THREE.MeshStandardMaterial({ color: 0xe2443e, roughness: 0.78 });
    const curbWhite = new THREE.MeshStandardMaterial({ color: 0xf1eee5, roughness: 0.82 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x8d9aa7, metalness: 0.72, roughness: 0.32 });
    const railPosts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.82, 0.16), railMaterial, 84);
    for (const sign of [-1, 1]) {
      const railPoints: THREE.Vector3[] = [];
      for (let i = 0; i < 120; i++) {
        const p = curve.getPointAt(i / 120);
        const tangent = curve.getTangentAt(i / 120);
        const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
        const offset = layout.width * 0.68 * sign;
        railPoints.push(new THREE.Vector3(p.x + side.x * offset, 0.94, p.z + side.z * offset));
      }
      const railCurve = new THREE.CatmullRomCurve3(railPoints, true);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 360, 0.12, 8, true), railMaterial));
      for (let i = 0; i < 42; i++) {
        const t = (i + 0.25) / 42;
        const p = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
        const offset = layout.width * 0.68 * sign;
        dummy.position.set(p.x + side.x * offset, 0.45, p.z + side.z * offset);
        dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
        dummy.updateMatrix();
        railPosts.setMatrixAt((sign === -1 ? 0 : 42) + i, dummy.matrix);
      }
    }
    railPosts.castShadow = true;
    scene.add(railPosts);

    const curbGeometry = new THREE.BoxGeometry(0.8, 0.13, 2.1);
    const redCurbs = [new THREE.InstancedMesh(curbGeometry, curbRed, 56), new THREE.InstancedMesh(curbGeometry, curbRed, 56)];
    const whiteCurbs = [new THREE.InstancedMesh(curbGeometry, curbWhite, 56), new THREE.InstancedMesh(curbGeometry, curbWhite, 56)];
    for (let i = 0; i < 112; i++) {
      const t = (i + 0.5) / 112;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);
      for (const sign of [-1, 1]) {
        dummy.position.set(p.x + side.x * layout.width * 0.46 * sign, 0.19, p.z + side.z * layout.width * 0.46 * sign);
        dummy.rotation.set(0, angle, 0);
        dummy.updateMatrix();
        const sideIndex = sign === -1 ? 0 : 1;
        const instances = i % 2 ? redCurbs[sideIndex] : whiteCurbs[sideIndex];
        instances.setMatrixAt(Math.floor(i / 2), dummy.matrix);
      }
    }
    [...redCurbs, ...whiteCurbs].forEach((instances) => { instances.receiveShadow = true; scene.add(instances); });

    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.78 });
    const edgeOffset = layout.width * 0.42;
    for (const sign of [-1, 1]) {
      const edgePoints: THREE.Vector3[] = [];
      for (let i = 0; i < 180; i++) {
        const t = i / 180;
        const p = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize().multiplyScalar(edgeOffset * sign);
        edgePoints.push(new THREE.Vector3(p.x + side.x, 0.2, p.z + side.z));
      }
      const edgeCurve = new THREE.CatmullRomCurve3(edgePoints, true);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(edgeCurve, 360, 0.11, 6, true), lineMat));
    }

    // Start/finish stripe and spectator cones are generated per layout.
    const start = curve.getPointAt(0.01);
    const startTangent = curve.getTangentAt(0.01);
    const startAngle = Math.atan2(startTangent.x, startTangent.z);
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(layout.width, 0.05, 1.25),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    );
    gate.position.set(start.x, 0.24, start.z);
    gate.rotation.y = startAngle;
    scene.add(gate);
    for (let i = 0; i < 8; i++) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(layout.width / 8 - 0.03, 0.07, 1.3),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0x0f172a : 0xef4444 })
      );
      const localX = -layout.width / 2 + (i + 0.5) * (layout.width / 8);
      block.position.set(
        start.x + Math.cos(startAngle) * localX,
        0.29,
        start.z - Math.sin(startAngle) * localX
      );
      block.rotation.y = startAngle;
      scene.add(block);
    }

    for (let i = 0; i < 54; i++) {
      const t = (i + 0.3) / 54;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      const sign = i % 2 ? 1 : -1;
      const distance = layout.width * (0.95 + (i % 3) * 0.28);
      const x = p.x + side.x * distance * sign;
      const z = p.z + side.z * distance * sign;
      if ((track.id === 'mp_neon_docks' || track.id === 'city_ring') && i % 2 === 0) {
        const isNightCity = track.id === 'mp_neon_docks';
        const height = (isNightCity ? 8 : 10) + (i % 3) * 3;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(5.5, height, 4.8), new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? (isNightCity ? 0x273048 : 0x65737b) : (isNightCity ? 0x182434 : 0x3e4b53), roughness: 0.68, metalness: 0.2 }));
        tower.position.set(x, height / 2, z);
        tower.castShadow = true;
        scene.add(tower);
        const neon = new THREE.Mesh(new THREE.BoxGeometry(5.65, 0.16, 0.08), new THREE.MeshBasicMaterial({ color: isNightCity ? (i % 4 === 0 ? 0xf472b6 : 0x22d3ee) : (i % 4 === 0 ? 0xfbbf24 : 0x67e8f9) }));
        neon.position.set(x, height * 0.62, z + 2.45);
        scene.add(neon);
        for (let floor = 1; floor < Math.floor(height / 2.5); floor++) {
          const windows = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.07), new THREE.MeshBasicMaterial({ color: isNightCity ? (floor % 2 ? 0x5287a0 : 0xc084fc) : (floor % 2 ? 0xfde68a : 0xb8d6e1) }));
          windows.position.set(x, floor * 2.4, z + 2.46);
          scene.add(windows);
        }
      } else if ((track.id === 'mp_desert_canyon' || track.id === 'desert_canyon') && i % 2 === 0) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1 + (i % 3) * 0.6, 0), new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? 0xc68b4b : 0x8b5e37, roughness: 0.98 }));
        rock.position.set(x, 1.5, z);
        rock.rotation.set(i * 0.31, i * 0.57, i * 0.19);
        rock.scale.y = 1.2 + (i % 3) * 0.25;
        rock.castShadow = true;
        scene.add(rock);
      } else if (track.id === 'volcano_night' && i % 2 === 0) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + (i % 3) * 0.65, 1), new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? 0x4a3536 : 0x30292e, roughness: 0.96, flatShading: true }));
        rock.position.set(x, 1.3, z);
        rock.rotation.set(i * 0.37, i * 0.53, i * 0.21);
        rock.scale.y = 1.4 + (i % 3) * 0.22;
        rock.castShadow = true;
        scene.add(rock);
        const lavaVein = new THREE.Mesh(new THREE.BoxGeometry(1.5 + (i % 4) * 0.2, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0xffb45b : 0xf05a3d }));
        lavaVein.position.set(x, 2.1, z + 1.45);
        lavaVein.rotation.y = i * 0.38;
        scene.add(lavaVein);
      } else if (i % 3 === 0 && layout.decoration === 'trees') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0x6b4428 }));
        trunk.position.set(x, 1.05, z);
        trunk.castShadow = true;
        scene.add(trunk);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.4, 8), new THREE.MeshStandardMaterial({ color: layout.decorationColor, roughness: 0.9 }));
        crown.position.set(x, 3.35, z);
        crown.castShadow = true;
        scene.add(crown);
      } else {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 8), new THREE.MeshStandardMaterial({ color: layout.decorationColor, roughness: 0.5 }));
        cone.position.set(x, 0.65, z);
        cone.castShadow = true;
        scene.add(cone);
      }
    }

    if (track.id.includes('snow') || track.id.includes('mountain')) {
      const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x677780, roughness: 0.98 });
      const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xe9f1f5, roughness: 0.9 });
      for (let i = 0; i < 11; i++) {
        const angle = (i / 11) * Math.PI * 2;
        const radius = 205 + (i % 3) * 18;
        const height = 58 + (i % 4) * 12;
        const mountain = new THREE.Mesh(new THREE.ConeGeometry(34 + (i % 3) * 7, height, 18, 8), rockMaterial);
        mountain.position.set(Math.cos(angle) * radius, height * 0.42, Math.sin(angle) * radius);
        mountain.rotation.y = angle * 0.7;
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        scene.add(mountain);
        if (i % 2 === 0) {
          const capHeight = height * 0.36;
          const snowCap = new THREE.Mesh(new THREE.ConeGeometry(20 + (i % 3) * 4, capHeight, 18, 5), snowMaterial);
          snowCap.position.set(mountain.position.x, height * 0.78, mountain.position.z);
          snowCap.rotation.y = mountain.rotation.y;
          scene.add(snowCap);
        }
      }
    }

    const player = makeVehicleModel(car.color, car.secondaryColor, car.modelType, car.customization);
    playerRef.current = player;
    scene.add(player);
    const spawnT = 0.01;
    const spawnPoint = curve.getPointAt(spawnT);
    const spawnTangent = curve.getTangentAt(spawnT);
    physicsRef.current = { x: spawnPoint.x, z: spawnPoint.z, heading: Math.atan2(spawnTangent.x, spawnTangent.z), speed: 0 };
    player.position.set(spawnPoint.x, 0.12, spawnPoint.z);
    player.rotation.y = physicsRef.current.heading;
    previousProgressRef.current = spawnT;

    vehiclesRef.current = [];
    const aiColors = ['#38bdf8', '#22c55e', '#f59e0b'];
    aiColors.forEach((color, index) => {
      const mesh = makeVehicleModel(color, '#0f172a', index === 1 ? 'drift' : 'sport');
      scene.add(mesh);
      const progress = 0.025 + index * 0.022;
      const p = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress);
      mesh.position.set(p.x, 0.12, p.z);
      mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
      vehiclesRef.current.push({ group: mesh, progress, speed: 19.5 - index * 1.1, finished: false });
    });

    const remoteVehicles = new Map<string, THREE.Group>();
    const remoteTargets = new Map<string, { position: THREE.Vector3; heading: number }>();
    const unsubscribeNetwork = isMultiplayerRoom ? lanMultiplayer.subscribe((message) => {
      if (message.type === 'player_state') {
        const playerId = String(message.playerId ?? '');
        if (!playerId || playerId === lanMultiplayer.playerId) return;
        const x = Number(message.x);
        const z = Number(message.z);
        const heading = Number(message.heading);
        if (![x, z, heading].every(Number.isFinite)) return;
        let remote = remoteVehicles.get(playerId);
        if (!remote) {
          remote = makeVehicleModel(String(message.color ?? '#38bdf8'), '#0f172a', 'sport');
          remote.position.set(x, 0.12, z);
          scene.add(remote);
          remoteVehicles.set(playerId, remote);
        }
        let target = remoteTargets.get(playerId);
        if (!target) {
          target = { position: new THREE.Vector3(x, 0.12, z), heading };
          remoteTargets.set(playerId, target);
        }
        target.position.set(x, 0.12, z);
        target.heading = heading;
      } else if (message.type === 'player_left') {
        const playerId = String(message.playerId ?? '');
        const remote = remoteVehicles.get(playerId);
        if (remote) {
          scene.remove(remote);
          remoteVehicles.delete(playerId);
          remoteTargets.delete(playerId);
        }
      }
    }) : () => undefined;

    coinMeshesRef.current = [];
    for (const t of [0.16, 0.38, 0.62, 0.82]) {
      const p = curve.getPointAt(t);
      const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.17, 8, 22),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x8a5100, emissiveIntensity: 0.75, metalness: 0.78, roughness: 0.24 })
      );
      coin.position.set(p.x, 1.25, p.z);
      coin.castShadow = true;
      scene.add(coin);
      coinMeshesRef.current.push({ mesh: coin, collected: false });
    }

    const physics = physicsRef.current;
    const effectiveMaxSpeed = baseRef.maxSpeed * (1 + Math.max(0, (upgrades.find((u) => u.id === 'engine')?.level ?? 1) - 1) * 0.055);
    const acceleration = baseRef.acceleration;
    const steering = baseRef.handling;
    let animationId = 0;
    let previousTime = 0;
    let hudAccumulator = 0;
    let lastEngineUpdate = 0;
    let lastNetworkUpdate = 0;
    let smoothedSteering = 0;
    const cameraTarget = new THREE.Vector3();
    const cameraFollowBlend = (delta: number) => 1 - Math.exp(-delta * 7.5);

    const finishRace = (won: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setRaceWon(won);
      gameStateRef.current = 'finished';
      runRef.current.gameState = 'finished';
      setGameState('finished');
      if (won) soundManager.playVictory();
    };

    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);
      const dt = previousTime === 0 ? 0.016 : Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;
      const state = gameStateRef.current;

      if (state === 'racing' && !isReplayMode) {
        const input = inputRef.current;
        const maxSpeed = effectiveMaxSpeed * (nitroActiveRef.current ? levelBenefits.nitroMultiplier : 1);
        if (input.accelerate) physics.speed = Math.min(maxSpeed, physics.speed + acceleration * dt);
        else if (input.brake) physics.speed = Math.max(-maxSpeed * 0.34, physics.speed - acceleration * dt * 1.6);
        else physics.speed *= Math.exp(-0.52 * dt);

        const steeringTarget = Number(input.left) - Number(input.right);
        smoothedSteering += (steeringTarget - smoothedSteering) * (1 - Math.exp(-dt * 11));
        const speedFactor = THREE.MathUtils.clamp(Math.abs(physics.speed) / Math.max(1, maxSpeed), 0, 1);
        const turnRate = steering * 0.5 * (0.25 + speedFactor * 0.75);
        if (Math.abs(physics.speed) > 0.2) physics.heading += smoothedSteering * turnRate * dt * Math.sign(physics.speed);
        const wheelTarget = smoothedSteering * 0.42;
        cockpitRig.steeringWheel.rotation.z += (wheelTarget - cockpitRig.steeringWheel.rotation.z) * (1 - Math.exp(-dt * 14));

        physics.x += Math.sin(physics.heading) * physics.speed * dt;
        physics.z += Math.cos(physics.heading) * physics.speed * dt;
        const progress = closestProgress(trackSamples, physics.x, physics.z);
        const offRoad = progress.distance > layout.width * 0.51;
        if (offRoad) {
          physics.speed *= Math.exp(-2.8 * dt);
          if (Math.abs(physics.speed) > 3) soundManager.playCrash();
        }
        if (previousProgressRef.current > 0.82 && progress.t < 0.18 && Math.abs(physics.speed) > 2.5 && !offRoad) {
          const nextLap = lapRef.current + 1;
          lapRef.current = nextLap;
          setLap(nextLap);
          if (nextLap > track.laps) finishRace(vehiclesRef.current.every((vehicle) => vehicle.progress < track.laps));
        }
        previousProgressRef.current = progress.t;

        if (playerRef.current) {
          playerRef.current.position.set(physics.x, 0.12, physics.z);
          playerRef.current.rotation.y = physics.heading;
        }

        if (isMultiplayerRoom && time - lastNetworkUpdate > 75) {
          lanMultiplayer.send({ type: 'player_state', x: physics.x, z: physics.z, heading: physics.heading, speed: physics.speed });
          lastNetworkUpdate = time;
        }

        for (const vehicle of vehiclesRef.current) {
          vehicle.progress += vehicle.speed * dt / trackLength;
          if (vehicle.progress >= track.laps) vehicle.finished = true;
          const t = vehicle.progress % 1;
          const p = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);
          vehicle.group.position.set(p.x, 0.12, p.z);
          vehicle.group.rotation.y = Math.atan2(tangent.x, tangent.z);
        }
        if (vehiclesRef.current.some((vehicle) => vehicle.finished) && lap <= track.laps) finishRace(false);

        for (const coin of coinMeshesRef.current) {
          coin.mesh.rotation.y += dt * 2;
          if (!coin.collected && Math.hypot(physics.x - coin.mesh.position.x, physics.z - coin.mesh.position.z) < 2.4) {
            coin.collected = true;
            coin.mesh.visible = false;
            setCoinsCollected((total) => total + 25);
            soundManager.playCoin();
          }
        }

        recordedFramesRef.current.push({ x: physics.x, y: physics.z, angle: physics.heading, speed: physics.speed });
        hudAccumulator += dt;
        if (hudAccumulator > 0.12) {
          hudAccumulator = 0;
          setCurrentSpeed(Math.round(Math.abs(physics.speed) * 3.6));
          setTrackProgress(progress.t);
          if (nitroActiveRef.current) setEngineTemp((temp) => Math.min(115, temp + 1.1));
          else if (Math.abs(physics.speed) > 24) setEngineTemp((temp) => Math.min(96, temp + 0.24));
          else setEngineTemp((temp) => Math.max(45, temp - 0.34));
          setNitroCharge((charge) => Math.min(levelBenefits.nitroCapacity, charge + 0.12));
          if (track.isDriftMode && (input.left || input.right) && Math.abs(physics.speed) > 12) setDriftScore((score) => score + 5);
        }
        if (time - lastEngineUpdate > 170) {
          if (Math.abs(physics.speed) > 6) soundManager.playEngine(Math.min(1, Math.abs(physics.speed) / effectiveMaxSpeed));
          else soundManager.stopEngine();
          lastEngineUpdate = time;
        }
      } else if (isReplayMode && replayFrames.length > 0) {
        const frameCount = replayFrames.length;
        const cursor = replayIndexRef.current % frameCount;
        const frame = replayFrames[Math.floor(cursor)];
        const nextFrame = replayFrames[(Math.floor(cursor) + 1) % frameCount];
        if (frame && nextFrame && playerRef.current) {
          const blend = cursor - Math.floor(cursor);
          playerRef.current.position.set(THREE.MathUtils.lerp(frame.x, nextFrame.x, blend), 0.12, THREE.MathUtils.lerp(frame.y, nextFrame.y, blend));
          const angleDelta = Math.atan2(Math.sin(nextFrame.angle - frame.angle), Math.cos(nextFrame.angle - frame.angle));
          playerRef.current.rotation.y = frame.angle + angleDelta * blend;
          setCurrentSpeed(Math.round(Math.abs(THREE.MathUtils.lerp(frame.speed, nextFrame.speed, blend)) * 3.6));
        }
        replayIndexRef.current += dt * 60;
      }

      for (const [playerId, remote] of remoteVehicles) {
        const target = remoteTargets.get(playerId);
        if (!target) continue;
        const blend = 1 - Math.exp(-dt * 12);
        remote.position.lerp(target.position, blend);
        const angleDelta = Math.atan2(Math.sin(target.heading - remote.rotation.y), Math.cos(target.heading - remote.rotation.y));
        remote.rotation.y += angleDelta * blend;
      }

      if (playerRef.current && cameraRef.current && state !== 'paused') {
        const p = playerRef.current.position;
        cockpitRig.group.visible = cameraModeRef.current === 'cockpit';
        const cameraBlend = cameraFollowBlend(dt);
        if (cameraModeRef.current === 'chase') {
          cameraTarget.set(p.x - Math.sin(physics.heading) * 9.5, 3.7, p.z - Math.cos(physics.heading) * 9.5);
          camera.position.lerp(cameraTarget, cameraBlend);
          camera.lookAt(p.x + Math.sin(physics.heading) * 7, 1.1, p.z + Math.cos(physics.heading) * 7);
        } else if (cameraModeRef.current === 'hood') {
          cameraTarget.set(p.x + Math.sin(physics.heading) * 1.5, 2.3, p.z + Math.cos(physics.heading) * 1.5);
          camera.position.lerp(cameraTarget, cameraBlend);
          camera.lookAt(p.x + Math.sin(physics.heading) * 22, 1.5, p.z + Math.cos(physics.heading) * 22);
        } else if (cameraModeRef.current === 'cockpit') {
          camera.position.lerp(new THREE.Vector3(p.x - Math.sin(physics.heading) * 0.35 - Math.cos(physics.heading) * 0.38, 1.42, p.z - Math.cos(physics.heading) * 0.35 + Math.sin(physics.heading) * 0.38), 0.42);
          camera.rotation.set(0, Math.PI + physics.heading, 0);
        } else {
          cameraTarget.set(p.x, 38, p.z - 18);
          camera.position.lerp(cameraTarget, cameraBlend * 0.8);
          camera.lookAt(p.x, 0, p.z);
        }
      }
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);
    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      unsubscribeNetwork();
      soundManager.stopEngine();
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((object) => { if (object.userData.remocarVehicleWrapper) object.userData.remocarDestroyed = true; });
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (!object.userData.remocarSharedGeometry) object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (!material.userData.remocarSharedTextures) Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
            material.dispose();
          });
        }
      });
      container.replaceChildren();
      sceneRef.current = null;
      rendererRef.current = null;
      playerRef.current = null;
      vehiclesRef.current = [];
    };
  }, [track.id, car.id, isMultiplayerRoom]);

  useEffect(() => {
    gameStateRef.current = gameState;
    runRef.current.gameState = gameState;
  }, [gameState]);

  const pauseRace = () => {
    if (gameState !== 'racing') return;
    gameStateRef.current = 'paused';
    runRef.current.pausedFrom = 'racing';
    setGameState('paused');
  };

  const resumeRace = () => {
    gameStateRef.current = 'racing';
    setGameState('racing');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn text-right relative">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl z-10 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold"><Flag className="w-5 h-5 text-red-500" /><span>اللفة: {Math.min(lap, track.laps)} / {track.laps}</span></div>
          <div className="flex items-center gap-2 text-white font-bold"><Coins className="w-5 h-5 text-amber-400" /><span>العملات: {coinsCollected}</span></div>
          {track.isDriftMode && <div className="flex items-center gap-2 text-amber-400 font-bold"><Flame className="w-4 h-4" /><span>الدريفت: {driftScore}</span></div>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={cycleCamera} aria-label="تغيير زاوية الكاميرا" className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold"><Camera className="w-4 h-4" /><span>{cameraMode === 'chase' ? 'خلف السيارة' : cameraMode === 'hood' ? 'من المقدمة' : cameraMode === 'cockpit' ? 'قمرة القيادة' : 'علوية'}</span></button>
          {!isReplayMode && <button onClick={activateNitro} className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold"><Zap className="w-4 h-4" />نيترو {Math.round(nitroCharge)}%</button>}
          {!isReplayMode && gameState === 'racing' && <button onClick={pauseRace} aria-label="إيقاف مؤقت" className="p-2 rounded-xl bg-slate-800 text-white"><Pause className="w-4 h-4" /></button>}
          <button onClick={onQuit} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">{isReplayMode ? 'إغلاق الإعادة' : 'انسحاب'}</button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div ref={mountRef} className="w-full h-[min(68vh,680px)] min-h-[360px] touch-none" aria-label={`سباق ثلاثي الأبعاد - ${track.name}`} />
        <div className="absolute top-4 left-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 p-2.5 shadow-xl backdrop-blur" aria-label="خريطة مصغرة للمضمار">
          <svg viewBox="0 0 100 70" className="h-16 w-24 md:h-20 md:w-28" role="img" aria-label={`خريطة ${track.name}`}>
            <polyline points={minimapPoints.join(' ')} fill="none" stroke="#64748b" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={minimapPoints.join(' ')} fill="none" stroke={track.id.includes('neon') ? '#22d3ee' : '#fbbf24'} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={minimapMarker[0]} cy={minimapMarker[1]} r="4.3" fill="#ef4444" stroke="white" strokeWidth="1.2" />
          </svg>
          <div className="text-center text-[9px] text-slate-400">{track.name}</div>
        </div>
        <div className="absolute right-4 top-4 z-10 flex max-w-[58%] items-center gap-2 rounded-xl border border-amber-300/20 bg-slate-950/85 p-2 shadow-xl backdrop-blur sm:max-w-[360px]">
          <img src={coach.portrait} alt="" className="h-10 w-9 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 text-right"><div className="text-[10px] font-black text-amber-200">{coach.name} · نصيحة</div><div className="line-clamp-2 text-[9px] leading-4 text-slate-200">{coach.hint}</div></div>
        </div>
        <div className="absolute bottom-4 left-4 bg-slate-950/85 border border-slate-700 p-3 rounded-2xl text-white z-10 flex items-center gap-3">
          <div className="text-xl font-black text-red-400">{currentSpeed}<span className="text-[9px] text-slate-400 block">KM/H</span></div>
          <div className="text-xs text-slate-300"><Thermometer className="w-4 h-4 inline text-amber-400" /> {Math.round(engineTemp)}°C</div>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600" style={{ width: `${Math.min(100, currentSpeed / 2.4)}%` }} /></div>
        </div>

        {!isReplayMode && gameState === 'racing' && (
          <div className="absolute bottom-4 right-4 flex items-end gap-3 z-20 md:hidden select-none">
            <div className="flex gap-2">
              {([['left', '◀'], ['right', '▶']] as const).map(([key, label]) => (
                <button key={key} aria-label={key === 'left' ? 'انعطف يساراً' : 'انعطف يميناً'} onContextMenu={(e) => e.preventDefault()} onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setInput(key, true); }} onPointerUp={() => setInput(key, false)} onPointerCancel={() => setInput(key, false)} onLostPointerCapture={() => setInput(key, false)} className="w-14 h-16 rounded-2xl bg-slate-900/90 border border-slate-500 text-white text-2xl active:bg-slate-700 touch-none">{label}</button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <button aria-label="تسارع" onContextMenu={(e) => e.preventDefault()} onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setInput('accelerate', true); }} onPointerUp={() => setInput('accelerate', false)} onPointerCancel={() => setInput('accelerate', false)} onLostPointerCapture={() => setInput('accelerate', false)} className="w-20 h-14 rounded-2xl bg-red-600/90 border border-red-300 text-white font-black active:bg-red-500 touch-none">تسارع</button>
              <button aria-label="فرامل" onContextMenu={(e) => e.preventDefault()} onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setInput('brake', true); }} onPointerUp={() => setInput('brake', false)} onPointerCancel={() => setInput('brake', false)} onLostPointerCapture={() => setInput('brake', false)} className="w-20 h-12 rounded-2xl bg-slate-700/90 border border-slate-400 text-white font-bold active:bg-slate-600 touch-none">فرامل</button>
              <button aria-label="نيترو" onPointerDown={(e) => { e.preventDefault(); activateNitro(); }} className="w-20 h-11 rounded-2xl bg-amber-500/90 border border-amber-200 text-slate-950 font-black touch-none"><Zap className="inline w-4 h-4" /> نيترو</button>
            </div>
          </div>
        )}

        {gameState === 'countdown' && !isReplayMode && <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none"><span className="text-8xl font-black text-red-500 animate-pulse">{countdownNum > 0 ? countdownNum : 'انطلق!'}</span><p className="text-white font-bold mt-2">{track.name}</p></div>}

        {gameState === 'paused' && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30"><h2 className="text-3xl font-black text-white mb-5">توقف مؤقت</h2><div className="flex gap-3"><button onClick={resumeRace} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold"><Play className="inline w-4 h-4" /> متابعة</button><button onClick={onQuit} className="bg-slate-700 text-white px-6 py-3 rounded-xl">إنهاء السباق</button></div></div>}

        {gameState === 'finished' && (isMultiplayerRoom ? (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-5 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3"><Trophy className="w-8 h-8" /></div>
            {!multiplayerResult ? <>
              <h2 className="text-2xl font-black text-white mb-1">انتهت الجولة {multiplayerRound} من {multiplayerRoundsTotal}</h2>
              <p className="text-slate-300 mb-3">{track.name} · توقيتك {raceTime.toFixed(1)} ثانية</p>
              {multiplayerDidSubmit ? <p className="text-amber-200 font-bold mb-4" aria-live="polite">تم إرسال توقيتك · بانتظار بقية اللاعبين ({multiplayerFinishedCount}/{multiplayerPlayerCount})</p> : <button onClick={() => onFinishMultiplayerRound?.(raceTime)} className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold px-6 py-3 rounded-xl"><span>إرسال نتيجة الجولة</span><ArrowRight className="w-5 h-5" /></button>}
            </> : <>
              <h2 className="text-2xl font-black text-white mb-1">{multiplayerResult.type === 'match_complete' ? 'انتهت البطولة!' : `نتائج الجولة ${multiplayerResult.round}`}</h2>
              {multiplayerResult.type === 'round_complete' && <p className="text-slate-300 mb-3">{multiplayerResult.finishOrder.find((result) => result.playerId === lanMultiplayer.playerId)?.place ? `مركزك في الجولة: ${multiplayerResult.finishOrder.find((result) => result.playerId === lanMultiplayer.playerId)?.place}` : 'تم اعتماد ترتيب الجولة.'}</p>}
              {multiplayerResult.type === 'match_complete' && <p className="text-amber-200 font-bold mb-3">{multiplayerResult.winner ? `بطل البطولة: ${multiplayerResult.winner.name}` : 'اكتملت البطولة'}</p>}
              <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/80 p-3 mb-4 text-right">
                <h3 className="text-xs font-bold text-slate-300 mb-2">الترتيب الإجمالي · النقاط</h3>
                <ol className="space-y-1.5">
                  {multiplayerResult.scores.map((standing, index) => <li key={standing.playerId} className={`flex items-center justify-between gap-3 text-sm ${standing.playerId === lanMultiplayer.playerId ? 'text-amber-200 font-bold' : 'text-slate-200'}`}><span className="truncate">{index + 1}. {standing.name}</span><span className="shrink-0">{standing.points} نقطة</span></li>)}
                </ol>
              </div>
              {multiplayerResult.type === 'round_complete' ? (multiplayerIsHost
                ? <button onClick={onStartNextMultiplayerRound} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-3 rounded-xl">بدء الجولة التالية ({multiplayerResult.round + 1}/{multiplayerResult.roundsTotal})</button>
                : <p className="text-slate-300 text-sm" aria-live="polite">بانتظار المضيف لبدء الجولة التالية…</p>)
                : <button onClick={onExitMultiplayer} className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold px-6 py-3 rounded-xl">العودة إلى القائمة الرئيسية</button>}
            </>}
          </div>
        ) : <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${raceWon ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-200'}`}><Trophy className="w-9 h-9" /></div><h2 className="text-3xl font-black text-white mb-2">{raceWon ? 'فوز مستحق!' : 'انتهى السباق'}</h2><p className="text-slate-300 mb-2">{track.name} · {raceTime.toFixed(1)} ثانية</p><p className="text-amber-300 font-bold mb-5">{raceWon ? `+${coinsCollected + 150} عملة` : `+${coinsCollected + 35} عملة مشاركة`}</p><button onClick={() => onFinishRace(raceWon, coinsCollected + (raceWon ? 150 : 35), recordedFramesRef.current, raceTime)} className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold px-7 py-3 rounded-xl"><span>حفظ النتيجة</span><ArrowRight className="w-5 h-5" /></button></div>)}
      </div>
      {leaderboardEntry && <p className="mt-3 text-xs text-slate-400">أفضل توقيت مسجل: {leaderboardEntry.bestTime.toFixed(1)} ث</p>}
    </div>
  );
};
