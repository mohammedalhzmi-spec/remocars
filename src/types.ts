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
}

export interface Track {
  id: string;
  name: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب' | 'محترف' | 'تحدي الدريفت';
  background: string;
  laps: number;
  unlocked: boolean;
  recordTime?: number;
  isDriftMode?: boolean;
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
