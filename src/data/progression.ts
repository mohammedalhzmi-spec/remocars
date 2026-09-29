export interface LevelBenefits {
  speedMultiplier: number;
  accelerationMultiplier: number;
  handlingMultiplier: number;
  nitroCapacity: number;
  nitroMultiplier: number;
  coinMultiplier: number;
  speedBonusPct: number;
  accelerationBonusPct: number;
  handlingBonusPct: number;
  nitroBonusPct: number;
}

export interface LevelMilestone {
  level: number;
  unlockTrackId?: string;
  unlockCarId?: string;
  description: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 2, unlockTrackId: 'city_ring', description: 'حلبة المدينة الحديثة' },
  { level: 3, unlockCarId: 'remocar_lumen_gt', description: 'شراء سيارة REMOCAR Lumen GT' },
  { level: 4, unlockTrackId: 'desert_canyon', description: 'طريق الأخاديد الصحراوية' },
  { level: 5, unlockCarId: 'remocar_drift_neo', description: 'مرشدة السباق دانا وسيارة REMOCAR Drift Neo مجانية' },
  { level: 6, unlockTrackId: 'forest_rally', description: 'مضمار الرالي الحرجي' },
  { level: 8, unlockTrackId: 'volcano_night', description: 'حلبة بركان منتصف الليل وشراء Vortex RS' },
  { level: 10, description: 'مرشدة الأبطال ريم ومكافأة البطل' },
  { level: 15, description: 'مرشدة الجائزة الكبرى ليان ولقب أسطورة REMOCAR' },
];

export function xpRequiredForNextLevel(level: number) {
  return Math.max(1, Math.floor(level)) * 500;
}

export function getLevelFromXp(totalXp: number) {
  let level = 1;
  while (level < 99 && totalXp >= xpRequiredForNextLevel(level)) level += 1;
  return level;
}

export function getLevelBenefits(level: number): LevelBenefits {
  const steps = Math.max(0, Math.min(15, Math.floor(level) - 1));
  const speedBonusPct = steps * 1.5;
  const accelerationBonusPct = steps * 1.2;
  const handlingBonusPct = steps * 0.8;
  return {
    speedMultiplier: 1 + speedBonusPct / 100,
    accelerationMultiplier: 1 + accelerationBonusPct / 100,
    handlingMultiplier: 1 + handlingBonusPct / 100,
    nitroCapacity: 100 + steps * 4,
    nitroMultiplier: 1.48 + steps * 0.012,
    coinMultiplier: 1 + Math.min(0.5, steps * 0.03),
    speedBonusPct,
    accelerationBonusPct,
    handlingBonusPct,
    nitroBonusPct: steps * 4,
  };
}

export function getLevelTitle(level: number) {
  if (level >= 15) return 'أسطورة REMOCAR';
  if (level >= 10) return 'بطل السباقات';
  if (level >= 8) return 'أسطورة الطرق';
  if (level >= 5) return 'بطل الحلبة';
  if (level >= 3) return 'متسابق محترف';
  if (level >= 2) return 'متسابق ناشئ';
  return 'متسابق مبتدئ';
}

export function getLevelReward(level: number) {
  const safeLevel = Math.max(2, Math.floor(level));
  return { coins: 150 + safeLevel * 50, stars: 1 };
}

export function getNextMilestone(level: number) {
  return LEVEL_MILESTONES.find((milestone) => milestone.level > level) ?? null;
}
