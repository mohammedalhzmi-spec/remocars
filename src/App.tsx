import React, { useState, useEffect } from 'react';
import { Car, Track, Upgrade, ReplayFrame } from './types';
import { INITIAL_CARS, INITIAL_TRACKS, INITIAL_UPGRADES } from './data/gameData';
import { Navbar } from './components/Navbar';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { TrackSelect } from './components/TrackSelect';
import { GameCanvas } from './components/GameCanvas';
import { SyncModal } from './components/SyncModal';
import { InstructionsModal } from './components/InstructionsModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { MissionsPanel } from './components/MissionsPanel';
import { NotificationToast } from './components/NotificationToast';
import { SplashIntro } from './components/SplashIntro';
import { soundManager } from './audio';

interface Mission {
  id: string;
  title: string;
  reward: number;
  completed: boolean;
}

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [screen, setScreen] = useState<'menu' | 'garage' | 'tracks' | 'game' | 'replay'>('menu');
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('remocar_coins');
    return saved ? parseInt(saved, 10) : 500;
  });
  const [trophies, setTrophies] = useState<number>(() => {
    const saved = localStorage.getItem('remocar_trophies');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('remocar_cars');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });

  const [selectedCar, setSelectedCar] = useState<Car>(() => {
    return cars.find((c) => c.unlocked) || INITIAL_CARS[0];
  });

  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('remocar_tracks');
    return saved ? JSON.parse(saved) : INITIAL_TRACKS;
  });

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(() => INITIAL_TRACKS[0]);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('remocar_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });

  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>(() => {
    const saved = localStorage.getItem('remocar_last_replay');
    return saved ? JSON.parse(saved) : [];
  });

  const [missions, setMissions] = useState<Mission[]>([
    { id: 'm1', title: 'إكمال سباق 3D بنجاح', reward: 150, completed: false },
    { id: 'm2', title: 'جمع العملات الذهبية في الحلبة', reward: 200, completed: false },
    { id: 'm3', title: 'شراء أو ترقية إحدى السيارات العشر', reward: 300, completed: false },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('remocar_coins', coins.toString());
    localStorage.setItem('remocar_trophies', trophies.toString());
    localStorage.setItem('remocar_cars', JSON.stringify(cars));
    localStorage.setItem('remocar_tracks', JSON.stringify(tracks));
    localStorage.setItem('remocar_upgrades', JSON.stringify(upgrades));
    if (replayFrames.length > 0) {
      localStorage.setItem('remocar_last_replay', JSON.stringify(replayFrames));
    }
  }, [coins, trophies, cars, tracks, upgrades, replayFrames]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playBeep(440, 0.1);
  };

  const handleBuyCar = (car: Car) => {
    if (coins >= car.price) {
      setCoins((c) => c - car.price);
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, unlocked: true } : c))
      );
      const unlockedCar = { ...car, unlocked: true };
      setSelectedCar(unlockedCar);
      setToastMessage(`تهانينا! تمتلك الآن سيارة ${car.name}`);
    }
  };

  const handleUpgradeItem = (upgrade: Upgrade) => {
    if (coins >= upgrade.cost && upgrade.level < upgrade.maxLevel) {
      setCoins((c) => c - upgrade.cost);
      setUpgrades((prev) =>
        prev.map((u) =>
          u.id === upgrade.id
            ? { ...u, level: u.level + 1, cost: Math.round(u.cost * 1.5) }
            : u
        )
      );
      setToastMessage(`تمت ترقية ${upgrade.name} بنجاح إلى المستوى ${upgrade.level + 1}!`);
    }
  };

  const handleClaimDailyReward = (rewardCoins: number) => {
    setCoins((c) => c + rewardCoins);
    setToastMessage(`تم استلام مكافأة الدخول اليومية (+${rewardCoins} عملة)!`);
  };

  const handleClaimMission = (missionId: string, reward: number) => {
    setCoins((c) => c + reward);
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, completed: true } : m))
    );
    setToastMessage(`أنجزت المهمة بنجاح وحصلت على +${reward} عملة!`);
  };

  const handleFinishRace = (won: boolean, coinsEarned: number, frames: ReplayFrame[]) => {
    setCoins((c) => c + coinsEarned);
    if (won) {
      setTrophies((t) => t + 1);
      soundManager.playVictory();
    }
    setReplayFrames(frames);
    setMissions((prev) =>
      prev.map((m) => (m.id === 'm1' ? { ...m, completed: true } : m))
    );
    setToastMessage(`أنهيت السباق وكسبت +${coinsEarned} عملة وتم حفظ إعادة السباق!`);
    setScreen('menu');
  };

  if (showSplash) {
    return <SplashIntro onEnterGame={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white pb-12">
      {/* Daily Reward Modal on App Load */}
      <DailyRewardModal onClaimReward={handleClaimDailyReward} />

      {/* Navbar */}
      <Navbar
        coins={coins}
        trophies={trophies}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNavigate={(s) => setScreen(s as any)}
        currentScreen={screen}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Screens */}
      <main className="pt-4">
        {screen === 'menu' && (
          <MainMenu
            selectedCar={selectedCar}
            hasReplay={replayFrames.length > 0}
            onNavigate={(s) => setScreen(s)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            onOpenMissions={() => setIsMissionsOpen(true)}
          />
        )}

        {screen === 'garage' && (
          <Garage
            cars={cars}
            selectedCar={selectedCar}
            coins={coins}
            upgrades={upgrades}
            onSelectCar={(car) => setSelectedCar(car)}
            onBuyCar={handleBuyCar}
            onUpgradeItem={handleUpgradeItem}
          />
        )}

        {screen === 'tracks' && (
          <TrackSelect
            tracks={tracks}
            onSelectTrack={(track) => {
              setSelectedTrack(track);
              setScreen('game');
            }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'game' && selectedTrack && (
          <GameCanvas
            car={selectedCar}
            track={selectedTrack}
            isReplayMode={false}
            onFinishRace={handleFinishRace}
            onQuit={() => setScreen('tracks')}
          />
        )}

        {screen === 'replay' && selectedTrack && (
          <GameCanvas
            car={selectedCar}
            track={selectedTrack}
            isReplayMode={true}
            replayFrames={replayFrames}
            onFinishRace={() => setScreen('menu')}
            onQuit={() => setScreen('menu')}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <NotificationToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      <MissionsPanel
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        missions={missions}
        onClaimMission={handleClaimMission}
      />
    </div>
  );
}
