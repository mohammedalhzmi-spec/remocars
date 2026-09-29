import React, { useState, useEffect } from 'react';
import { Car, Track, Upgrade } from './types';
import { INITIAL_CARS, INITIAL_TRACKS, INITIAL_UPGRADES } from './data/gameData';
import { Navbar } from './components/Navbar';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { TrackSelect } from './components/TrackSelect';
import { GameCanvas } from './components/GameCanvas';
import { SyncModal } from './components/SyncModal';
import { InstructionsModal } from './components/InstructionsModal';
import { soundManager } from './audio';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'garage' | 'tracks' | 'game'>('menu');
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('remocar_coins');
    return saved ? parseInt(saved, 10) : 350;
  });
  const [trophies, setTrophies] = useState<number>(() => {
    const saved = localStorage.getItem('remocar_trophies');
    return saved ? parseInt(saved, 10) : 2;
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

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('remocar_upgrades');
    return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('remocar_coins', coins.toString());
    localStorage.setItem('remocar_trophies', trophies.toString());
    localStorage.setItem('remocar_cars', JSON.stringify(cars));
    localStorage.setItem('remocar_tracks', JSON.stringify(tracks));
    localStorage.setItem('remocar_upgrades', JSON.stringify(upgrades));
  }, [coins, trophies, cars, tracks, upgrades]);

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
    }
  };

  const handleFinishRace = (won: boolean, coinsEarned: number) => {
    setCoins((c) => c + coinsEarned);
    if (won) {
      setTrophies((t) => t + 1);
      soundManager.playVictory();
    }
    setScreen('menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white pb-12">
      {/* Navbar */}
      <Navbar
        coins={coins}
        trophies={trophies}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNavigate={(s) => setScreen(s)}
        currentScreen={screen}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Screens */}
      <main className="pt-4">
        {screen === 'menu' && (
          <MainMenu
            selectedCar={selectedCar}
            onNavigate={(s) => setScreen(s)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
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
            onFinishRace={handleFinishRace}
            onQuit={() => setScreen('tracks')}
          />
        )}
      </main>

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
    </div>
  );
}
