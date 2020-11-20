import { updateMusicVolume } from "../audio";
import { getConfigNumber, setConfigNumber } from "../savefile";
import { escapeHTML } from "../../../shared/shared";

export function audioSettings() {
  const volumeSound = getConfigNumber('volume-sound', 1);
  const volumeMusic = getConfigNumber('volume-music', 0.5);
  (document.querySelector('[data-volume-slider="sound"]') as any).value = volumeSound * 100;
  document.querySelector('[data-volume-display="sound"]').innerHTML = escapeHTML(`${Math.floor(volumeSound * 100)}%`);
  document.querySelector('[data-volume-slider="sound"]').addEventListener('input', (x) => {
    setConfigNumber('volume-sound', (x.currentTarget as any).value/100);
    document.querySelector('[data-volume-display="sound"]').innerHTML = escapeHTML(`${(x.currentTarget as any).value}%`);
  });
  (document.querySelector('[data-volume-slider="music"]') as any).value = volumeMusic * 100;
  document.querySelector('[data-volume-display="music"]').innerHTML = escapeHTML(`${Math.floor(volumeMusic * 100)}%`);
  document.querySelector('[data-volume-slider="music"]').addEventListener('input', (x) => {
    setConfigNumber('volume-music', (x.currentTarget as any).value/100);
    document.querySelector('[data-volume-display="music"]').innerHTML = escapeHTML(`${(x.currentTarget as any).value}%`);
    updateMusicVolume();
  })
}
