import { ElementalLoadingUi } from '../../../shared/elem';
import { StartupAPI } from './index';

let reg: ServiceWorkerRegistration

export function getServiceWorker() {
  return reg?.active;
}

export async function initServiceWorker(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  if(!('serviceWorker' in navigator)) {
    alert('Service workers not supported, game cannot start. Make sure to use a Modern Web Browser!')
    location.reload();
    return;
  } else {
    ui.status('Loading Service', 0);
    await navigator.serviceWorker.register('/pwa.js');
    reg = await navigator.serviceWorker.ready;
  }
}
