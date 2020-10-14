import { randomOf } from '@reverse/random';
import { Howl, Howler } from 'howler';
import { getTheme } from './theme';
import { sounds } from '../../workshop/themes/elem4_default/elemental.json';
export type SoundId = keyof typeof sounds;

let loadedSounds = new Map<string, Howl>();
let soundEvents = new Map<string, string[]>();

export function clearSounds() {
  loadedSounds.forEach(x => {
    x.stop();
    x.unload();
  });

  loadedSounds = new Map<string, Howl>();
}

export function initializeMusic() {
  
}

export function getNextMusic() {
  
}

export function playSound(x: SoundId) {
  const array = soundEvents.get(x);
  if(!array) return;
  const sound = randomOf(array);
  const howl = loadedSounds.get(sound);
  if(howl) {
    howl.play();
  }
}

export async function loadSounds() {
  const theme = getTheme();
  Object.keys(theme.sounds).forEach((key) => {
    soundEvents.set(key, theme.sounds[key].map(x => x.url))

    theme.sounds[key].forEach(({ url }) => {
      if (!loadedSounds.has(url)) {
        console.log('Load URL', url)
        loadedSounds.set(url, new Howl({
          src: url,
          preload: true,
        }));
      }
    })
  });
}
