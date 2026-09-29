import { Car, Track, Upgrade } from '../types';
import { INITIAL_CARS } from './gameDataBase';

export { INITIAL_CARS };

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'coastal_highway',
    name: 'طريق الألف ميل الساحلي (طويل وشبه واقعي)',
    difficulty: 'ملحمي طويل',
    background: 'from-sky-900 via-teal-950 to-slate-950',
    laps: 6,
    unlocked: true,
    isLongTrack: true,
    rewardMultiplier: 2.5,
  },
  {
    id: 'river_valley',
    name: 'وادي الأنهار المتعرجة الطبيعي',
    difficulty: 'محترف',
    background: 'from-emerald-900 via-slate-900 to-teal-950',
    laps: 4,
    unlocked: true,
    isLongTrack: true,
    rewardMultiplier: 2.0,
  },
  {
    id: 'snowy_pass',
    name: 'طريق الجبال الثلجية الفخمة',
    difficulty: 'صعب',
    background: 'from-slate-800 via-blue-950 to-indigo-950',
    laps: 4,
    unlocked: true,
    rewardMultiplier: 1.8,
  },
  {
    id: 'drift_arena',
    name: 'حلبة تحدي الدريفت المظلمة',
    difficulty: 'تحدي الدريفت',
    background: 'from-purple-950 via-rose-950 to-slate-950',
    laps: 5,
    unlocked: true,
    isDriftMode: true,
    rewardMultiplier: 3.0,
  },
  {
    id: 'city_ring',
    name: 'حلبة المدينة الحديثة',
    difficulty: 'متوسط',
    background: 'from-indigo-950 via-slate-900 to-blue-950',
    laps: 3,
    unlocked: false,
    requiredLevel: 2,
    rewardMultiplier: 1.65,
  },
  {
    id: 'desert_canyon',
    name: 'طريق الأخاديد الصحراوية',
    difficulty: 'صعب',
    background: 'from-amber-950 via-orange-950 to-slate-950',
    laps: 4,
    unlocked: false,
    requiredLevel: 4,
    rewardMultiplier: 2.05,
  },
  {
    id: 'forest_rally',
    name: 'مضمار الرالي الحرجي',
    difficulty: 'محترف',
    background: 'from-green-950 via-emerald-950 to-slate-950',
    laps: 4,
    unlocked: false,
    requiredLevel: 6,
    rewardMultiplier: 2.25,
  },
  {
    id: 'volcano_night',
    name: 'حلبة بركان منتصف الليل',
    difficulty: 'ملحمي طويل',
    background: 'from-slate-950 via-red-950 to-orange-950',
    laps: 5,
    unlocked: false,
    requiredLevel: 8,
    rewardMultiplier: 2.8,
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
