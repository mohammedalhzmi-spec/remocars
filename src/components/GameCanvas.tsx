import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Car, Track, ReplayFrame, LeaderboardEntry, PlayerProfile } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, Thermometer, Camera, Flame, ShieldAlert, Settings, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GameCanvasProps {
  car: Car;
  track: Track;
  profile: PlayerProfile;
  leaderboardEntry?: LeaderboardEntry;
  isReplayMode?: boolean;
  replayFrames?: ReplayFrame[];
  onFinishRace: (won: boolean, coinsEarned: number, frames: ReplayFrame[], lapTime: number) => void;
  onQuit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  car,
  track,
  profile,
  leaderboardEntry,
  isReplayMode = false,
  replayFrames = [],
  onFinishRace,
  onQuit,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<'countdown' | 'racing' | 'finished'>(isReplayMode ? 'racing' : 'countdown');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [lap, setLap] = useState<number>(1);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [raceTime, setRaceTime] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [engineTemp, setEngineTemp] = useState<number>(45);
  const [nitroActive, setNitroActive] = useState<boolean>(false);
  const [nitroCharge, setNitroCharge] = useState<number>(100);
  const [collisionCount, setCollisionCount] = useState<number>(0);

  // Camera & HUD settings
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood' | 'cockpit' | 'side' | 'topdown'>('chase');
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [steeringStyle, setSteeringStyle] = useState<'wheel' | 'buttons' | 'slanted'>('wheel');
  const [controlSide, setControlSide] = useState<'left' | 'right'>('right');
  const [wheelSize, setWheelSize] = useState<number>(120);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [comboPopup, setComboPopup] = useState<string | null>(null);
  const [touchSteerAngle, setTouchSteerAngle] = useState<number>(0); // -1 to 1 for wheel rotation
  const [throttlePressure, setThrottlePressure] = useState<number>(0); // 0 to 1
  const [brakePressure, setBrakePressure] = useState<number>(0); // 0 to 1

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carMeshRef = useRef<THREE.Group | null>(null);
  const ghostMeshRef = useRef<THREE.Group | null>(null);
  const aiMeshsRef = useRef<THREE.Group[]>([]);

  const recordedFramesRef = useRef<ReplayFrame[]>([]);
  const ghostIndexRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastNearMissTimeRef = useRef<number>(0);

  const carPhysics = useRef({
    x: 0,
    z: 0,
    angle: 0,
    speed: 0,
    maxSpeed: 1.4 + (car.speed / 40),
    acceleration: 0.04 + (car.acceleration / 850),
    handling: 0.045 + (car.handling / 1300),
  });

  const aiCarsData = useRef([
    { x: 35, z: 35, angle: 0, speed: 1.05 },
    { x: -45, z: 55, angle: Math.PI / 2, speed: 0.98 },
    { x: 65, z: -35, angle: Math.PI, speed: 1.08 },
    { x: -55, z: -55, angle: -Math.PI / 2, speed: 0.92 },
  ]);

  // Load preferences
  useEffect(() => {
    const savedStyle = localStorage.getItem('remocar_steering_style');
    if (savedStyle) setSteeringStyle(savedStyle as any);
    const savedSide = localStorage.getItem('remocar_control_side');
    if (savedSide) setControlSide(savedSide as any);
    const savedSize = localStorage.getItem('remocar_wheel_size');
    if (savedSize) setWheelSize(parseInt(savedSize, 10));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameState === 'countdown' && !isReplayMode) {
      if (countdownNum > 0) {
        soundManager.playStartBeep(false);
        const timer = setTimeout(() => setCountdownNum(countdownNum - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        soundManager.playStartBeep(true);
        setGameState('racing');
      }
    }
  }, [gameState, countdownNum, isReplayMode]);

  // Race timer
  useEffect(() => {
    if (gameState !== 'racing') return;
    const interval = setInterval(() => {
      setRaceTime((t) => t + 0.1);
      setNitroCharge((prev) => Math.min(100, prev + 0.8));
      setEngineTemp((temp) => {
        if (nitroActive) return Math.min(115, temp + 1.2);
        if (currentSpeed > 90) return Math.min(95, temp + 0.3);
        return Math.max(45, temp - 0.5);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, nitroActive, currentSpeed]);

  // Keyboard listeners
  useEffect(() => {
    if (isReplayMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (nitroCharge > 20 && engineTemp < 105) {
          setNitroActive(true);
          soundManager.playNitro();
          setTimeout(() => setNitroActive(false), 1800);
          setNitroCharge((c) => Math.max(0, c - 35));
        }
      }
      if (e.code === 'KeyC') {
        setCameraMode((m) => 
          m === 'chase' ? 'hood' : m === 'hood' ? 'cockpit' : m === 'cockpit' ? 'side' : m === 'side' ? 'topdown' : 'chase'
        );
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nitroCharge, engineTemp, isReplayMode]);

  // Three.js Setup & Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060f);
    scene.fog = new THREE.FogExp2(0x04060f, 0.01);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 2.0);
    dirLight.position.set(70, 140, 70);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Track Environment
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    const groundGeo = new THREE.PlaneGeometry(1400, 1400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x090e1f, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    trackGroup.add(ground);

    const roadGeo = new THREE.RingGeometry(48, 105, 64);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x162035, roughness: 0.45, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.1;
    road.receiveShadow = true;
    trackGroup.add(road);

    const barrierGeo = new THREE.TorusGeometry(108, 1.9, 16, 100);
    const barrierMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.rotation.x = Math.PI / 2;
    barrier.position.y = 1;
    trackGroup.add(barrier);

    // Player Car 3D Mesh
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carMeshRef.current = carGroup;

    const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 4.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: car.color, metalness: 0.9, roughness: 0.1 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: car.secondaryColor, metalness: 0.95, roughness: 0.05 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.2, -0.2);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // AI Traffic Cars
    aiMeshsRef.current = [];
    aiCarsData.current.forEach((ai) => {
      const aiGroup = new THREE.Group();
      const aiBodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2 });
      const aiBody = new THREE.Mesh(bodyGeo, aiBodyMat);
      aiBody.position.y = 0.6;
      aiBody.castShadow = true;
      aiGroup.add(aiBody);
      scene.add(aiGroup);
      aiMeshsRef.current.push(aiGroup);
    });

    // Ghost Car Mesh
    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    ghostMeshRef.current = ghostGroup;
    const ghostBodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.2 });
    const ghostMesh = new THREE.Mesh(bodyGeo, ghostBodyMat);
    ghostMesh.position.y = 0.6;
    ghostGroup.add(ghostMesh);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (gameState === 'racing' && !isReplayMode) {
        const physics = carPhysics.current;
        const keys = keysRef.current;
        const throttleInput = keys['KeyW'] || keys['ArrowUp'] ? 1 : throttlePressure;
        const brakeInput = keys['KeyS'] || keys['ArrowDown'] ? 1 : brakePressure;

        const maxSpd = nitroActive ? physics.maxSpeed * 2.0 : (brakeInput > 0 ? physics.maxSpeed * 0.3 : physics.maxSpeed);
        const accelerationRate = brakeInput > 0 ? physics.acceleration * 2.2 : physics.acceleration * throttleInput;

        if (throttleInput > 0) {
          physics.speed = Math.min(maxSpd, physics.speed + accelerationRate);
        } else if (brakeInput > 0) {
          physics.speed = Math.max(-maxSpd / 2, physics.speed - physics.acceleration * 1.8);
        } else {
          physics.speed *= 0.982;
        }

        const steerInput = keys['KeyA'] || keys['ArrowLeft'] ? -1 : keys['KeyD'] || keys['ArrowRight'] ? 1 : touchSteerAngle;
        if (steerInput !== 0 && Math.abs(physics.speed) > 0.05) {
          physics.angle += physics.handling * steerInput * (physics.speed > 0 ? 1 : -1);
        }

        physics.x += Math.sin(physics.angle) * physics.speed;
        physics.z += Math.cos(physics.angle) * physics.speed;

        const currentSpdVal = Math.round(Math.abs(physics.speed) * 135);
        setCurrentSpeed(currentSpdVal);

        // 5-Crash threshold
        const distFromCenter = Math.hypot(physics.x, physics.z);
        if (distFromCenter < 48 || distFromCenter > 103) {
          physics.speed *= -0.4;
          soundManager.playCrash();
          setCollisionCount((c) => {
            const nextCount = c + 1;
            if (nextCount >= 5) {
              setNitroCharge((nc) => Math.max(0, nc - 25));
            }
            return nextCount;
          });
        }

        if (carMeshRef.current) {
          carMeshRef.current.position.set(physics.x, 0, physics.z);
          carMeshRef.current.rotation.y = physics.angle;
        }

        aiCarsData.current.forEach((ai, idx) => {
          ai.x += Math.sin(ai.angle) * ai.speed;
          ai.z += Math.cos(ai.angle) * ai.speed;
          ai.angle += 0.01;

          const mesh = aiMeshsRef.current[idx];
          if (mesh) {
            mesh.position.set(ai.x, 0, ai.z);
            mesh.rotation.y = ai.angle;
          }

          const distanceToPlayer = Math.hypot(physics.x - ai.x, physics.z - ai.z);
          if (distanceToPlayer < 7.5 && distanceToPlayer > 2 && Math.abs(physics.speed) > 0.6) {
            const now = Date.now();
            if (now - lastNearMissTimeRef.current > 1200) {
              lastNearMissTimeRef.current = now;
              setComboPopup(`محاذاة قريبة (NEAR MISS)! (+25 NITRO)`);
              setTimeout(() => setComboPopup(null), 1500);
              setNitroCharge((nc) => Math.min(100, nc + 25));
              setCoinsCollected((cc) => cc + 20);
              soundManager.playCoin();
            }
          }
        });

        recordedFramesRef.current.push({
          x: physics.x,
          y: physics.z,
          angle: physics.angle,
          speed: physics.speed,
        });

        if (leaderboardEntry && leaderboardEntry.ghostFrames && leaderboardEntry.ghostFrames.length > 0) {
          const gf = leaderboardEntry.ghostFrames[ghostIndexRef.current];
          if (gf && ghostMeshRef.current) {
            ghostMeshRef.current.position.set(gf.x, 0, gf.y);
            ghostMeshRef.current.rotation.y = gf.angle;
          }
          ghostIndexRef.current = (ghostIndexRef.current + 1) % leaderboardEntry.ghostFrames.length;
        }

        if (cameraRef.current && carMeshRef.current) {
          const carPos = carMeshRef.current.position;
          const baseFov = 65;
          cameraRef.current.fov = baseFov + (Math.abs(physics.speed) * (nitroActive ? 20 : 6)) * cameraZoom;
          cameraRef.current.updateProjectionMatrix();

          if (cameraMode === 'chase') {
            cameraRef.current.position.set(
              carPos.x - Math.sin(physics.angle) * (15 * cameraZoom),
              carPos.y + (6.5 * cameraZoom),
              carPos.z - Math.cos(physics.angle) * (15 * cameraZoom)
            );
            cameraRef.current.lookAt(carPos.x, carPos.y + 1, carPos.z);
          } else if (cameraMode === 'hood') {
            cameraRef.current.position.set(carPos.x, carPos.y + 2.2, carPos.z);
            cameraRef.current.lookAt(
              carPos.x + Math.sin(physics.angle) * 30,
              carPos.y + 1.6,
              carPos.z + Math.cos(physics.angle) * 30
            );
          } else if (cameraMode === 'cockpit') {
            cameraRef.current.position.set(
              carPos.x + Math.sin(physics.angle) * 0.2,
              carPos.y + 1.35,
              carPos.z + Math.cos(physics.angle) * 0.2
            );
            cameraRef.current.lookAt(
              carPos.x + Math.sin(physics.angle) * 40,
              carPos.y + 1.2,
              carPos.z + Math.cos(physics.angle) * 40
            );
          } else if (cameraMode === 'side') {
            cameraRef.current.position.set(
              carPos.x + Math.cos(physics.angle) * 12,
              carPos.y + 4,
              carPos.z - Math.sin(physics.angle) * 12
            );
            cameraRef.current.lookAt(carPos.x, carPos.y, carPos.z);
          } else {
            cameraRef.current.position.set(carPos.x, carPos.y + (40 * cameraZoom), carPos.z - 25);
            cameraRef.current.lookAt(carPos.x, carPos.y, carPos.z);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [gameState, car, cameraMode, cameraZoom, leaderboardEntry, throttlePressure, brakePressure, touchSteerAngle, nitroActive]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 animate-fadeIn text-right relative select-none">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 p-4 rounded-2xl mb-3 shadow-2xl z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold">
            <Flag className="w-5 h-5 text-red-500" />
            <span>اللفة: {lap} / {track.laps}</span>
          </div>
          <div className="flex items-center gap-2 text-white font-bold">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>العملات: {coinsCollected}</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 font-bold bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-xl text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>الصدمات: {collisionCount} / 5</span>
          </div>
        </div>

        {comboPopup && (
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-gradient-to-r from-amber-500 to-red-600 text-white font-black px-6 py-2 rounded-2xl shadow-2xl animate-bounce text-sm tracking-wider uppercase border border-amber-300">
            {comboPopup}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCameraMode((m) => 
              m === 'chase' ? 'hood' : m === 'hood' ? 'cockpit' : m === 'cockpit' ? 'side' : m === 'side' ? 'topdown' : 'chase'
            )}
            className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>الكاميرا: {cameraMode === 'chase' ? 'مطاردة' : cameraMode === 'hood' ? 'مقدمة' : cameraMode === 'cockpit' ? 'قمرة' : cameraMode === 'side' ? 'جانبية' : 'علوية'}</span>
          </button>

          <div className="flex bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setCameraZoom((z) => Math.max(0.6, z - 0.1))}
              className="px-2.5 py-2 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border-l border-slate-700"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraZoom((z) => Math.min(1.8, z + 0.1))}
              className="px-2.5 py-2 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onQuit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            خروج
          </button>
        </div>
      </div>

      {/* WebGL 3D Canvas Arena */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <div ref={mountRef} className="w-full aspect-[16/10] block" />

        {/* Speedometer */}
        <div className="absolute bottom-6 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-4 text-white z-10 pointer-events-none">
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-red-500">{currentSpeed}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">KM/H</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">عداد السرعة (Pro 3D)</div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all"
                style={{ width: `${Math.min(100, (currentSpeed / 320) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Realistic Pro Steering Wheel & Arcade Pedals UI */}
        <div className={`absolute bottom-6 ${controlSide === 'right' ? 'right-6' : 'left-6'} flex items-end gap-6 z-20 md:hidden`}>
          {steeringStyle === 'wheel' ? (
            <div 
              className="bg-slate-900/90 backdrop-blur-md rounded-full border-4 border-slate-600/80 shadow-2xl flex items-center justify-center relative touch-none select-none"
              style={{ width: `${wheelSize}px`, height: `${wheelSize}px` }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const x = touch.clientX - centerX;
                const angle = Math.max(-1, Math.min(1, x / (rect.width / 2)));
                setTouchSteerAngle(angle);
              }}
              onTouchEnd={() => setTouchSteerAngle(0)}
            >
              <div 
                className="absolute inset-2 rounded-full border-4 border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner transition-transform"
                style={{ transform: `rotate(${touchSteerAngle * 45}deg)` }}
              >
                <div className="absolute top-2 w-3 h-8 bg-red-600 rounded-full shadow-lg" />
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-black text-xs">
                  PRO
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-3xl border border-slate-700/80 shadow-2xl">
              <button
                onTouchStart={() => setTouchSteerAngle(-1)}
                onTouchEnd={() => setTouchSteerAngle(0)}
                className="w-16 h-20 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold active:bg-slate-700"
              >◀</button>
              <button
                onTouchStart={() => setTouchSteerAngle(1)}
                onTouchEnd={() => setTouchSteerAngle(0)}
                className="w-16 h-20 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold active:bg-slate-700"
              >▶</button>
            </div>
          )}

          {/* Pro Pedals */}
          <div className="flex gap-3 bg-slate-900/85 backdrop-blur-md p-3 rounded-3xl border border-slate-700/80 shadow-2xl">
            <button
              onTouchStart={() => setBrakePressure(1)}
              onTouchEnd={() => setBrakePressure(0)}
              className="w-18 h-22 bg-gradient-to-t from-rose-950 via-rose-900 to-rose-700 border-2 border-rose-500 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl active:scale-95 transition-transform"
            >
              <span className="text-xl">🛑</span>
              <span className="mt-1 font-black">فرامل</span>
              <div className="w-10 h-1 bg-rose-500 rounded-full mt-2" />
            </button>

            <button
              onTouchStart={() => setThrottlePressure(1)}
              onTouchEnd={() => setThrottlePressure(0)}
              className="w-20 h-26 bg-gradient-to-t from-emerald-950 via-emerald-900 to-emerald-600 border-2 border-emerald-400 rounded-2xl flex flex-col items-center justify-center text-white text-sm font-black shadow-xl active:scale-95 transition-transform"
            >
              <span className="text-2xl">🚀</span>
              <span className="mt-1">بنزين</span>
              <div className="w-12 h-1.5 bg-emerald-400 rounded-full mt-2 animate-pulse" />
            </button>

            <button
              onClick={() => {
                if (nitroCharge > 20) {
                  setNitroActive(true);
                  soundManager.playNitro();
                  setTimeout(() => setNitroActive(false), 1800);
                  setNitroCharge((c) => Math.max(0, c - 35));
                }
              }}
              className="w-18 h-22 bg-gradient-to-t from-amber-950 via-amber-800 to-orange-600 border-2 border-amber-300 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl active:scale-95 transition-transform animate-pulse"
            >
              <span className="text-xl">⚡</span>
              <span className="mt-1 font-black">نيترو</span>
              <div className="w-10 h-1 bg-amber-400 rounded-full mt-2" />
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">إعدادات مقود القيادة والدواسات الاحترافية</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">نوع عجلة القيادة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setSteeringStyle('wheel'); localStorage.setItem('remocar_steering_style', 'wheel'); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${steeringStyle === 'wheel' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                  >
                    مقود دائري واقعي (Steering Wheel)
                  </button>
                  <button
                    onClick={() => { setSteeringStyle('buttons'); localStorage.setItem('remocar_steering_style', 'buttons'); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${steeringStyle === 'buttons' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                  >
                    أزرار يمين ويسار
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">جهة التحكم</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setControlSide('right'); localStorage.setItem('remocar_control_side', 'right'); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${controlSide === 'right' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                  >
                    الدواسات يمين والمقود يسار
                  </button>
                  <button
                    onClick={() => { setControlSide('left'); localStorage.setItem('remocar_control_side', 'left'); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border ${controlSide === 'left' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                  >
                    الدواسات يسار والمقود يمين
                  </button>
                </div>
              </div>

              {steeringStyle === 'wheel' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">حجم المقود: {wheelSize}px</label>
                  <input
                    type="range"
                    min={100}
                    max={180}
                    value={wheelSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setWheelSize(val);
                      localStorage.setItem('remocar_wheel_size', val.toString());
                    }}
                    className="w-full accent-red-500"
                  />
                </div>
              )}

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors mt-4"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        )}

        {gameState === 'countdown' && !isReplayMode && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn z-30">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">مقود واقعي ودواسات احترافية (Pro Racing HUD)...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center z-30">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">أهلاً بك على منصة التتويج!</h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت: <span className="text-white font-bold">{raceTime.toFixed(1)} ث</span> | العملات: <span className="text-amber-400 font-bold">+500</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, 500, recordedFramesRef.current, raceTime)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-base"
              >
                <span>حفظ النتيجة وتحديث لوحة المتصدرين</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
