declare global {
  interface Window {
    localForage: typeof import('localforage')
  }
}

if (typeof window.localForage === 'undefined') {
  window.localForage = require('localforage')
}

export default window.localForage;
