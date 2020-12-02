import { StartupAPI } from ".";
import { ElementalLoadingUi } from "./loading";
import marked from 'marked';

export async function initServiceWorker(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Loading Game HTML', 0);

  // Game HTML
  const gameRoot = document.getElementById('game');
  gameRoot.innerHTML = await fetch('/game').then((x) => x.text());

  // Changelog
  const changelogRoot = document.getElementById('changelog-root');
  changelogRoot.innerHTML = marked(await fetch('/changelog.md').then((x) => x.text()));

  // Build Information
  const buildInfo = {
    'version': $version,
    'build-date': $build_date
  };
  document.querySelectorAll('[data-build-info]').forEach(x => {
    x.innerHTML = buildInfo[x.getAttribute('data-build-info')]
  });
}
