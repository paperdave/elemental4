import { initializeGame, StartupAPI } from './init'

// Expose a startup hook used by the menu page and the updater.

// This hook lets us load in the javascript and other resources dynamically and then launch the
// code outside of our internal webpack structure without much effort. The function may only be
// called once and is deleted afterwards.

window['$elemental4'] = (api: StartupAPI) => {
  delete window['$elemental4'];
  initializeGame(api);
};
