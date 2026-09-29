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
  modelType: 'sport' | 'drift' | 'monster' | 'cyber';
  customization?: CarCustomization;
}

export interface CarCustomization {
  pattern: 'solid' | 'stripes' | 'flames' | 'geometric';
  plateText: string;
  decalDataUrl?: string;
}

export interface Track {
  id: string;
  name: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب' | 'محترف' | 'تحدي الدريفت' | 'ملحمي طويل';
  background: string;
  laps: number;
  unlocked: boolean;
  recordTime?: number;
  isDriftMode?: boolean;
  isLongTrack?: boolean;
  rewardMultiplier: number;
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

export interface ReplayFrame {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export interface LeaderboardEntry {
  trackId: string;
  playerName: string;
  bestTime: number; // in seconds
  date: string;
  ghostFrames: ReplayFrame[];
}

export interface PlayerProfile {
  name: string;
  level: number;
  xp: number;
  title: string;
}
