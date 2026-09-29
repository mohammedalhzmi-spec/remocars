import React, { useEffect, useRef, useState } from 'react';
import { Car, Track } from '../types';
import { soundManager } from '../audio';
import { Trophy, Coins, RotateCcw, Flag, ArrowRight, Zap } from 'lucide-react';

interface GameCanvasProps {
  car: Car;
  track: Track;
  onFinishRace: (won: boolean, coinsEarned: number) => void;
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
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  car,
  track,
  onFinishRace,
  onQuit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'countdown' | 'racing' | 'finished'>('countdown');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [lap, setLap] = useState<number>(1);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [raceTime, setRaceTime] = useState<number>(0);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [nitroActive, setNitroActive] = useState<boolean>(false);
  const [nitroCharge, setNitroCharge] = useState<number>(100);

  // Controls state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Physics state refs
  const carStateRef = useRef({
    x: 150,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    maxSpeed: 6 + (car.speed / 20),
    acceleration: 0.15 + (car.acceleration / 500),
    handling: 0.04 + (car.handling / 1000),
    friction: 0.98,
  });

  const aiCarsRef = useRef<AICar[]>([
    { x: 180, y: 320, angle: 0, speed: 5.2, color: '#3b82f6', lap: 1, checkpoint: 0 },
    { x: 210, y: 340, angle: 0, speed: 4.8, color: '#10b981', lap: 1, checkpoint: 0 },
    { x: 240, y: 360, angle: 0, speed: 5.5, color: '#f59e0b', lap: 1, checkpoint: 0 },
  ]);

  const coinsRef = useRef<{ x: number; y: number; collected: boolean }[]>([
    { x: 400, y: 150, collected: false },
    { x: 750, y: 200, collected: false },
    { x: 900, y: 500, collected: false },
    { x: 500, y: 550, collected: false },
    { x: 250, y: 400, collected: false },
  ]);

  // Handle countdown
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdownNum > 0) {
        soundManager.playStartBeep(false);
        const timer = setTimeout(() => setCountdownNum(countdownNum - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        soundManager.playStartBeep(true);
        setGameState('racing');
      }
    }
  }, [gameState, countdownNum]);

  // Race timer
  useEffect(() => {
    if (gameState !== 'racing') return;
    const interval = setInterval(() => {
      setRaceTime((t) => t + 0.1);
      // Regenerate nitro slowly
      setNitroCharge((prev) => Math.min(100, prev + 0.5));
    }, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard listeners
  useEffect(() => {
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
  }, [nitroCharge]);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'racing') return;

    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track loop waypoints for AI
    const waypoints = [
      { x: 150, y: 300 },
      { x: 300, y: 150 },
      { x: 700, y: 150 },
      { x: 900, y: 350 },
      { x: 750, y: 550 },
      { x: 350, y: 550 },
    ];

    const updateGame = () => {
      // 1. Update Player Car Physics
      const st = carStateRef.current;
      const keys = keysRef.current;
      const currentMaxSpeed = nitroActive ? st.maxSpeed * 1.6 : st.maxSpeed;

      if (keys['KeyW'] || keys['ArrowUp']) {
        st.speed = Math.min(currentMaxSpeed, st.speed + st.acceleration);
      } else if (keys['KeyS'] || keys['ArrowDown']) {
        st.speed = Math.max(-st.maxSpeed / 2, st.speed - st.acceleration);
      } else {
        st.speed *= st.friction;
      }

      if (keys['KeyA'] || keys['ArrowLeft']) {
        if (Math.abs(st.speed) > 0.5) {
          st.angle -= st.handling * (st.speed > 0 ? 1 : -1);
        }
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        if (Math.abs(st.speed) > 0.5) {
          st.angle += st.handling * (st.speed > 0 ? 1 : -1);
        }
      }

      st.x += Math.cos(st.angle) * st.speed;
      st.y += Math.sin(st.angle) * st.speed;

      // Canvas boundary limits
      const margin = 50;
      if (st.x < margin) { st.x = margin; st.speed *= -0.5; soundManager.playCrash(); }
      if (st.x > canvas.width - margin) { st.x = canvas.width - margin; st.speed *= -0.5; soundManager.playCrash(); }
      if (st.y < margin) { st.y = margin; st.speed *= -0.5; soundManager.playCrash(); }
      if (st.y > canvas.height - margin) { st.y = canvas.height - margin; st.speed *= -0.5; soundManager.playCrash(); }

      // Check coin collisions
      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          const dist = Math.hypot(st.x - coin.x, st.y - coin.y);
          if (dist < 30) {
            coin.collected = true;
            setCoinsCollected((c) => c + 10);
            soundManager.playCoin();
          }
        }
      });

      // Lap check (Start/Finish line around x: 150, y: 300)
      if (st.x > 130 && st.x < 180 && st.y > 270 && st.y < 330) {
        // Prevent instant re-triggering by checking lap timing
      }

      // 2. Update AI Cars
      aiCarsRef.current.forEach((ai) => {
        const target = waypoints[ai.checkpoint];
        const angleToTarget = Math.atan2(target.y - ai.y, target.x - ai.x);
        
        // Smooth steer towards waypoint
        let angleDiff = angleToTarget - ai.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        ai.angle += Math.max(-0.05, Math.min(0.05, angleDiff));

        ai.x += Math.cos(ai.angle) * ai.speed;
        ai.y += Math.sin(ai.angle) * ai.speed;

        // Checkpoint reached
        if (Math.hypot(ai.x - target.x, ai.y - target.y) < 80) {
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

      // 3. Render Graphics
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Track Background & Grass
      ctx.fillStyle = '#0f172a'; // Dark asphalt
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer & Inner track boundaries
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 120;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(150, 300);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.stroke();

      // Track inner grass/dirt area
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(150, 300);
      waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
      ctx.closePath();
      ctx.fill();

      // Start/Finish Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(150, 260);
      ctx.lineTo(150, 340);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Coins
      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        }
      });

      // Draw AI Cars
      aiCarsRef.current.forEach((ai) => {
        ctx.save();
        ctx.translate(ai.x, ai.y);
        ctx.rotate(ai.angle);
        ctx.fillStyle = ai.color;
        ctx.fillRect(-18, -10, 36, 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -8, 16, 16); // windshield
        ctx.restore();
      });

      // Draw Player Car
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.angle);
      
      // Nitro flame effect
      if (nitroActive) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-38, 0);
        ctx.lineTo(-22, 6);
        ctx.closePath();
        ctx.fill();
      }

      // Car body
      ctx.fillStyle = car.color;
      ctx.fillRect(-22, -12, 44, 24);
      ctx.fillStyle = car.secondaryColor;
      ctx.fillRect(-10, -10, 20, 20);
      
      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -15, 10, 5);
      ctx.fillRect(6, -15, 10, 5);
      ctx.fillRect(-16, 10, 10, 5);
      ctx.fillRect(6, 10, 10, 5);
      
      ctx.restore();

      animationId = requestAnimationFrame(updateGame);
    };

    animationId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, nitroActive, car, track]);

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
        </div>

        <div className="flex items-center gap-4">
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

          <button
            onClick={onQuit}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            انسحاب
          </button>
        </div>
      </div>

      {/* Canvas Arena */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex justify-center">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="w-full max-w-full h-auto aspect-[5/3] block"
        />

        {/* Countdown overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
            <span className="text-8xl font-black text-red-500 mb-4 animate-bounce">
              {countdownNum > 0 ? countdownNum : 'انطلق!'}
            </span>
            <p className="text-slate-300 text-lg font-bold">استعد للسباق...</p>
          </div>
        )}

        {/* Finished overlay */}
        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-4xl mb-6 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">
              {isWinner ? 'ألف مبروك الفوز بالمركز الأول!' : 'أنهيت السباق بنجاح!'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              التوقيت الإجمالي: <span className="text-white font-bold">{raceTime.toFixed(1)} ثانية</span> | العملات المكتسبة: <span className="text-amber-400 font-bold">+{coinsCollected + 50}</span>
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onFinishRace(true, coinsCollected + 50)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-base"
              >
                <span>استلام الجائزة والعودة</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile / Touch Controls Helper */}
      <div className="mt-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <span>💡 نصيحة: استخدم مفاتيح لوحة المفاتيح [W A S D أو الأسهم] للتحكم، ومفتاح [Space] للنيترو.</span>
        <button
          onClick={() => {
            setGameState('finished');
            setIsWinner(true);
            soundManager.playVictory();
          }}
          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold hover:bg-emerald-600/30 transition-colors"
        >
          إنهاء تجريبي للفوز
        </button>
      </div>
    </div>
  );
};
