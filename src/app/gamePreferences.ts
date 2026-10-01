import { GamePreferences } from '../types';

export const DEFAULT_GAME_PREFERENCES: GamePreferences = {
  steeringMode: 'buttons',
  steeringSensitivity: 1,
  controlSize: 'normal',
  graphicsQuality: 'balanced',
};

export function readGamePreferences(): GamePreferences {
  if (typeof window === 'undefined') return DEFAULT_GAME_PREFERENCES;
  try {
    const raw = window.localStorage.getItem('remocar_game_preferences');
    if (!raw) return DEFAULT_GAME_PREFERENCES;
    const saved = JSON.parse(raw) as Partial<GamePreferences>;
    const sensitivity = Number(saved.steeringSensitivity);
    return {
      steeringMode: saved.steeringMode === 'tilt' ? 'tilt' : 'buttons',
      steeringSensitivity: Number.isFinite(sensitivity) ? Math.max(0.5, Math.min(1.5, sensitivity)) : 1,
      controlSize: saved.controlSize === 'small' || saved.controlSize === 'large' ? saved.controlSize : 'normal',
      graphicsQuality: saved.graphicsQuality === 'performance' ? 'performance' : 'balanced',
    };
  } catch {
    return DEFAULT_GAME_PREFERENCES;
  }
}
