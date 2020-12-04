
let reg: ServiceWorkerRegistration
export function setWorkerRegistration(arg: ServiceWorkerRegistration) {
  reg = arg;
}

export function getServiceWorker() {
  return reg?.active;
}
