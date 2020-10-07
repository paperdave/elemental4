import {Howl, Howler} from 'howler';
import { getTheme } from './theme';

export type SoundId = 'combine' | 'invalid' | 'pickup' | 'valid' | 'drop';

let loadedSounds = new Map<string, Howl>();

export function clearSounds() {
  loadedSounds.forEach(x => {
    x.stop();
    x.unload();
  });

  loadedSounds = new Map<string, Howl>();
}

export function initializeMusic() {
  
}

export function playSound(x: SoundId) {
  const howl = loadedSounds.get(x);
  howl.play();
}

export async function loadSounds() {
  const theme = getTheme();
  Object.keys(theme.sounds).forEach((key) => {
    loadedSounds.set(key, new Howl({
      src: theme.sounds[key],
      preload: true,
    }))
  });
}
