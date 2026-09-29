import { Car, Track, Upgrade } from '../types';

export const INITIAL_CARS: Car[] = [
  {
    id: 'speedster',
    name: 'ريموت ستيدستر',
    description: 'سيارة سريعة وخفيفة الوزن، مصممة للانطلاق السريع على الطرق المستقيمة.',
    speed: 75,
    acceleration: 80,
    handling: 70,
    color: '#ef4444', // Red
    secondaryColor: '#1f2937',
    price: 0,
    unlocked: true,
    imageIcon: '🏎️'
  },
  {
    id: 'drifter',
    name: 'دريفت كينغ',
    description: 'ملكة الانجراف (Drift)، تمتلك ثباتاً رائعاً في المنعطفات الحادة.',
    speed: 70,
    acceleration: 75,
    handling: 95,
    color: '#3b82f6', // Blue
    secondaryColor: '#ffffff',
    price: 500,
    unlocked: false,
    imageIcon: '🚙'
  },
  {
    id: 'monster',
    name: 'مونستر ترَك برو',
    description: 'شاحنة عملاقة لا توقفها العقبات ولا الصدمات القوية.',
    speed: 65,
    acceleration: 90,
    handling: 60,
    color: '#10b981', // Emerald
    secondaryColor: '#fbbf24',
    price: 1200,
    unlocked: false,
    imageIcon: '🚚'
  },
  {
    id: 'cyberbolt',
    name: 'سايبر بولت',
    description: 'سيارة مستقبلية فائقة التكنولوجيا مزودة بنظام نيترو مضاعف.',
    speed: 95,
    acceleration: 95,
    handling: 85,
    color: '#8b5cf6', // Purple
    secondaryColor: '#06b6d4',
    price: 3000,
    unlocked: false,
    imageIcon: '⚡'
  }
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'city_circuit',
    name: 'حلبة المدينة الإسفلتية',
    difficulty: 'سهل',
    background: 'from-slate-800 to-indigo-950',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'desert_rally',
    name: 'رالي الكثبان الرملية',
    difficulty: 'متوسط',
    background: 'from-amber-700 to-yellow-900',
    laps: 3,
    unlocked: true,
  },
  {
    id: 'neon_night',
    name: 'مضمار نيون الليلي',
    difficulty: 'صعب',
    background: 'from-purple-900 via-indigo-950 to-pink-950',
    laps: 4,
    unlocked: false,
    recordTime: 45.2
  },
  {
    id: 'stadium_arena',
    name: 'ملعب الأبطال المغلق',
    difficulty: 'صعب',
    background: 'from-zinc-950 to-neutral-900',
    laps: 5,
    unlocked: false,
  }
];

export const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'engine',
    name: 'محرك توربو متطور',
    level: 1,
    maxLevel: 5,
    cost: 200,
    bonus: 10,
    description: 'يزيد السرعة القصوى للسيارة بنسبة 10% لكل مستوى.'
  },
  {
    id: 'nitro',
    name: 'خزان نيترو إضافي',
    level: 1,
    maxLevel: 5,
    cost: 150,
    bonus: 15,
    description: 'يضاعف مدة وقوة دفعة النيترو.'
  },
  {
    id: 'tires',
    name: 'إطارات سباق لاصقة',
    level: 1,
    maxLevel: 5,
    cost: 180,
    bonus: 12,
    description: 'يحسن التحكم والثبات أثناء المنعطفات السريعة.'
  }
];
