import { Track } from '../types';

export interface CareerEvent {
  id: string;
  name: string;
  subtitle: string;
  requiredLevel: number;
  trackIds: string[];
  rewardCoins: number;
  rewardStars: number;
}

export const CAREER_EVENTS: CareerEvent[] = [
  {
    id: 'coastal_cup',
    name: 'كأس الساحل',
    subtitle: 'ثلاث جولات تأسيسية تجمع السرعة والثبات والدريفت.',
    requiredLevel: 1,
    trackIds: ['coastal_highway', 'river_valley', 'drift_arena'],
    rewardCoins: 450,
    rewardStars: 1,
  },
  {
    id: 'mirage_air_cup',
    name: 'كأس السراب الجوي',
    subtitle: 'ثلاثة مسارات مرتفعة وقفزات تحتاج توقيتاً دقيقاً.',
    requiredLevel: 3,
    trackIds: ['desert_stunt_dunes', 'city_sky_bridge', 'canyon_stunt_circuit'],
    rewardCoins: 950,
    rewardStars: 2,
  },
  {
    id: 'grand_remocar_cup',
    name: 'كأس REMOCAR الكبرى',
    subtitle: 'نهائي من الجبال والبركان وحلبة النيون.',
    requiredLevel: 8,
    trackIds: ['forest_rally', 'volcano_night', 'neon_stadium_loop'],
    rewardCoins: 1800,
    rewardStars: 3,
  },
];

export function getCareerEventTracks(event: CareerEvent, tracks: Track[]): Track[] {
  return event.trackIds.map((id) => tracks.find((track) => track.id === id)).filter((track): track is Track => Boolean(track));
}
