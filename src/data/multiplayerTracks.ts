import { Track } from '../types';

export const MULTIPLAYER_TRACKS: Track[] = [
  { id: 'mp_desert_canyon', name: 'وادي السراب · سباق فرق', difficulty: 'محترف', background: 'from-amber-900 via-orange-950 to-slate-950', laps: 3, unlocked: true, rewardMultiplier: 2.2 },
  { id: 'mp_neon_docks', name: 'رصيف النيون · مواجهة ليلية', difficulty: 'صعب', background: 'from-cyan-950 via-indigo-950 to-slate-950', laps: 4, unlocked: true, rewardMultiplier: 2.4 },
  { id: 'mp_forest_sprint', name: 'غابة الصنوبر · سرعة قصوى', difficulty: 'محترف', background: 'from-emerald-950 via-green-950 to-slate-950', laps: 3, unlocked: true, rewardMultiplier: 2.0 },
  { id: 'mp_mountain_pass', name: 'ممر القمم · تحدي الثلج', difficulty: 'ملحمي طويل', background: 'from-sky-900 via-blue-950 to-slate-950', laps: 4, unlocked: true, isLongTrack: true, rewardMultiplier: 2.8 },
  { id: 'mp_stunt_ridge', name: 'حافة القمم · قفزات البطولة', difficulty: 'محترف', background: 'from-sky-800 via-indigo-950 to-slate-950', laps: 3, unlocked: true, isStuntTrack: true, rewardMultiplier: 2.7 },
];
