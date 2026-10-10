import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car, Track, ReplayFrame, LeaderboardEntry, PlayerProfile } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, Thermometer, Camera, Flame, ShieldAlert, Award } from 'lucide-react';

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

  // Near Miss / Close Pass Combo System (Asphalt style)
  const [nearMissCombo, setNearMissCombo] = useState<number>(0);
  const [comboPopup, setComboPopup] = useState<string | null>(null);

  const [driftScore, setDriftScore] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood' | 'topdown'>('chase');

  // Touch control states for Asphalt 8 realistic touch UI
  const [touchSteer, setTouchSteer] = useState<-1 | 0 | 1>(0);
  const [touchThrottle, setTouchThrottle] = useState<number>(0); // 1 for forward, -1 for reverse
  const [isBraking, setIsBraking] = useState<boolean>(false);

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
    maxSpeed: 1.3 + (car.speed / 45),
    acceleration: 0.035 + (car.acceleration / 900),
    handling: 0.038 + (car.handling / 1400),
  });

  const aiCarsData = useRef([
    { x: 30, z: 30, angle: 0, speed: 1.0, passed: false },
    { x: -40, z: 50, angle: Math.PI / 2, speed: 0.95, passed: false },
    { x: 60, z: -30, angle: Math.PI, speed: 1.05, passed: false },
    { x: -50, z: -50, angle: -Math.PI / 2, speed: 0.9, passed: false },
  ]);

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

  // Race timer & Near miss timeout reset
  useEffect(() => {
    if (gameState !== 'racing') return;
    const interval = setInterval(() => {
      setRaceTime((t) => t + 0.1);
      setNitroCharge((prev) => Math.min(100, prev + 0.7));
      setEngineTemp((temp) => {
        if (nitroActive) return Math.min(115, temp + 1.2);
        if (currentSpeed > 90) return Math.min(95, temp + 0.3);
        return Math.max(45, temp - 0.5);
      });

      // Reset combo if no near miss for 4 seconds
      if (Date.now() - lastNearMissTimeRef.current > 4000 && nearMissCombo > 0) {
        setNearMissCombo(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, nitroActive, currentSpeed, nearMissCombo]);

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    scene.fog = new THREE.FogExp2(0x050811, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight.position.set(60, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Track Environment
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b1329, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    trackGroup.add(ground);

    const roadGeo = new THREE.RingGeometry(45, 100, 64);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x182238, roughness: 0.5, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.1;
    road.receiveShadow = true;
    trackGroup.add(road);

    const barrierGeo = new THREE.TorusGeometry(102, 1.8, 16, 100);
    const barrierMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.rotation.x = Math.PI / 2;
    barrier.position.y = 1;
    trackGroup.add(barrier);

    // Player Car 3D Mesh
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carMeshRef.current = carGroup;

    const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 4.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: car.color, metalness: 0.85, roughness: 0.15 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: car.secondaryColor, metalness: 0.9, roughness: 0.1 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.2, -0.2);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // AI Traffic Cars Meshes
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
        const maxSpd = nitroActive ? physics.maxSpeed * 1.9 : (isBraking ? physics.maxSpeed * 0.4 : physics.maxSpeed);
        const accelerationRate = isBraking ? physics.acceleration * 2 : physics.acceleration;

        if (keys['KeyW'] || keys['ArrowUp'] || touchThrottle > 0) {
          physics.speed = Math.min(maxSpd, physics.speed + accelerationRate);
        } else if (keys['KeyS'] || keys['ArrowDown'] || touchThrottle < 0 || isBraking) {
          physics.speed = Math.max(-maxSpd / 2, physics.speed - accelerationRate * 1.5);
        } else {
          physics.speed *= 0.982;
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

        setCurrentSpeed(Math.round(Math.abs(physics.speed) * 125));

        // Track collision boundaries with 5-crash threshold rule
        const distFromCenter = Math.hypot(physics.x, physics.z);
        if (distFromCenter < 45 || distFromCenter > 98) {
          physics.speed *= -0.4;
          soundManager.playCrash();
          setCollisionCount((c) => {
            const nextCount = c + 1;
            if (nextCount >= 5) {
              setNitroCharge((nc) => Math.max(0, nc - 20));
            }
            return nextCount;
          });
        }

        if (carMeshRef.current) {
          carMeshRef.current.position.set(physics.x, 0, physics.z);
          carMeshRef.current.rotation.y = physics.angle;
        }

        // AI Cars movement & Near-Miss / Close-Pass detection (Asphalt style)
        aiCarsData.current.forEach((ai, idx) => {
          ai.x += Math.sin(ai.angle) * ai.speed;
          ai.z += Math.cos(ai.angle) * ai.speed;
          ai.angle += 0.01;

          const mesh = aiMeshsRef.current[idx];
          if (mesh) {
            mesh.position.set(ai.x, 0, ai.z);
            mesh.rotation.y = ai.angle;
          }

          // Check proximity for Near-Miss (محاذاة قريبة)
          const distanceToPlayer = Math.hypot(physics.x - ai.x, physics.z - ai.z);
          if (distanceToPlayer < 7 && distanceToPlayer > 2 && Math.abs(physics.speed) > 0.6) {
            const now = Date.now();
            if (now - lastNearMissTimeRef.current > 1200) {
              lastNearMissTimeRef.current = now;
              setNearMissCombo((prev) => {
                const newCombo = prev + 1;
                setComboPopup(`NEAR MISS x${newCombo}! (+${newCombo * 15} NITRO)`);
                setTimeout(() => setComboPopup(null), 1500);
                setNitroCharge((nc) => Math.min(100, nc + newCombo * 15));
                setCoinsCollected((cc) => cc + newCombo * 10);
                soundManager.playCoin();
                return newCombo;
              });
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
          if (cameraMode === 'chase') {
            cameraRef.current.position.set(
              carPos.x - Math.sin(physics.angle) * 15,
              carPos.y + 6.5,
              carPos.z - Math.cos(physics.angle) * 15
            );
            cameraRef.current.lookAt(carPos.x, carPos.y + 1, carPos.z);
          } else if (cameraMode === 'hood') {
            cameraRef.current.position.set(carPos.x, carPos.y + 2.2, carPos.z);
            cameraRef.current.lookAt(
              carPos.x + Math.sin(physics.angle) * 25,
              carPos.y + 1.6,
              carPos.z + Math.cos(physics.angle) * 25
            );
          } else {
            cameraRef.current.position.set(carPos.x, carPos.y + 38, carPos.z - 28);
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
  }, [gameState, car, cameraMode, leaderboardEntry, isBraking]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 animate-fadeIn text-right relative select-none">
      {/* HUD Header (Asphalt Style) */}
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

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCameraMode((m) => (m === 'chase' ? 'hood' : m === 'hood' ? 'topdown' : 'chase'))}
            className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>الكاميرا: {cameraMode === 'chase' ? 'خلف' : cameraMode === 'hood' ? 'مقدمة' : 'علوية'}</span>
          </button>

          {!isReplayMode && (
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${nitroCharge > 20 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <div className="w-28 h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 transition-all shadow-lg"
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
            {isReplayMode ? 'إغلاق' : 'انسحاب'}
          </button>
        </div>
      </div>

      {/* True 3D WebGL Canvas Arena */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <div ref={mountRef} className="w-full aspect-[16/10] block" />

        {/* Speedometer (Asphalt 8 Style) */}
        <div className="absolute bottom-6 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-4 text-white z-10 pointer-events-none">
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-red-500">{currentSpeed}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">KM/H</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">عداد السرعة (Asphalt 3D)</div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all"
                style={{ width: `${Math.min(100, (currentSpeed / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Asphalt 8 Realistic Touch Steering & Pedals UI */}
        <div className="absolute bottom-6 right-6 flex items-end gap-6 z-20 md:hidden">
          {/* Steering Wheel / Left & Right Buttons */}
          <div className="flex gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-3xl border border-slate-700/80 shadow-2xl">
            <button
              onTouchStart={() => setTouchSteer(-1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(-1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-16 h-20 bg-gradient-to-t from-slate-800 to-slate-700 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg active:bg-slate-600 active:scale-95 transition-transform"
            >
              ◀
            </button>
            <button
              onTouchStart={() => setTouchSteer(1)}
              onTouchEnd={() => setTouchSteer(0)}
              onMouseDown={() => setTouchSteer(1)}
              onMouseUp={() => setTouchSteer(0)}
              className="w-16 h-20 bg-gradient-to-t from-slate-800 to-slate-700 border border-slate-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg active:bg-slate-600 active:scale-95 transition-transform"
            >
              ▶
            </button>
          </div>

          {/* Pedals (Gas, Brake, Nitro) */}
          <div className="flex gap-3 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-3xl border border-slate-700/80 shadow-2xl">
            <button
              onTouchStart={() => setIsBraking(true)}
              onTouchEnd={() => setIsBraking(false)}
              onMouseDown={() => setIsBraking(true)}
              onMouseUp={() => setIsBraking(false)}
              className="w-18 h-20 bg-gradient-to-t from-rose-900 to-rose-700 border border-rose-500 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg active:scale-95 transition-transform"
            >
              <span>🛑</span>
              <span className="mt-1">بريك</span>
            </button>

            <button
              onTouchStart={() => setTouchThrottle(1)}
              onTouchEnd={() => setTouchThrottle(0)}
              onMouseDown={() => setTouchThrottle(1)}
              onMouseUp={() => setTouchThrottle(0)}
              className="w-20 h-24 bg-gradient-to-t from-emerald-800 to-emerald-600 border border-emerald-400 rounded-2xl flex flex-col items-center justify-center text-white text-sm font-black shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-xl">🚀</span>
              <span className="mt-1">بنزين</span>
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
              className="w-18 h-20 bg-gradient-to-t from-amber-600 to-orange-500 border border-amber-300 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-lg active:scale-95 transition-transform animate-pulse"
            >
              <span>⚡</span>
              <span className="mt-1">نيترو</span>
            </button>
          </div>
        </div>

        {gameState === 'countdown' && !isReplayMode && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn z-30">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">سباق ثلاثي الأبعاد مع محاذاة السيارات (Near-Miss Combo)...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center z-30">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">أهلاً بك على منصة التتويج!</h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت: <span className="text-white font-bold">{raceTime.toFixed(1)} ث</span> | العملات: <span className="text-amber-400 font-bold">+400</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, 400, recordedFramesRef.current, raceTime)}
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
