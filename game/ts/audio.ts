import { randomOf } from '@reverse/random';
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
let first = false;

export function playMusicTrack() {
  currentTrack = getNextMusic();
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
        playMusicTrack();
      })
    });
  }

  currentTrackHowlId = currentTrackHowl.play();
  if(first) {
    currentTrackHowl.fade(0, getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), 5000, currentTrackHowlId);
    first = true;
  } else {
    currentTrackHowl.volume(getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), currentTrackHowlId);
  }
  const duration = currentTrackHowl.duration(currentTrackHowlId)

  if(!error) {
    timer = setTimeout(() => {
      playMusicTrack();
    }, duration * 1000)
  }
}

export function updateMusicVolume() {
  if(currentTrackHowl && currentTrackHowlId && currentTrack) {
    currentTrackHowl.volume(getConfigNumber('volume-music', 0.5) * 0.5 * (currentTrack.volume ?? 1), currentTrackHowlId);
  }
}

export function getNextMusic() {
  return randomOf([...musicTracks]);
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
      console.log('music load', track.url)
      urlToHowl.set(track.url,
        new Howl({
          src: track.url,
          preload: true,
        })
      );
    }
    musicTracks.add(track);
  });

  console.log(musicTracks)
}
