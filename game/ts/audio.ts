import { randomOf, randomInt } from '@reverse/random';
import { Howl, Howler } from 'howler';
import { getMusicTracks, getTheme, MusicEntry, SoundEntry } from './theme';
import { sounds } from '../../workshop/themes/elem4_default/elemental.json';
import { getConfigNumber } from './savefile';

export type SoundId = keyof typeof sounds;

let urlToHowl = new Map<string, Howl>();
let soundEvents = new Map<string, SoundEntry[]>();
let musicTracks = new Set<MusicEntry>();

let currentTrack: MusicEntry = null;
let currentTrackHowl: Howl = null;
let currentTrackHowlId: number = null;

export function clearSounds() {
  urlToHowl.forEach(x => {
    x.stop();
    x.unload();
  });

  urlToHowl = new Map();
}

let isUnlocked = false;
let first = true;

export function playMusicTrack(track) {
  currentTrack = track;
  if(!currentTrack) return;
  currentTrackHowl = urlToHowl.get(currentTrack.url);
  if(!currentTrackHowl) return;
  let error = false;
  let timer;
  
  if(!isUnlocked) {
    currentTrackHowl.on('playerror', () => {
      error = true;
      clearTimeout(timer);
      currentTrackHowl.once('unlock', () => {
        playMusicTrack(currentTrack);
      })
    });
  }

  currentTrackHowlId = currentTrackHowl.play();
  if(first) {
    currentTrackHowl.fade(0, getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), 5000, currentTrackHowlId);
    first = false;
  } else {
    currentTrackHowl.volume(getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), currentTrackHowlId);
  }
  setTimeout(() => {
    let duration
    duration = currentTrackHowl.duration(currentTrackHowlId)
  
    currentTrackHowl.loop(true, currentTrackHowlId);
    if(!error) {
      if (currentTrack.loop === 'no-loop') {
        currentTrackHowl.loop(false, currentTrackHowlId);
        const next = getNextMusic();
        timer = setTimeout(() => {
          playMusicTrack(next || track);
        }, duration * 1000 + (next ? 0 : randomInt(5000, 30000)))
      } else {
        const next = getNextMusic();
        const loops = randomInt(0, 4) === 0 ? randomInt(4, 12) : 0;
        if (!next) {
          if(loops === 0) {
            currentTrackHowl.loop(false, currentTrackHowlId);
            currentTrackHowl.once('end', () => {
              playMusicTrack(next);
            })
          } else {
            let loopsSoFar = 0;
            currentTrackHowl.loop(true, currentTrackHowlId);
            const handler = () => {
              loopsSoFar++;
              if(loopsSoFar > loops) {
                playMusicTrack(next);
                currentTrackHowl.off('end', handler);
              } else if (loopsSoFar === loops) {
                setTimeout(() => {
                  currentTrackHowl.loop(false, currentTrackHowlId);
                }, 100);
              }
            };
            currentTrackHowl.on('end', handler);
          }
        } else {

        }
      }
    }
  }, 100);
}

export function updateMusicVolume() {
  if(currentTrackHowl && currentTrackHowlId && currentTrack) {
    currentTrackHowl.volume(getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), currentTrackHowlId);
  }
}

export function getNextMusic() {
  return randomOf([...musicTracks].filter(x => x !== currentTrack));
}

export function playSound(x: SoundId) {
  const array = soundEvents.get(x);
  if(!array || array.length === 0) return;
  const sound = randomOf(array);
  if(!sound) return;
  const howl = urlToHowl.get(sound.url);
  if (howl) {
    const x = howl.play();
    howl.volume(getConfigNumber('volume-sounds', 1) * sound.volume, x);
    howl.rate(1 + sound.pitch, x)
  }
}

export async function loadSounds() {
  const theme = getTheme();
  Object.keys(theme.sounds).forEach((key) => {
    soundEvents.set(key, theme.sounds[key].map(y => ({
      volume: 1,
      pitch: 0,
      ...y,
    })));

    theme.sounds[key].forEach(({ url, volume, pitch }) => {
      if (!urlToHowl.has(url)) {
        urlToHowl.set(url,
          new Howl({
            src: url,
            preload: true,
          })
        );
      }
    })
  });

  const tracks = getMusicTracks();
  tracks.forEach((track) => {
    if (!urlToHowl.has(track.url)) {
      urlToHowl.set(track.url,
        new Howl({
          src: track.url,
          preload: true,
        })
      );
    }
    musicTracks.add(track);
  });
}
