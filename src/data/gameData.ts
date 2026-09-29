import { Car, Track, Upgrade } from '../types';

export const INITIAL_CARS: Car[] = [
  {
    id: 'ferrari_sf90',
    name: 'فيراري SF90 سترادالي',
    description: 'تحفة إيطالية خارقة تجمع بين محرك V8 وتكنولوجيا الفورمولا 1.',
    speed: 92,
    acceleration: 94,
    handling: 88,
    color: '#dc2626', // Ferrari Red
    secondaryColor: '#0f172a',
    price: 0,
    unlocked: true,
    imageIcon: '🏎️',
    modelType: 'sport'
  },
  {
    id: 'lamborghini_revuelto',
    name: 'لامبورغيني ريفويلتو الهجينة',
    description: 'قوة هائلة بتصميم مستوحى من طائرات الفضاء المقاتلة.',
    speed: 95,
    acceleration: 96,
    handling: 85,
    color: '#f59e0b', // Lamborghini Orange
    secondaryColor: '#18181b',
    price: 800,
    unlocked: false,
    imageIcon: '⚡',
    modelType: 'sport'
  },
  {
    id: 'bugatti_chiron',
    name: 'بوغاتي تشيرون سوبر سبورت',
    description: 'أيقونة السرعة المطلقة في العالم بمحرك W16 رباعي التوربو.',
    speed: 99,
    acceleration: 98,
    handling: 80,
    color: '#2563eb', // Bugatti Blue
    secondaryColor: '#ffffff',
    price: 2500,
    unlocked: false,
    imageIcon: '🚀',
    modelType: 'sport'
  },
  {
    id: 'porsche_911_gt3',
    name: 'بورش 911 GT3 RS',
    description: 'ملكة الحلبات الألمانية بديناميكية هوائية خارقة وثبات أسطوري.',
    speed: 88,
    acceleration: 90,
    handling: 98,
    color: '#ffffff', // Porsche White
    secondaryColor: '#1e293b',
    price: 1500,
    unlocked: false,
    imageIcon: '🏁',
    modelType: 'drift'
  },
  {
    id: 'mclaren_720s',
    name: 'ماكلارين 720S سبايدر',
    description: 'خفة وزن مذهلة وتسارع صاروخي وهيكل من ألياف الكربون.',
    speed: 94,
    acceleration: 95,
    handling: 92,
    color: '#f97316', // Papaya Orange
    secondaryColor: '#111827',
    price: 2000,
    unlocked: false,
    imageIcon: '🔥',
    modelType: 'sport'
  },
  {
    id: 'bmw_m4_competition',
    name: 'بي إم دبليو M4 كومبيتيشن',
    description: 'سيارة كوبيه رياضية شرسة ذات أداء استثنائي على الأسفلت.',
    speed: 84,
    acceleration: 86,
    handling: 90,
    color: '#3b82f6', // Marina Bay Blue
    secondaryColor: '#0f172a',
    price: 1000,
    unlocked: false,
    imageIcon: '🚙',
    modelType: 'drift'
  },
  {
    id: 'audi_r8_v10',
    name: 'أودي R8 V10 بيرفورمانس',
    description: 'أداء ألماني نقي بنغمة محرك تنفس طبيعي لا تقاوم.',
    speed: 89,
    acceleration: 89,
    handling: 91,
    color: '#64748b', // Daytona Gray
    secondaryColor: '#ef4444',
    price: 1400,
    unlocked: false,
    imageIcon: '🚘',
    modelType: 'sport'
  },
  {
    id: 'mercedes_amg_one',
    name: 'مرسيدس AMG One فورمولا',
    description: 'محرك سيارة سباق فورمولا 1 حقيقي مرخص للطرقات العامة.',
    speed: 97,
    acceleration: 97,
    handling: 94,
    color: '#06b6d4', // Petronas Cyan
    secondaryColor: '#18181b',
    price: 3500,
    unlocked: false,
    imageIcon: '💫',
    modelType: 'cyber'
  },
  {
    id: 'aston_martin_valkyrie',
    name: 'أستون مارتن فالقري الخارقة',
    description: 'تعاون أسطوري بين أستون مارتن وريد بول لتصميم طائرة أرضية.',
    speed: 98,
    acceleration: 99,
    handling: 95,
    color: '#047857', // British Racing Green
    secondaryColor: '#fbbf24',
    price: 4000,
    unlocked: false,
    imageIcon: '🌟',
    modelType: 'cyber'
  },
  {
    id: 'koenigsegg_jesko',
    name: 'كوينيجسيغ يسكو أبسلوت',
    description: 'الوحش السويدي الأسرع في التاريخ بسرعة قصوى تتخطى 500 كم/س.',
    speed: 100,
    acceleration: 100,
    handling: 93,
    color: '#9333ea', // Jesko Purple
    secondaryColor: '#ffffff',
    price: 5000,
    unlocked: false,
    imageIcon: '👑',
    modelType: 'cyber'
  }
];

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
    id: 'neon_cyber',
    name: 'مضمار سايبر نيون المستقبلي',
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
