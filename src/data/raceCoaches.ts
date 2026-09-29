export interface RaceCoach {
  id: string;
  name: string;
  requiredLevel: number;
  title: string;
  bio: string;
  hint: string;
  portrait: string;
  introAudio: string;
}

export const RACE_COACHES: RaceCoach[] = [
  {
    id: 'sara', name: 'سارة', requiredLevel: 1, title: 'مرشدة الانطلاق',
    bio: 'مدرّبة ودودة تساعدك على أساسيات القيادة النظيفة.',
    hint: 'خفف السرعة قبل المنعطف، واستخدم النيترو عند الخروج منه.',
    portrait: '/coaches/sara.webp', introAudio: '/audio/sara.mp3',
  },
  {
    id: 'dana', name: 'دانا', requiredLevel: 5, title: 'استراتيجية المحترفين',
    bio: 'خبيرة في اختيار خط السباق والتوقيت المثالي للنيترو.',
    hint: 'حافظ على خط القيادة وخذ المنعطف من الخارج إلى الداخل.',
    portrait: '/coaches/dana.webp', introAudio: '/audio/dana.mp3',
  },
  {
    id: 'reem', name: 'ريم', requiredLevel: 10, title: 'مدرّبة الأبطال',
    bio: 'مرشدة البطولة؛ توازن بين السرعة وإدارة حرارة المحرك.',
    hint: 'راقب الحرارة وأجّل النيترو حتى نهاية المنعطف.',
    portrait: '/coaches/reem.webp', introAudio: '/audio/reem.mp3',
  },
  {
    id: 'layan', name: 'ليان', requiredLevel: 15, title: 'مرشدة الجائزة الكبرى',
    bio: 'استراتيجية خبيرة ترافقك في تحديات الجولات والنهائيات.',
    hint: 'خطط للفة الأخيرة من البداية؛ الدقة والتوقيت يصنعان البطل.',
    portrait: '/coaches/layan.webp', introAudio: '/audio/layan.mp3',
  },
];

export function getUnlockedCoaches(level: number) {
  return RACE_COACHES.filter((coach) => coach.requiredLevel <= level);
}

export function getSelectedCoach(id: string, level: number) {
  return getUnlockedCoaches(level).find((coach) => coach.id === id) ?? RACE_COACHES[0];
}
