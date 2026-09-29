import { Car, Track, Upgrade } from '../types';
import { INITIAL_CARS } from './gameDataBase';

export { INITIAL_CARS };

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'city_circuit',
    name: 'حلبة الأفق الحضري النيون',
    difficulty: 'سهل',
    background: 'from-slate-900 to-indigo-950',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'desert_rally',
    name: 'رالي الكثبان الذهبية الوعر',
    difficulty: 'متوسط',
    background: 'from-amber-800 to-yellow-950',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'drift_arena',
    name: 'حلبة تحدي الدريفت المظلمة (Drift Challenge)',
    difficulty: 'تحدي الدريفت',
    background: 'from-purple-950 via-rose-950 to-slate-950',
    laps: 5,
    unlocked: true,
    isDriftMode: true,
  },
  {
    id: 'mountain_serpent',
    name: 'منعطفات جبل الألب الخطرة',
    difficulty: 'محترف',
    background: 'from-zinc-950 via-stone-900 to-slate-900',
    laps: 5,
    unlocked: true,
  }
];

export const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'engine',
    name: 'محرك تيتانيوم توربو مزدوج',
    level: 1,
    maxLevel: 5,
    cost: 250,
    bonus: 10,
    description: 'يزيد السرعة القصوى للسيارة بنسبة 10% لكل مستوى.'
  },
  {
    id: 'nitro',
    name: 'نظام نيترو صاروخي مضاعف',
    level: 1,
    maxLevel: 5,
    cost: 200,
    bonus: 15,
    description: 'يضاعف قوة ومدة دفعة النيترو أثناء السباق.'
  },
  {
    id: 'tires',
    name: 'إطارات سباق احترافية Slick Grip',
    level: 1,
    maxLevel: 5,
    cost: 220,
    bonus: 12,
    description: 'يحسن الثبات ويقلل الانزلاق في المنعطفات والطقس الممطر.'
  }
];
