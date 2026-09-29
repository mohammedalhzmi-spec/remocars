import React, { useEffect, useRef, useState } from 'react';
import { Car, Track, ReplayFrame } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, Thermometer, Compass, CloudRain, Sun, CloudFog, Camera, Flame } from 'lucide-react';

interface GameCanvasProps {
  car: Car;
  track: Track;
  isReplayMode?: boolean;
  replayFrames?: ReplayFrame[];
  onFinishRace: (won: boolean, coinsEarned: number, frames: ReplayFrame[]) => void;
  onQuit: () => void;
}

interface AICar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  lap: number;
  checkpoint: number;
  maxSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  car,
  track,
  isReplayMode = false,
  replayFrames = [],
  onFinishRace,
  onQuit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'countdown' | 'racing' | 'finished'>(isReplayMode ? 'racing' : 'countdown');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [lap, setLap] = useState<number>(1);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [raceTime, setRaceTime] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [engineTemp, setEngineTemp] = useState<number>(45);
  const [nitroActive, setNitroActive] = useState<boolean>(false);
  const [nitroCharge, setNitroCharge] = useState<number>(100);

  // Drift Challenge State
  const [driftScore, setDriftScore] = useState<number>(0);
  const [driftMultiplier, setDriftMultiplier] = useState<number>(1);
  const isDriftingRef = useRef<boolean>(false);

  // Camera Mode
  const [cameraMode, setCameraMode] = useState<'chase' | 'bumper' | 'topdown'>('chase');

  // Weather state
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'foggy'>(() => {
    const types: ('sunny' | 'rainy' | 'foggy')[] = ['sunny', 'rainy', 'foggy'];
    return types[Math.floor(Math.random() * types.length)];
  });

  // Replay & particles
  const recordedFramesRef = useRef<ReplayFrame[]>([]);
  const replayIndexRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Start ambient audio
  useEffect(() => {
    soundManager.startAmbient(weather);
  }, [weather]);

  // 3D Physics State
  const slipFactor = weather === 'rainy' ? 0.99 : 0.982;
  const carStateRef = useRef({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    speed: 0,
    maxSpeed: (8.5 + (car.speed / 14)) * (weather === 'rainy' ? 0.88 : 1),
    acceleration: 0.22 + (car.acceleration / 300),
    handling: 0.055 + (car.handling / 550),
    friction: slipFactor,
  });

  const aiCarsRef = useRef<AICar[]>([
    { x: 440, y: 530, angle: -Math.PI / 2, speed: 6.0, color: '#3b82f6', lap: 1, checkpoint: 0, maxSpeed: 7.2 },
    { x: 480, y: 560, angle: -Math.PI / 2, speed: 5.7, color: '#10b981', lap: 1, checkpoint: 0, maxSpeed: 7.0 },
    { x: 520, y: 590, angle: -Math.PI / 2, speed: 6.2, color: '#f59e0b', lap: 1, checkpoint: 0, maxSpeed: 7.4 },
    { x: 560, y: 620, angle: -Math.PI / 2, speed: 5.4, color: '#ec4899', lap: 1, checkpoint: 0, maxSpeed: 6.8 },
    { x: 600, y: 650, angle: -Math.PI / 2, speed: 5.9, color: '#8b5cf6', lap: 1, checkpoint: 0, maxSpeed: 7.3 },
    { x: 640, y: 680, angle: -Math.PI / 2, speed: 5.6, color: '#06b6d4', lap: 1, checkpoint: 0, maxSpeed: 7.1 },
  ]);

  const raindropsRef = useRef<{ x: number; y: number; z: number; speed: number }[]>(
    Array.from({ length: 150 }, () => ({
      x: (Math.random() - 0.5) * 2000,
      y: Math.random() * 1000,
      z: Math.random() * 1000,
      speed: 25 + Math.random() * 15,
    }))
  );

  const coinsRef = useRef<{ x: number; y: number; collected: boolean }[]>([
    { x: 800, y: 400, collected: false },
    { x: 1400, y: 300, collected: false },
    { x: 1800, y: 900, collected: false },
    { x: 1200, y: 1400, collected: false },
    { x: 600, y: 1200, collected: false },
    { x: 1500, y: 800, collected: false },
  ]);

  const waypoints = [
    { x: 400, y: 500 },
    { x: 1000, y: 300 },
    { x: 1800, y: 500 },
    { x: 2000, y: 1200 },
    { x: 1400, y: 1800 },
    { x: 600, y: 1600 },
  ];

  // Handle countdown
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

  // Race timer & engine temp & drift scoring
  useEffect(() => {
    if (gameState !== 'racing') return;
    const interval = setInterval(() => {
      setRaceTime((t) => t + 0.1);
      setNitroCharge((prev) => Math.min(100, prev + 0.5));
      setEngineTemp((temp) => {
        if (nitroActive) return Math.min(115, temp + 1.2);
        if (currentSpeed > 60) return Math.min(95, temp + 0.3);
        return Math.max(45, temp - 0.5);
      });

      // Drift Challenge scoring
      if (track.isDriftMode && isDriftingRef.current) {
        setDriftScore((s) => s + Math.round(10 * driftMultiplier));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, nitroActive, currentSpeed, track.isDriftMode, driftMultiplier]);

  // Keyboard listeners & Camera toggle ('C' key)
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
        setCameraMode((m) => (m === 'chase' ? 'bumper' : m === 'bumper' ? 'topdown' : 'chase'));
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

  // Main game loop with drift detection and smoke particles
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateGame = () => {
      if (isReplayMode) {
        const frames = replayFrames;
        if (frames && frames.length > 0) {
          const fr = frames[replayIndexRef.current];
          if (fr) {
            carStateRef.current.x = fr.x;
            carStateRef.current.y = fr.y;
            carStateRef.current.angle = fr.angle;
            carStateRef.current.speed = fr.speed;
            setCurrentSpeed(Math.abs(fr.speed) * 35);
          }
          replayIndexRef.current = (replayIndexRef.current + 1) % frames.length;
        }
      } else if (gameState === 'racing') {
        const st = carStateRef.current;
        const keys = keysRef.current;
        const currentMaxSpeed = nitroActive ? st.maxSpeed * 1.8 : st.maxSpeed;

        if (keys['KeyW'] || keys['ArrowUp']) {
          st.speed = Math.min(currentMaxSpeed, st.speed + st.acceleration);
        } else if (keys['KeyS'] || keys['ArrowDown']) {
          st.speed = Math.max(-st.maxSpeed / 2.5, st.speed - st.acceleration);
        } else {
          st.speed *= st.friction;
        }

        let isSteering = false;
        if (keys['KeyA'] || keys['ArrowLeft']) {
          if (Math.abs(st.speed) > 0.3) {
            st.angle -= st.handling * (st.speed > 0 ? 1 : -1);
            isSteering = true;
          }
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          if (Math.abs(st.speed) > 0.3) {
            st.angle += st.handling * (st.speed > 0 ? 1 : -1);
            isSteering = true;
          }
        }

        // Detect Drifting
        if (isSteering && Math.abs(st.speed) > 4) {
          isDriftingRef.current = true;
          setDriftMultiplier((m) => Math.min(5, Number((m + 0.05).toFixed(1))));
          soundManager.playDriftScreech();

          // Spawn smoke particles
          particlesRef.current.push({
            x: st.x - Math.cos(st.angle) * 25,
            y: st.y - Math.sin(st.angle) * 25,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: 10 + Math.random() * 10,
            alpha: 0.8,
            color: track.id === 'desert_rally' ? '#d97706' : '#e2e8f0',
          });
        } else {
          isDriftingRef.current = false;
          setDriftMultiplier(1);
        }

        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;
        setCurrentSpeed(Math.round(Math.abs(st.speed) * 35));

        recordedFramesRef.current.push({
          x: st.x,
          y: st.y,
          angle: st.angle,
          speed: st.speed,
        });

        // Boundary collision
        if (st.x < 100 || st.x > 2400 || st.y < 100 || st.y > 2200) {
          st.speed *= -0.4;
          soundManager.playCrash();
        }

        // Coins collection
        coinsRef.current.forEach((coin) => {
          if (!coin.collected) {
            const dist = Math.hypot(st.x - coin.x, st.y - coin.y);
            if (dist < 45) {
              coin.collected = true;
              setCoinsCollected((c) => c + 15);
              soundManager.playCoin();
            }
          }
        });

        // Update AI
        aiCarsRef.current.forEach((ai) => {
          const target = waypoints[ai.checkpoint];
          const angleToTarget = Math.atan2(target.y - ai.y, target.x - ai.x);
          let angleDiff = angleToTarget - ai.angle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          ai.angle += Math.max(-0.05, Math.min(0.05, angleDiff));

          ai.x += Math.cos(ai.angle) * ai.speed;
          ai.y += Math.sin(ai.angle) * ai.speed;

          if (Math.hypot(ai.x - target.x, ai.y - target.y) < 150) {
            ai.checkpoint = (ai.checkpoint + 1) % waypoints.length;
            if (ai.checkpoint === 0) {
              ai.lap += 1;
              if (ai.lap > track.laps && gameState === 'racing') {
                setGameState('finished');
                setIsWinner(false);
                soundManager.playCrash();
              }
            }
          }
        });
      }

      // Update smoke particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.5;
        p.alpha -= 0.025;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const st = carStateRef.current;
      const cameraX = cameraMode === 'bumper' ? st.x + Math.cos(st.angle) * 30 : st.x;
      const cameraY = cameraMode === 'bumper' ? st.y + Math.sin(st.angle) * 30 : st.y;
      const cameraAngle = st.angle;
      const zoom = cameraMode === 'topdown' ? 0.6 : cameraMode === 'bumper' ? 1.4 : 1.0;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.rotate(-cameraAngle - Math.PI / 2);
      ctx.translate(-cameraX, -cameraY);

      const groundGrad = ctx.createRadialGradient(cameraX, cameraY, 100, cameraX, cameraY, 1800);
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(cameraX - 2000, cameraY - 2000, 4000, 4000);

      // Track Road
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 180;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(400, 500);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 190;
      ctx.setLineDash([30, 30]);
      ctx.beginPath();
      ctx.moveTo(400, 500);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(400, 500);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.fill();

      // Smoke / Dust particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Coins
      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        }
      });

      // AI Cars
      aiCarsRef.current.forEach((ai) => {
        ctx.save();
        ctx.translate(ai.x, ai.y);
        ctx.rotate(ai.angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 26, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ai.color;
        ctx.beginPath();
        ctx.roundRect(-28, -14, 56, 28, [10]);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Player Car
      if (cameraMode !== 'bumper') {
        ctx.save();
        ctx.translate(st.x, st.y);
        ctx.rotate(st.angle);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        if (nitroActive) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-32, -10);
          ctx.lineTo(-58, 0);
          ctx.lineTo(-32, 10);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(-30, -16, 60, 32, [12]);
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = car.secondaryColor;
        ctx.fillRect(-12, -12, 24, 24);

        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 15;
        ctx.fillRect(26, -13, 6, 8);
        ctx.fillRect(26, 5, 6, 8);
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      ctx.restore();

      animationId = requestAnimationFrame(updateGame);
    };

    animationId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, nitroActive, car, track, weather, isReplayMode, replayFrames, cameraMode]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn text-right">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl">
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
              <Flame className="w-4 h-4 animate-bounce text-amber-400" />
              <span>نقاط الدريفت: {driftScore} (x{driftMultiplier})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCameraMode((m) => (m === 'chase' ? 'bumper' : m === 'bumper' ? 'topdown' : 'chase'))}
            className="flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>الكاميرا: {cameraMode === 'chase' ? 'خلف السيارة' : cameraMode === 'bumper' ? 'من المصد' : 'علوية'}</span>
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

      {/* Canvas Arena with HUD */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <canvas
          ref={canvasRef}
          width={1200}
          height={750}
          className="w-full max-w-full h-auto aspect-[16/10] block"
        />

        {/* Speedometer */}
        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-4 text-white">
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-slate-800 flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-red-500">{currentSpeed}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">KM/H</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">عداد السرعة 3D</div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 transition-all"
                style={{ width: `${Math.min(100, (currentSpeed / 250) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Engine Temp */}
        <div className="absolute bottom-6 left-52 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-3xl shadow-2xl flex items-center gap-3 text-white">
          <Thermometer className={`w-6 h-6 ${engineTemp > 95 ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
          <div>
            <div className="text-xs font-bold text-slate-400">حرارة المحرك</div>
            <div className="text-lg font-black text-white">{Math.round(engineTemp)}°C</div>
          </div>
        </div>

        {/* Mini-map */}
        <div className="absolute top-6 right-6 w-36 h-36 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-2 flex flex-col items-center justify-center relative">
          <div className="absolute top-2 right-3 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <Compass className="w-3 h-3 text-red-500" />
            <span>الخريطة المصغرة</span>
          </div>
          <div className="w-28 h-24 border-2 border-dashed border-slate-700 rounded-2xl relative flex items-center justify-center">
            <div className="absolute w-3 h-3 bg-red-500 rounded-full shadow-lg animate-ping" />
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg" />
          </div>
        </div>

        {gameState === 'countdown' && !isReplayMode && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">جاهز لتحدي الدريفت الملحمي بدون إنترنت...</p>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">أهلاً بك على منصة التتويج!</h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت: <span className="text-white font-bold">{raceTime.toFixed(1)} ث</span> | نقاط الدريفت: <span className="text-amber-400 font-bold">{driftScore}</span> | العملات: <span className="text-amber-400 font-bold">+{coinsCollected + Math.round(driftScore / 10) + 150}</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, coinsCollected + Math.round(driftScore / 10) + 150, recordedFramesRef.current)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-base"
              >
                <span>حفظ النتيجة ومشاهدة الإعادة</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
