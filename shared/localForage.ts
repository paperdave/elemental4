declare global {
  interface Window {
    localForage: typeof import('localforage')
  }
}

let f = window.localForage;
if (typeof f === 'undefined') {
  f = require('localforage');
}

delete window.localForage;

export default f;
