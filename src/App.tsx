import React, { useState, useEffect } from 'react';
import { Car, Track, Upgrade, ReplayFrame, LeaderboardEntry, PlayerProfile } from './types';
import { INITIAL_CARS, INITIAL_TRACKS, INITIAL_UPGRADES } from './data/gameData';
import { MULTIPLAYER_TRACKS } from './data/multiplayerTracks';
import { Navbar } from './components/Navbar';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { TrackSelect } from './components/TrackSelect';
import { SyncModal } from './components/SyncModal';
import { InstructionsModal } from './components/InstructionsModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { MissionsPanel } from './components/MissionsPanel';
import { NotificationToast } from './components/NotificationToast';
import { SplashIntro } from './components/SplashIntro';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { soundManager } from './audio';
import { lanMultiplayer } from './app/lanMultiplayer';

const GameCanvas = React.lazy(() => import('./components/GameCanvas').then((module) => ({ default: module.GameCanvas })));

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

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('remocar_player_profile');
    return saved ? JSON.parse(saved) : { name: 'المتسابق البطل', level: 1, xp: 120, title: 'متسابق مبتدئ' };
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('remocar_leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

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
    { id: 'm1', title: 'إكمال سباق 3D بنجاح', reward: 200, completed: false },
    { id: 'm2', title: 'تحطيم الرقم القياسي والتغلب على سيارة الشبح', reward: 350, completed: false },
    { id: 'm3', title: 'رفع مستوى المتسابق في الملف الشخصي', reward: 300, completed: false },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [isMultiplayerRoom, setIsMultiplayerRoom] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('remocar_coins', coins.toString());
    localStorage.setItem('remocar_trophies', trophies.toString());
    localStorage.setItem('remocar_cars', JSON.stringify(cars));
    localStorage.setItem('remocar_tracks', JSON.stringify(tracks));
    localStorage.setItem('remocar_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('remocar_player_profile', JSON.stringify(profile));
    localStorage.setItem('remocar_leaderboard', JSON.stringify(leaderboard));
    if (replayFrames.length > 0) {
      localStorage.setItem('remocar_last_replay', JSON.stringify(replayFrames));
    }
  }, [coins, trophies, cars, tracks, upgrades, profile, leaderboard, replayFrames]);

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

  const handleCustomizeCar = (updatedCar: Car) => {
    setCars((prev) => prev.map((car) => car.id === updatedCar.id ? updatedCar : car));
    setSelectedCar((current) => current.id === updatedCar.id ? updatedCar : current);
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
    const mission = missions.find((item) => item.id === missionId);
    if (!mission || mission.completed) return;
    setCoins((c) => c + reward);
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, completed: true } : m))
    );
    setToastMessage(`أنجزت المهمة بنجاح وحصلت على +${reward} عملة!`);
  };

  const handleFinishRace = (won: boolean, coinsEarned: number, frames: ReplayFrame[], lapTime: number) => {
    const finalEarned = Math.round(coinsEarned * (selectedTrack?.rewardMultiplier || 1) * (1 + profile.level * 0.1));
    setCoins((c) => c + finalEarned);
    
    // Gain XP and check Level up
    const newXp = profile.xp + (won ? 180 : 80);
    let newLevel = profile.level;
    let newTitle = profile.title;
    while (newXp >= newLevel * 500) {
      newLevel += 1;
      if (newLevel >= 5) newTitle = 'أساطير السباقات المطلقة';
      else if (newLevel >= 3) newTitle = 'متسابق محترف معتمد';
    }
    if (newLevel > profile.level) setToastMessage(`تهانينا! وصلت إلى المستوى ${newLevel} وفتحت مزايا جديدة!`);
    setProfile({ ...profile, xp: newXp, level: newLevel, title: newTitle });

    if (won) {
      setTrophies((t) => t + 1);
      soundManager.playVictory();
    }

    // Update Leaderboard & Ghost if better lap time
    if (selectedTrack) {
      const existingEntry = leaderboard.find((l) => l.trackId === selectedTrack.id);
      if (!existingEntry || lapTime < existingEntry.bestTime) {
        const newEntry: LeaderboardEntry = {
          trackId: selectedTrack.id,
          playerName: profile.name,
          bestTime: lapTime,
          date: new Date().toLocaleDateString(),
          ghostFrames: frames,
        };
        setLeaderboard((prev) => [...prev.filter((l) => l.trackId !== selectedTrack.id), newEntry]);
        setToastMessage(`رقم قياسي جديد في حلبة ${selectedTrack.name}! (${lapTime.toFixed(2)} ث)`);
      }
    }

    setReplayFrames(frames);
    setMissions((prev) =>
      prev.map((m) => (m.id === 'm1' ? { ...m, completed: true } : m))
    );
    setScreen('menu');
  };

  if (showSplash) {
    return <SplashIntro onEnterGame={() => setShowSplash(false)} />;
  }

  const currentTrackLeaderboard = selectedTrack ? leaderboard.find((l) => l.trackId === selectedTrack.id) : undefined;

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
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Main Content Screens */}
      <main className="pt-4">
        {screen === 'menu' && (
          <MainMenu
            selectedCar={selectedCar}
            playerName={profile.name}
            hasReplay={replayFrames.length > 0}
            onNavigate={(s) => setScreen(s)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
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
            onCustomizeCar={handleCustomizeCar}
          />
        )}

        {screen === 'tracks' && (
          <TrackSelect
            tracks={tracks}
            onSelectTrack={(track) => {
              setIsMultiplayerRoom(false);
              setSelectedTrack(track);
              setScreen('game');
            }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'game' && selectedTrack && (
          <React.Suspense fallback={<div className="min-h-[70vh] grid place-items-center text-amber-300">جارٍ تحميل محرك السباق ثلاثي الأبعاد…</div>}>
            <GameCanvas
              car={selectedCar}
              track={selectedTrack}
              profile={profile}
              upgrades={upgrades}
              leaderboardEntry={currentTrackLeaderboard}
              isReplayMode={false}
              isMultiplayerRoom={isMultiplayerRoom}
              onFinishRace={handleFinishRace}
              onQuit={() => { if (isMultiplayerRoom) lanMultiplayer.close(); setIsMultiplayerRoom(false); setScreen('tracks'); }}
            />
          </React.Suspense>
        )}

        {screen === 'replay' && selectedTrack && (
          <React.Suspense fallback={<div className="min-h-[70vh] grid place-items-center text-amber-300">جارٍ تحميل إعادة السباق…</div>}>
            <GameCanvas
              car={selectedCar}
              track={selectedTrack}
              profile={profile}
              upgrades={upgrades}
              isReplayMode={true}
              isMultiplayerRoom={false}
              replayFrames={replayFrames}
              onFinishRace={() => setScreen('menu')}
              onQuit={() => setScreen('menu')}
            />
          </React.Suspense>
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

      <MultiplayerLobby
        isOpen={isMultiplayerOpen}
        selectedCar={selectedCar}
        playerName={profile.name}
        tracks={MULTIPLAYER_TRACKS}
        onClose={() => setIsMultiplayerOpen(false)}
        onStartMultiplayerRace={(code, trackId) => {
          setIsMultiplayerOpen(false);
          const roomTrack = MULTIPLAYER_TRACKS.find((track) => track.id === trackId) || tracks[0];
          setSelectedTrack(roomTrack);
          setIsMultiplayerRoom(true);
          setScreen('game');
          setToastMessage(`بدأ السباق الجماعي على ${roomTrack.name} (غرفة ${code}).`);
        }}
      />

      <PlayerProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onUpdateProfile={(newName) => setProfile({ ...profile, name: newName })}
        onClose={() => setIsProfileOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        tracks={tracks}
        leaderboard={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
}
