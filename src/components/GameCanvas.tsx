import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car, Track, ReplayFrame, LeaderboardEntry, PlayerProfile } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, Thermometer, Compass, Camera, Flame, RotateCcw } from 'lucide-react';

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

  const [driftScore, setDriftScore] = useState<number>(0);
  const [driftMultiplier, setDriftMultiplier] = useState<number>(1);
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood' | 'topdown'>('chase');

  // Touch control states for Android mobile
  const [touchSteer, setTouchSteer] = useState<-1 | 0 | 1>(0);
  const [touchThrottle, setTouchThrottle] = useState<number>(0); // 1 for forward, -1 for reverse

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carMeshRef = useRef<THREE.Group | null>(null);
  const ghostMeshRef = useRef<THREE.Group | null>(null);

  const recordedFramesRef = useRef<ReplayFrame[]>([]);
  const replayIndexRef = useRef<number>(0);
  const ghostIndexRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const carPhysics = useRef({
    x: 0,
    z: 0,
    angle: 0,
    speed: 0,
    maxSpeed: 1.2 + (car.speed / 50),
    acceleration: 0.03 + (car.acceleration / 1000),
    handling: 0.035 + (car.handling / 1500),
  });

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
      setNitroCharge((prev) => Math.min(100, prev + 0.6));
      setEngineTemp((temp) => {
        if (nitroActive) return Math.min(115, temp + 1.2);
        if (currentSpeed > 80) return Math.min(95, temp + 0.3);
        return Math.max(45, temp - 0.5);
      });
      if (track.isDriftMode && Math.abs(carPhysics.current.speed) > 0.8) {
        setDriftScore((s) => s + Math.round(15 * driftMultiplier));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, nitroActive, currentSpeed, track.isDriftMode, driftMultiplier]);

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
          setTimeout(() => setNitroActive(false), 1600);
          setNitroCharge((c) => Math.max(0, c - 40));
        }
      }
      if (e.code === 'KeyC') {
        setCameraMode((m) => (m === 'chase' ? 'hood' : m === 'hood' ? 'topdown' : 'chase'));
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

  // Three.js Setup & Main Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Track 3D Environment Geometry
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    trackGroup.add(ground);

    // 3D Road Ring
    const roadShape = new THREE.Shape();
    const roadGeo = new THREE.RingGeometry(40, 90, 64);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.1;
    road.receiveShadow = true;
    trackGroup.add(road);

    // Neon Track Barriers
    const barrierGeo = new THREE.TorusGeometry(92, 1.5, 16, 100);
    const barrierMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.rotation.x = Math.PI / 2;
    barrier.position.y = 1;
    trackGroup.add(barrier);

    // Create 3D Car Mesh
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carMeshRef.current = carGroup;

    // Car Body
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 4.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: car.color, metalness: 0.8, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    // Car Roof / Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: car.secondaryColor, metalness: 0.9, roughness: 0.1 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.2, -0.2);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    const wheelPositions = [
      [-1.2, 0.45, 1.6],
      [1.2, 0.45, 1.6],
      [-1.2, 0.45, -1.6],
      [1.2, 0.45, -1.6],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    // Ghost Car 3D Mesh
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
        const maxSpd = nitroActive ? physics.maxSpeed * 1.8 : physics.maxSpeed;

        if (keys['KeyW'] || keys['ArrowUp'] || touchThrottle > 0) {
          physics.speed = Math.min(maxSpd, physics.speed + physics.acceleration);
        } else if (keys['KeyS'] || keys['ArrowDown'] || touchThrottle < 0) {
          physics.speed = Math.max(-maxSpd / 2, physics.speed - physics.acceleration);
        } else {
          physics.speed *= 0.98;
        }

        if (keys['KeyA'] || keys['ArrowLeft'] || touchSteer < 0) {
          if (Math.abs(physics.speed) > 0.05) {
            physics.angle += physics.handling * (physics.speed > 0 ? 1 : -1);
          }
        }
        if (keys['KeyD'] || keys['ArrowRight'] || touchSteer > 0) {
          if (Math.abs(physics.speed) > 0.05) {
            physics.angle -= physics.handling * (physics.speed > 0 ? 1 : -1);
          }
        }

        physics.x += Math.sin(physics.angle) * physics.speed;
        physics.z += Math.cos(physics.angle) * physics.speed;

        setCurrentSpeed(Math.round(Math.abs(physics.speed) * 120));

        // Circular track constraint check for lap completion
        const distFromCenter = Math.hypot(physics.x, physics.z);
        if (distFromCenter < 40 || distFromCenter > 90) {
          physics.speed *= -0.5;
          soundManager.playCrash();
        }

        if (carMeshRef.current) {
          carMeshRef.current.position.set(physics.x, 0, physics.z);
          carMeshRef.current.rotation.y = physics.angle;
        }

        recordedFramesRef.current.push({
          x: physics.x,
          y: physics.z,
          angle: physics.angle,
          speed: physics.speed,
        });

        // Ghost car animation
        if (leaderboardEntry && leaderboardEntry.ghostFrames && leaderboardEntry.ghostFrames.length > 0) {
          const gf = leaderboardEntry.ghostFrames[ghostIndexRef.current];
          if (gf && ghostMeshRef.current) {
            ghostMeshRef.current.position.set(gf.x, 0, gf.y);
            ghostMeshRef.current.rotation.y = gf.angle;
          }
          ghostIndexRef.current = (ghostIndexRef.current + 1) % leaderboardEntry.ghostFrames.length;
        }

        // Camera follow
        if (cameraRef.current && carMeshRef.current) {
          const carPos = carMeshRef.current.position;
          if (cameraMode === 'chase') {
            cameraRef.current.position.set(
              carPos.x - Math.sin(physics.angle) * 14,
              carPos.y + 6,
              carPos.z - Math.cos(physics.angle) * 14
            );
            cameraRef.current.lookAt(carPos.x, carPos.y + 1, carPos.z);
          } else if (cameraMode === 'hood') {
            cameraRef.current.position.set(carPos.x, carPos.y + 2, carPos.z);
            cameraRef.current.lookAt(
              carPos.x + Math.sin(physics.angle) * 20,
              carPos.y + 1.5,
              carPos.z + Math.cos(physics.angle) * 20
            );
          } else {
            cameraRef.current.position.set(carPos.x, carPos.y + 35, carPos.z - 25);
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
  }, [gameState, car, cameraMode, leaderboardEntry]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn text-right relative">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold">
            <Flag className="w-5 h-5 text-red-500" />
            <span>اللفة: {lap} / {track.laps}</span>
          </div>
          <div className="flex items-center gap-2 text-white font-bold">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>العملات: {coinsCollected}</span>
          </div>
          {track.isDriftMode && (
            <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>نقاط الدريفت: {driftScore}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCameraMode((m) => (m === 'chase' ? 'hood' : m === 'hood' ? 'topdown' : 'chase'))}
            className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>الكاميرا: {cameraMode === 'chase' ? 'خلف السيارة' : cameraMode === 'hood' ? 'من المقدمة' : 'علوية'}</span>
          </button>

          {!isReplayMode && (
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${nitroCharge > 20 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <div className="w-28 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                  style={{ width: `${nitroCharge}%` }}
                />
              </div>
              <span className="text-xs text-slate-300 font-mono">النيترو [Space]</span>
            </div>
          )}

          <button
            onClick={onQuit}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            {isReplayMode ? 'إغلاق الإعادة' : 'انسحاب'}
          </button>
        </div>
      </div>

      {/* True 3D WebGL Canvas Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <div ref={mountRef} className="w-full aspect-[16/10] block" />

        {/* Speedometer */}
        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-4 text-white z-10">
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-red-500">{currentSpeed}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">KM/H</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">عداد السرعة 3D حقيقي</div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all"
                style={{ width: `${Math.min(100, (currentSpeed / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Engine Temp */}
        <div className="absolute bottom-6 left-52 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-3 text-white z-10">
          <Thermometer className={`w-6 h-6 ${engineTemp > 95 ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
          <div>
            <div className="text-xs font-bold text-slate-400">حرارة المحرك</div>
            <div className="text-lg font-black text-white">{Math.round(engineTemp)}°C</div>
          </div>
        </div>

        {/* Android On-Screen Touch Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex items-center gap-4 z-20 md:hidden">
          <div className="flex flex-col gap-2">
            <button
              onTouchStart={() => setTouchSteer(-1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(-1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-16 h-16 bg-slate-800/90 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg active:bg-slate-700"
            >
              ◀
            </button>
            <button
              onTouchStart={() => setTouchSteer(1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-16 h-16 bg-slate-800/90 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg active:bg-slate-700"
            >
              ▶
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onTouchStart={() => setTouchThrottle(1)}
              onTouchEnd={() => setTouchThrottle(0)}
              onMouseDown={() => setTouchThrottle(1)}
              onMouseUp={() => setTouchThrottle(0)}
              className="w-20 h-16 bg-red-600/90 border border-red-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg active:bg-red-500"
            >
              تسارع
            </button>
            <button
              onTouchStart={() => setTouchThrottle(-1)}
              onTouchEnd={() => setTouchThrottle(0)}
              onMouseDown={() => setTouchThrottle(-1)}
              onMouseUp={() => setTouchThrottle(0)}
              className="w-20 h-16 bg-slate-700/90 border border-slate-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg active:bg-slate-600"
            >
              فرامل
            </button>
          </div>
        </div>

        {gameState === 'countdown' && !isReplayMode && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn z-30">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">سباق ثلاثي الأبعاد حقيقي (True 3D Three.js)...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center z-30">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">أهلاً بك على منصة التتويج 3D!</h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت: <span className="text-white font-bold">{raceTime.toFixed(1)} ث</span> | العملات: <span className="text-amber-400 font-bold">+350</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, 350, recordedFramesRef.current, raceTime)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-base"
              >
                <span>حفظ التوقيت وتحديث لوحة المتصدرين</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
