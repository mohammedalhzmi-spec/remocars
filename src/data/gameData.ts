import { Car, Track, Upgrade } from '../types';

export const INITIAL_CARS: Car[] = [
  {
    id: 'speedster',
    name: 'سوبركار GT-R3',
    description: 'سيارة سباق انسيابية ثلاثية الأبعاد بتصميم واقعي ومحرك توربو فائق السرعة.',
    speed: 78,
    acceleration: 82,
    handling: 75,
    color: '#dc2626', // Vibrant Red
    secondaryColor: '#1e293b',
    price: 0,
    unlocked: true,
    imageIcon: '🏎️',
    modelType: 'sport'
  },
  {
    id: 'drifter',
    name: 'نيون دريفت إكس',
    description: 'سيارة مخصصة للانجراف الحاد مع إضاءة نيون تحت الهيكل وثبات استثنائي.',
    speed: 72,
    acceleration: 78,
    handling: 96,
    color: '#2563eb', // Electric Blue
    secondaryColor: '#38bdf8',
    price: 500,
    unlocked: false,
    imageIcon: '🚙',
    modelType: 'drift'
  },
  {
    id: 'monster',
    name: 'بيج فوت مونستر ترَك',
    description: 'شاحنة عملاقة ذات إطارات ضخمة ونظام تعليق هيدروليكي يتجاوز كل الحواجز.',
    speed: 68,
    acceleration: 92,
    handling: 65,
    color: '#059669', // Emerald Green
    secondaryColor: '#f59e0b',
    price: 1200,
    unlocked: false,
    imageIcon: '🚚',
    modelType: 'monster'
  },
  {
    id: 'cyberbolt',
    name: 'سايبر فيراري فانتوم',
    description: 'تحفة هندسية مستقبلية مزودة بألياف الكربون ودفعة نيترو صاروخية.',
    speed: 96,
    acceleration: 95,
    handling: 90,
    color: '#7c3aed', // Purple
    secondaryColor: '#06b6d4',
    price: 3000,
    unlocked: false,
    imageIcon: '⚡',
    modelType: 'cyber'
  }
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'city_circuit',
    name: 'حلبة الأفق الحضري',
    difficulty: 'سهل',
    background: 'from-slate-900 to-indigo-950',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'desert_rally',
    name: 'رالي الكثبان الذهبية',
    difficulty: 'متوسط',
    background: 'from-amber-800 to-yellow-950',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'neon_cyber',
    name: 'مضمار سايبر نيون السريع',
    difficulty: 'صعب',
    background: 'from-purple-950 via-slate-900 to-pink-950',
    laps: 4,
    unlocked: true,
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
    name: 'محرك V8 توربو مضاعف',
    level: 1,
    maxLevel: 5,
    cost: 200,
    bonus: 10,
    description: 'يزيد السرعة القصوى بنسبة 10% لكل مستوى.'
  },
  {
    id: 'nitro',
    name: 'نظام نيترو صاروخي متطور',
    level: 1,
    maxLevel: 5,
    cost: 150,
    bonus: 15,
    description: 'يضاعف قوة ومدة دفعة النيترو.'
  },
  {
    id: 'tires',
    name: 'إطارات سباق احترافية Grip+',
    level: 1,
    maxLevel: 5,
    cost: 180,
    bonus: 12,
    description: 'يحسن التحكم والثبات ومقاومة الانزلاق تحت المطر.'
  }
];
