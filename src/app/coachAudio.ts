import { RACE_COACHES } from '../data/raceCoaches';

let activeVoice: HTMLAudioElement | null = null;

function playClip(source: string) {
  if (typeof window === 'undefined') return;
  try {
    activeVoice?.pause();
    const voice = new Audio(source);
    voice.preload = 'auto';
    voice.volume = 0.92;
    activeVoice = voice;
    void voice.play().catch(() => {
      // A browser may require a fresh tap before speech playback; the on-screen coach tip remains available.
    });
  } catch {
    // Never let an optional voice line affect gameplay.
  }
}

export function playCoachIntroduction(coachId: string) {
  const coach = RACE_COACHES.find((item) => item.id === coachId) ?? RACE_COACHES[0];
  playClip(coach.introAudio);
}

export function playWinnerAnnouncement() {
  playClip('/audio/victory.mp3');
}

export function stopCoachVoice() {
  activeVoice?.pause();
  if (activeVoice) activeVoice.currentTime = 0;
  activeVoice = null;
}
