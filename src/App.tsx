import React, { useState, useEffect } from 'react';
import { Car, Track, Upgrade, ReplayFrame, LeaderboardEntry, PlayerProfile, GamePreferences } from './types';
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
import { SettingsModal } from './components/SettingsModal';
import { CareerEventsModal } from './components/CareerEventsModal';
import { soundManager } from './audio';
import { lanMultiplayer } from './app/lanMultiplayer';
import { getLevelBenefits, getLevelFromXp, getLevelReward, getLevelTitle, LEVEL_MILESTONES } from './data/progression';
import { getSelectedCoach } from './data/raceCoaches';
import { playCoachIntroduction, playWinnerAnnouncement } from './app/coachAudio';
import { LanTournamentResult } from './app/lanMultiplayer';
import { stopAndroidLanHost } from './app/nativeLanHost';
import { readGamePreferences } from './app/gamePreferences';
import { CAREER_EVENTS } from './data/careerEvents';

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
  const [preferences, setPreferences] = useState<GamePreferences>(() => readGamePreferences());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCareerEventsOpen, setIsCareerEventsOpen] = useState(false);
  const [completedCareerEventIds, setCompletedCareerEventIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('remocar_completed_career_events');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });
  const [activeCareerEvent, setActiveCareerEvent] = useState<{ id: string; round: number } | null>(null);
  const [soloRaceKey, setSoloRaceKey] = useState(0);

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('remocar_player_profile');
    return saved ? JSON.parse(saved) : { name: 'المتسابق البطل', level: 1, xp: 120, title: 'متسابق مبتدئ' };
  });
  const [selectedCoachId, setSelectedCoachId] = useState(() => localStorage.getItem('remocar_selected_coach') || 'sara');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('remocar_leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('remocar_cars');
    if (!saved) return INITIAL_CARS.map((car) => ({ ...car, unlocked: car.unlocked || Boolean(car.freeAtLevel && profile.level >= car.freeAtLevel) }));
    try {
      const savedCars = JSON.parse(saved) as Car[];
      return INITIAL_CARS.map((car) => {
        const previous = savedCars.find((entry) => entry.id === car.id);
        return {
          ...car,
          ...previous,
          requiredLevel: car.requiredLevel,
          freeAtLevel: car.freeAtLevel,
          unlocked: Boolean(car.freeAtLevel && profile.level >= car.freeAtLevel) || (previous?.unlocked ?? car.unlocked),
        };
      });
    } catch {
      return INITIAL_CARS;
    }
  });

  const [selectedCar, setSelectedCar] = useState<Car>(() => {
    return cars.find((c) => c.unlocked) || INITIAL_CARS[0];
  });

  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('remocar_tracks');
    if (!saved) return INITIAL_TRACKS.map((track) => ({ ...track, unlocked: track.unlocked || Boolean(track.requiredLevel && profile.level >= track.requiredLevel) }));
    try {
      const savedTracks = JSON.parse(saved) as Track[];
      return INITIAL_TRACKS.map((track) => {
        const previous = savedTracks.find((entry) => entry.id === track.id);
        return {
          ...track,
          ...previous,
          requiredLevel: track.requiredLevel,
          unlocked: track.unlocked || Boolean(track.requiredLevel && profile.level >= track.requiredLevel) || (previous?.unlocked ?? false),
        };
      });
    } catch {
      return INITIAL_TRACKS;
    }
  });

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(() => INITIAL_TRACKS[0]);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('remocar_upgrades');
    if (!saved) return INITIAL_UPGRADES.map((upgrade) => ({ ...upgrade }));
    try {
      const parsed: unknown = JSON.parse(saved);
      const savedUpgrades = Array.isArray(parsed) ? parsed as Upgrade[] : [];
      return INITIAL_UPGRADES.map((upgrade) => {
        const previous = savedUpgrades.find((entry) => entry.id === upgrade.id);
        if (!previous) return { ...upgrade };
        return {
          ...upgrade,
          level: Math.max(1, Math.min(upgrade.maxLevel, Math.floor(Number(previous.level) || 1))),
          cost: Math.max(upgrade.cost, Number(previous.cost) || upgrade.cost),
        };
      });
    } catch {
      return INITIAL_UPGRADES.map((upgrade) => ({ ...upgrade }));
    }
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
  const [multiplayerRoundResult, setMultiplayerRoundResult] = useState<LanTournamentResult | null>(null);
  const [multiplayerFinishedCount, setMultiplayerFinishedCount] = useState(0);
  const [multiplayerPlayerCount, setMultiplayerPlayerCount] = useState(0);
  const [multiplayerDidSubmit, setMultiplayerDidSubmit] = useState(false);
  const [multiplayerRaceKey, setMultiplayerRaceKey] = useState(0);

  useEffect(() => lanMultiplayer.subscribe((message) => {
    if (message.type === 'room_joined' || message.type === 'room_state') {
      if (Array.isArray(message.players)) setMultiplayerPlayerCount(message.players.length);
      return;
    }
    if (message.type === 'race_start') {
      setMultiplayerRoundResult(null);
      setMultiplayerFinishedCount(0);
      setMultiplayerDidSubmit(false);
      return;
    }
    if (message.type === 'round_progress') {
      if (typeof message.finishedCount === 'number') setMultiplayerFinishedCount(message.finishedCount);
      if (typeof message.playerCount === 'number') setMultiplayerPlayerCount(message.playerCount);
      return;
    }
    if (message.type === 'round_complete' || message.type === 'match_complete') {
      const result = message as unknown as LanTournamentResult;
      setMultiplayerRoundResult(result);
      setMultiplayerFinishedCount(result.finishOrder.length);
      setMultiplayerPlayerCount(result.finishOrder.length);
      if (result.type === 'match_complete' && result.winner?.playerId === lanMultiplayer.playerId) {
        playWinnerAnnouncement();
        setToastMessage('مبروك! أنت بطل بطولة REMOCAR عبر Wi‑Fi.');
      }
      return;
    }
    if (message.type === 'error') {
      setMultiplayerDidSubmit(false);
      setToastMessage(String(message.message ?? 'تعذر إكمال إجراء البطولة.'));
    }
  }), []);
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
    localStorage.setItem('remocar_selected_coach', selectedCoachId);
    localStorage.setItem('remocar_leaderboard', JSON.stringify(leaderboard));
    localStorage.setItem('remocar_game_preferences', JSON.stringify(preferences));
    localStorage.setItem('remocar_completed_career_events', JSON.stringify(completedCareerEventIds));
    if (replayFrames.length > 0) {
      localStorage.setItem('remocar_last_replay', JSON.stringify(replayFrames));
    }
  }, [coins, trophies, cars, tracks, upgrades, profile, leaderboard, replayFrames, selectedCoachId, preferences, completedCareerEventIds]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playBeep(440, 0.1);
  };

  const handleBuyCar = (car: Car) => {
    if (profile.level < (car.requiredLevel ?? 1)) {
      setToastMessage(`تُفتح هذه السيارة عند المستوى ${car.requiredLevel}. مستواك الحالي ${profile.level}.`);
      return;
    }
    if (coins >= car.price) {
      setCoins((c) => c - car.price);
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, unlocked: true } : c))
      );
      const unlockedCar = { ...car, unlocked: true };
      setSelectedCar(unlockedCar);
      setToastMessage(`تهانينا! تمتلك الآن سيارة ${car.name}`);
    } else {
      setToastMessage(`تحتاج إلى ${car.price - coins} عملة إضافية لشراء ${car.name}.`);
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

  const handleStartCareerEvent = (eventId: string) => {
    const event = CAREER_EVENTS.find((item) => item.id === eventId);
    if (!event) return;
    if (profile.level < event.requiredLevel) {
      setToastMessage(`تُفتح ${event.name} عند المستوى ${event.requiredLevel}.`);
      return;
    }
    const firstTrack = tracks.find((track) => track.id === event.trackIds[0]);
    if (!firstTrack) {
      setToastMessage('تعذر تحميل مسار البطولة. أعد تشغيل اللعبة وحاول مجدداً.');
      return;
    }
    setIsCareerEventsOpen(false);
    setIsMultiplayerRoom(false);
    setActiveCareerEvent({ id: event.id, round: 0 });
    setSelectedTrack(firstTrack);
    playCoachIntroduction(getSelectedCoach(selectedCoachId, profile.level).id);
    setSoloRaceKey((key) => key + 1);
    setScreen('game');
  };

  const handleFinishRace = (won: boolean, coinsEarned: number, frames: ReplayFrame[], lapTime: number) => {
    const raceRewardMultiplier = getLevelBenefits(profile.level).coinMultiplier;
    const finalEarned = Math.round(coinsEarned * (selectedTrack?.rewardMultiplier || 1) * raceRewardMultiplier);
    const newXp = profile.xp + (won ? 220 : 100);
    const newLevel = Math.max(profile.level, getLevelFromXp(newXp));
    const levelsGained = newLevel - profile.level;
    let levelCoins = 0;
    for (let level = profile.level + 1; level <= newLevel; level += 1) levelCoins += getLevelReward(level).coins;
    const unlockMessages = LEVEL_MILESTONES
      .filter((milestone) => milestone.level > profile.level && milestone.level <= newLevel)
      .map((milestone) => milestone.description);
    const levelStars = levelsGained;

    setCoins((current) => current + finalEarned + levelCoins);
    setTrophies((current) => current + (won ? 3 : 1) + levelStars);
    setProfile({ ...profile, xp: newXp, level: newLevel, title: getLevelTitle(newLevel) });
    if (levelsGained > 0) {
      setTracks((previous) => previous.map((track) => ({
        ...track,
        unlocked: track.unlocked || !track.requiredLevel || track.requiredLevel <= newLevel,
      })));
      setCars((previous) => previous.map((car) => ({
        ...car,
        unlocked: car.unlocked || Boolean(car.freeAtLevel && car.freeAtLevel <= newLevel),
      })));
      soundManager.playVictory();
    }
    if (won) {
      soundManager.playPodiumCelebration();
      playWinnerAnnouncement();
    }

    // Update Leaderboard & Ghost if better lap time
    const raceMessages = [`مكافأة السباق +${finalEarned} عملة`, ...(levelsGained > 0 ? [`المستوى ${newLevel} +${levelCoins} عملة و${levelStars} نجمة${unlockMessages.length ? ` · فتح: ${unlockMessages.join('، ')}` : ''}`] : [])];
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
        raceMessages.push(`رقم قياسي جديد في ${selectedTrack.name} (${lapTime.toFixed(2)} ث)`);
      }
    }
    setToastMessage(raceMessages.join(' — '));

    setReplayFrames(frames);
    setMissions((prev) =>
      prev.map((m) => (m.id === 'm1' ? { ...m, completed: true } : m))
    );
    if (activeCareerEvent) {
      const event = CAREER_EVENTS.find((item) => item.id === activeCareerEvent.id);
      if (event && won && activeCareerEvent.round < event.trackIds.length - 1) {
        const nextRound = activeCareerEvent.round + 1;
        const nextTrack = INITIAL_TRACKS.find((track) => track.id === event.trackIds[nextRound]);
        if (nextTrack) {
          setActiveCareerEvent({ id: event.id, round: nextRound });
          setSelectedTrack(nextTrack);
          playCoachIntroduction(getSelectedCoach(selectedCoachId, newLevel).id);
          setSoloRaceKey((key) => key + 1);
          setToastMessage(`${event.name} · الجولة ${nextRound + 1} من ${event.trackIds.length}: ${nextTrack.name}`);
          setScreen('game');
          return;
        }
      }
      if (event && won) {
        const firstCompletion = !completedCareerEventIds.includes(event.id);
        if (firstCompletion) {
          setCoins((current) => current + event.rewardCoins);
          setTrophies((current) => current + event.rewardStars);
          setCompletedCareerEventIds((current) => current.includes(event.id) ? current : [...current, event.id]);
        }
        setToastMessage(firstCompletion ? `اكتملت ${event.name}! مكافأة المسيرة: +${event.rewardCoins} عملة و${event.rewardStars} نجوم.` : `أعدت ${event.name} بنجاح؛ مكافأة الإعادة العادية محفوظة.`);
      } else if (event) {
        setToastMessage(`انتهت محاولة ${event.name}. أعد البطولة وحاول الفوز بكل جولة.`);
      }
      setActiveCareerEvent(null);
    }
    setScreen('menu');
  };

  const handleFinishMultiplayerRound = (lapTime: number) => {
    if (multiplayerDidSubmit) return;
    if (lanMultiplayer.finishRound(lapTime)) setMultiplayerDidSubmit(true);
    else setToastMessage('انقطع اتصال الغرفة؛ تعذر إرسال نتيجة الجولة.');
  };

  const handleStartNextMultiplayerRound = () => {
    if (!lanMultiplayer.startNextRound()) setToastMessage('تعذر بدء الجولة التالية. تأكد من أن الاتصال قائم وأنك المضيف.');
  };

  const handleExitMultiplayer = () => {
    lanMultiplayer.close();
    void stopAndroidLanHost();
    setIsMultiplayerRoom(false);
    setMultiplayerRoundResult(null);
    setMultiplayerDidSubmit(false);
    setScreen('menu');
  };

  if (showSplash) {
    return <SplashIntro onEnterGame={() => setShowSplash(false)} />;
  }

  const currentTrackLeaderboard = selectedTrack ? leaderboard.find((l) => l.trackId === selectedTrack.id) : undefined;
  const isImmersiveGame = screen === 'game' || screen === 'replay';

  return (
    <div className={isImmersiveGame
      ? 'fixed inset-0 z-40 h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white'
      : 'min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white pb-12'}>
      {/* Daily Reward Modal on App Load */}
      <DailyRewardModal onClaimReward={handleClaimDailyReward} />

      {/* Navbar */}
      {!isImmersiveGame && <Navbar
        coins={coins}
        trophies={trophies}
        profileLevel={profile.level}
        carCount={cars.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNavigate={(s) => setScreen(s as any)}
        currentScreen={screen}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />}

      {/* Main Content Screens */}
      <main className={isImmersiveGame ? 'h-full w-full overflow-hidden pt-0' : 'pt-4'}>
        {screen === 'menu' && (
          <MainMenu
            selectedCar={selectedCar}
            playerName={profile.name}
            profileLevel={profile.level}
            profileXp={profile.xp}
            stars={trophies}
            carsCount={cars.length}
            tracksCount={tracks.length}
            selectedCoachId={selectedCoachId}
            onSelectCoach={(coachId) => setSelectedCoachId(coachId)}
            onPlayCoachVoice={playCoachIntroduction}
            hasReplay={replayFrames.length > 0}
            onNavigate={(s) => setScreen(s)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
            onOpenCareerEvents={() => setIsCareerEventsOpen(true)}
          />
        )}

        {screen === 'garage' && (
          <Garage
            cars={cars}
            selectedCar={selectedCar}
            coins={coins}
            playerLevel={profile.level}
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
            playerLevel={profile.level}
            onSelectTrack={(track) => {
              setIsMultiplayerRoom(false);
              playCoachIntroduction(getSelectedCoach(selectedCoachId, profile.level).id);
              setSelectedTrack(track);
              setScreen('game');
            }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'game' && selectedTrack && (
          <React.Suspense fallback={<div className="grid h-full min-h-0 place-items-center text-amber-300">جارٍ تحميل محرك السباق ثلاثي الأبعاد…</div>}>
            <GameCanvas
              key={isMultiplayerRoom ? `lan-round-${multiplayerRaceKey}` : `solo-${selectedTrack.id}-${soloRaceKey}`}
              car={selectedCar}
              track={selectedTrack}
              profile={profile}
              preferences={preferences}
              coach={getSelectedCoach(selectedCoachId, profile.level)}
              upgrades={upgrades}
              leaderboardEntry={currentTrackLeaderboard}
              isReplayMode={false}
              isMultiplayerRoom={isMultiplayerRoom}
              multiplayerRound={lanMultiplayer.round}
              multiplayerRoundsTotal={lanMultiplayer.roundsTotal}
              multiplayerResult={multiplayerRoundResult}
              multiplayerFinishedCount={multiplayerFinishedCount}
              multiplayerPlayerCount={multiplayerPlayerCount}
              multiplayerDidSubmit={multiplayerDidSubmit}
              multiplayerIsHost={lanMultiplayer.isHost}
              onFinishRace={handleFinishRace}
              onFinishMultiplayerRound={handleFinishMultiplayerRound}
              onStartNextMultiplayerRound={handleStartNextMultiplayerRound}
              onExitMultiplayer={handleExitMultiplayer}
              onQuit={() => { if (isMultiplayerRoom) { lanMultiplayer.close(); void stopAndroidLanHost(); } setActiveCareerEvent(null); setIsMultiplayerRoom(false); setMultiplayerRoundResult(null); setMultiplayerDidSubmit(false); setScreen('tracks'); }}
            />
          </React.Suspense>
        )}

        {screen === 'replay' && selectedTrack && (
          <React.Suspense fallback={<div className="grid h-full min-h-0 place-items-center text-amber-300">جارٍ تحميل إعادة السباق…</div>}>
            <GameCanvas
              car={selectedCar}
              track={selectedTrack}
              profile={profile}
              preferences={preferences}
              coach={getSelectedCoach(selectedCoachId, profile.level)}
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
          setMultiplayerRaceKey((key) => key + 1);
          setMultiplayerRoundResult(null);
          setMultiplayerDidSubmit(false);
          playCoachIntroduction(getSelectedCoach(selectedCoachId, profile.level).id);
          const roomTrack = MULTIPLAYER_TRACKS.find((track) => track.id === trackId) || tracks[0];
          setSelectedTrack(roomTrack);
          setIsMultiplayerRoom(true);
          setScreen('game');
          setToastMessage(`بدأت الجولة ${lanMultiplayer.round} من ${lanMultiplayer.roundsTotal} على ${roomTrack.name} (غرفة ${code}).`);
        }}
      />

      <PlayerProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        stars={trophies}
        onUpdateProfile={(newName) => setProfile({ ...profile, name: newName })}
        onClose={() => setIsProfileOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        tracks={tracks}
        leaderboard={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onChange={setPreferences}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <CareerEventsModal
        isOpen={isCareerEventsOpen}
        onClose={() => setIsCareerEventsOpen(false)}
        events={CAREER_EVENTS}
        tracks={tracks}
        playerLevel={profile.level}
        completedEventIds={completedCareerEventIds}
        onStart={handleStartCareerEvent}
      />
    </div>
  );
}
