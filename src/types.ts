export interface Car {
  id: string;
  name: string;
  description: string;
  speed: number;
  acceleration: number;
  handling: number;
  color: string;
  secondaryColor: string;
  price: number;
  unlocked: boolean;
  imageIcon: string;
}

export interface Track {
  id: string;
  name: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  background: string;
  laps: number;
  unlocked: boolean;
  recordTime?: number;
}

export interface Upgrade {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  bonus: number;
  description: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlType: 'keyboard' | 'buttons';
}
