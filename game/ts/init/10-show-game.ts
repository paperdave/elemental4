import { StartupAPI } from ".";
import { delay } from "../../../shared/shared";
import { getNextMusic, playMusicTrack, playSound } from "../audio";
import { getConfigBoolean } from "../savefile";

export async function initShowGame(startupAPI: StartupAPI, ui: any) {
  // Dispose UI if it is a 
  'dispose' in ui && ui.dispose();

  // Store cache and enable auto start.
  localStorage.cache = startupAPI.cache;
  localStorage.auto_start = 'true';

  // If first load show the game.
  startupAPI.showGame && startupAPI.showGame();

  // Give it a second to load.
  await delay(10);

  // Reveal the game.
  document.getElementById('game').classList.add('animate-in');

  // Play the startup sound
  if(getConfigBoolean('config-play-startup-sound', true)) {
    playSound('startup');
    await delay(500);
  }

  // Start the music track.
  playMusicTrack(getNextMusic());
}
