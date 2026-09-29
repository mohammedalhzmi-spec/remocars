import React, { useEffect, useRef, useState } from 'react';
import { Car, Track, ReplayFrame } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, Flag, ArrowRight, Zap, CloudRain, Sun, CloudFog } from 'lucide-react';

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
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [nitroActive, setNitroActive] = useState<boolean>(false);
  const [nitroCharge, setNitroCharge] = useState<number>(100);

  // Weather state
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'foggy'>(() => {
    const types: ('sunny' | 'rainy' | 'foggy')[] = ['sunny', 'rainy', 'foggy'];
    return types[Math.floor(Math.random() * types.length)];
  });

  // Replay recording
  const recordedFramesRef = useRef<ReplayFrame[]>([]);
  const replayIndexRef = useRef<number>(0);

  // Controls state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Physics state refs for realistic 3D RC car handling
  const slipFactor = weather === 'rainy' ? 0.992 : 0.98;
  const carStateRef = useRef({
    x: 200,
    y: 350,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    maxSpeed: (7 + (car.speed / 18)) * (weather === 'rainy' ? 0.9 : 1),
    acceleration: 0.18 + (car.acceleration / 400),
    handling: 0.045 + (car.handling / 800),
    friction: slipFactor,
  });

  // 6 Competitive AI Opponents
  const aiCarsRef = useRef<AICar[]>([
    { x: 220, y: 380, angle: 0, speed: 5.4, color: '#3b82f6', lap: 1, checkpoint: 0, maxSpeed: 6.2 },
    { x: 250, y: 410, angle: 0, speed: 5.1, color: '#10b981', lap: 1, checkpoint: 0, maxSpeed: 6.0 },
    { x: 280, y: 440, angle: 0, speed: 5.6, color: '#f59e0b', lap: 1, checkpoint: 0, maxSpeed: 6.4 },
    { x: 310, y: 470, angle: 0, speed: 4.9, color: '#ec4899', lap: 1, checkpoint: 0, maxSpeed: 5.9 },
    { x: 340, y: 500, angle: 0, speed: 5.3, color: '#8b5cf6', lap: 1, checkpoint: 0, maxSpeed: 6.1 },
    { x: 370, y: 530, angle: 0, speed: 5.0, color: '#06b6d4', lap: 1, checkpoint: 0, maxSpeed: 6.0 },
  ]);

  // Raindrops particles
  const raindropsRef = useRef<{ x: number; y: number; speed: number; length: number }[]>(
    Array.from({ length: 120 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 800,
      speed: 12 + Math.random() * 8,
      length: 15 + Math.random() * 15,
    }))
  );

  const coinsRef = useRef<{ x: number; y: number; collected: boolean }[]>([
    { x: 450, y: 180, collected: false },
    { x: 800, y: 220, collected: false },
    { x: 1000, y: 450, collected: false },
    { x: 650, y: 650, collected: false },
    { x: 300, y: 500, collected: false },
    { x: 750, y: 350, collected: false },
  ]);

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

  // Race timer
  useEffect(() => {
    if (gameState !== 'racing') return;
    const interval = setInterval(() => {
      setRaceTime((t) => t + 0.1);
      setNitroCharge((prev) => Math.min(100, prev + 0.6));
    }, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard listeners
  useEffect(() => {
    if (isReplayMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (nitroCharge > 20) {
          setNitroActive(true);
          soundManager.playNitro();
          setTimeout(() => setNitroActive(false), 1500);
          setNitroCharge((c) => Math.max(0, c - 40));
        }
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
  }, [nitroCharge, isReplayMode]);

  // Main 3D Pseudo-Perspective Game Loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waypoints = [
      { x: 200, y: 350 },
      { x: 400, y: 180 },
      { x: 850, y: 180 },
      { x: 1050, y: 400 },
      { x: 850, y: 650 },
      { x: 450, y: 650 },
    ];

    const updateGame = () => {
      if (isReplayMode) {
        // Playback Replay
        const frames = replayFrames;
        if (frames && frames.length > 0) {
          const fr = frames[replayIndexRef.current];
          if (fr) {
            carStateRef.current.x = fr.x;
            carStateRef.current.y = fr.y;
            carStateRef.current.angle = fr.angle;
            carStateRef.current.speed = fr.speed;
          }
          replayIndexRef.current = (replayIndexRef.current + 1) % frames.length;
        }
      } else if (gameState === 'racing') {
        // Player Control & Physics
        const st = carStateRef.current;
        const keys = keysRef.current;
        const currentMaxSpeed = nitroActive ? st.maxSpeed * 1.7 : st.maxSpeed;

        if (keys['KeyW'] || keys['ArrowUp']) {
          st.speed = Math.min(currentMaxSpeed, st.speed + st.acceleration);
        } else if (keys['KeyS'] || keys['ArrowDown']) {
          st.speed = Math.max(-st.maxSpeed / 2, st.speed - st.acceleration);
        } else {
          st.speed *= st.friction;
        }

        if (keys['KeyA'] || keys['ArrowLeft']) {
          if (Math.abs(st.speed) > 0.4) {
            st.angle -= st.handling * (st.speed > 0 ? 1 : -1);
          }
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          if (Math.abs(st.speed) > 0.4) {
            st.angle += st.handling * (st.speed > 0 ? 1 : -1);
          }
        }

        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;

        // Record frame for replay
        recordedFramesRef.current.push({
          x: st.x,
          y: st.y,
          angle: st.angle,
          speed: st.speed,
        });

        // Boundaries
        const margin = 60;
        if (st.x < margin || st.x > canvas.width - margin || st.y < margin || st.y > canvas.height - margin) {
          st.speed *= -0.4;
          soundManager.playCrash();
        }

        // Coins collection
        coinsRef.current.forEach((coin) => {
          if (!coin.collected) {
            const dist = Math.hypot(st.x - coin.x, st.y - coin.y);
            if (dist < 35) {
              coin.collected = true;
              setCoinsCollected((c) => c + 15);
              soundManager.playCoin();
            }
          }
        });

        // AI update
        aiCarsRef.current.forEach((ai) => {
          const target = waypoints[ai.checkpoint];
          const angleToTarget = Math.atan2(target.y - ai.y, target.x - ai.x);
          let angleDiff = angleToTarget - ai.angle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          ai.angle += Math.max(-0.06, Math.min(0.06, angleDiff));

          ai.x += Math.cos(ai.angle) * ai.speed;
          ai.y += Math.sin(ai.angle) * ai.speed;

          if (Math.hypot(ai.x - target.x, ai.y - target.y) < 90) {
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

      // Render 3D Pseudo-Perspective Graphics
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Track Asphalt background with dynamic 3D gradient lighting
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (weather === 'foggy') {
        bgGradient.addColorStop(0, '#334155');
        bgGradient.addColorStop(1, '#1e293b');
      } else if (weather === 'rainy') {
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#020617');
      } else {
        bgGradient.addColorStop(0, '#1e293b');
        bgGradient.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 3D Track Road
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 140;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(200, 350);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.stroke();

      // Road Inner Edge Borders (Kerb strips)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 148;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(200, 350);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Road Surface Center
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(200, 350);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.fill();

      // Start / Finish Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(200, 300);
      ctx.lineTo(200, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Coins 3D
      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        }
      });

      // Draw AI Cars 3D Realistic Model
      aiCarsRef.current.forEach((ai) => {
        ctx.save();
        ctx.translate(ai.x, ai.y);
        ctx.rotate(ai.angle);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-22, -12, 44, 24);

        // Body
        ctx.fillStyle = ai.color;
        ctx.beginPath();
        ctx.roundRect(-20, -11, 40, 22, [6]);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -8, 14, 16);

        // Spoiler
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -13, 5, 26);

        ctx.restore();
      });

      // Draw Player Realistic 3D Car
      const st = carStateRef.current;
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.angle);

      // Shadow 3D
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-25, -14, 50, 28);

      // Nitro flame
      if (nitroActive) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-25, -8);
        ctx.lineTo(-45, 0);
        ctx.lineTo(-25, 8);
        ctx.closePath();
        ctx.fill();
      }

      // Main Car Body with metallic gradient effect
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 24, [8]);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Windshield & Roof
      ctx.fillStyle = car.secondaryColor;
      ctx.fillRect(-8, -9, 16, 18);

      // Headlights glow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(18, -10, 4, 6);
      ctx.fillRect(18, 4, 4, 6);

      // Spoiler
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-24, -14, 6, 28);

      ctx.restore();

      // Weather Visual Effects (Rain / Fog)
      if (weather === 'rainy') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
        ctx.lineWidth = 2;
        raindropsRef.current.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 3, drop.y + drop.length);
          ctx.stroke();
          drop.y += drop.speed;
          drop.x -= 1;
          if (drop.y > canvas.height) drop.y = -20;
          if (drop.x < 0) drop.x = canvas.width;
        });
      } else if (weather === 'foggy') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(updateGame);
    };

    animationId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, nitroActive, car, track, weather, isReplayMode, replayFrames]);

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
          <div className="flex items-center gap-2 text-white font-bold">
            <span>التوقيت: {raceTime.toFixed(1)} ث</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
            {weather === 'sunny' && <><Sun className="w-4 h-4 text-amber-400" /><span>الطقس: مشمس</span></>}
            {weather === 'rainy' && <><CloudRain className="w-4 h-4 text-sky-400" /><span>الطقس: ممطر (زلق)</span></>}
            {weather === 'foggy' && <><CloudFog className="w-4 h-4 text-slate-400" /><span>الطقس: ضبابي</span></>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isReplayMode && (
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${nitroCharge > 20 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
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

      {/* Canvas Arena */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <canvas
          ref={canvasRef}
          width={1200}
          height={750}
          className="w-full max-w-full h-auto aspect-[16/10] block"
        />

        {/* Countdown overlay */}
        {gameState === 'countdown' && !isReplayMode && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">الطقس الحالي: {weather === 'rainy' ? 'ممطر بحذر!' : weather === 'foggy' ? 'ضباب كثيف!' : 'مشمس ومثالي!'}</p>
          </div>
        )}

        {/* Finished overlay */}
        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">أهلاً بك على منصة التتويج!</h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت الإجمالي: <span className="text-white font-bold">{raceTime.toFixed(1)} ثانية</span> | العملات المكتسبة: <span className="text-amber-400 font-bold">+{coinsCollected + 100}</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, coinsCollected + 100, recordedFramesRef.current)}
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
