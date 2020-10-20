import { randomOf } from '@reverse/random';
import { Howl, Howler } from 'howler';
import { getTheme } from './theme';
import { sounds } from '../../workshop/themes/elem4_default/elemental.json';
export type SoundId = keyof typeof sounds;

interface SoundEntry {
  howl: Howl;
  volume: number;
  pitch: number;
}

let loadedSounds = new Map<string, SoundEntry>();
let soundEvents = new Map<string, string[]>();

let masterSFXVolume = 1;
let masterMusicVolume = 0.7;

export function clearSounds() {
  loadedSounds.forEach(x => {
    x.howl.stop();
    x.howl.unload();
  });

  loadedSounds = new Map();
}

export function initializeMusic() {
  
}

export function getNextMusic() {
  
}

export function playSound(x: SoundId) {
  const array = soundEvents.get(x);
  if(!array) return;
  const sound = randomOf(array);
  const { howl, volume, pitch } = loadedSounds.get(sound) || {};
  if(howl) {
    const x = howl.play();
    howl.volume(masterSFXVolume * volume, x);
    howl.rate(1 + pitch, x)
  }
}

export async function loadSounds() {
  const theme = getTheme();
  Object.keys(theme.sounds).forEach((key) => {
    soundEvents.set(key, theme.sounds[key].map(x => x.url))

    theme.sounds[key].forEach(({ url, volume, pitch }) => {
      if (!loadedSounds.has(url)) {
        loadedSounds.set(url, {
          howl: new Howl({
            src: url,
            preload: true,
          }),
          volume: volume || 1,
          pitch: pitch || 0
        });
      }
    })
  });
}
