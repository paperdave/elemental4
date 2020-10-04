// Entry point, starts up all the services
import { serverCreate } from './server';
import * as log from './logger';
import { ENABLE_HTTP, ENABLE_HTTPS } from './constants';
import { storageClose, storageLoad, storageSave } from './storage';
import { logOpenSheet } from './data-logging';

log.info("Starting Elemental 4");

(async() => {
  // Warn if anything is disabled
  if(!ENABLE_HTTP && !ENABLE_HTTPS) log.warn("HTTP and HTTPS is disabled. You will not be able to connect to the web server.");

  await logOpenSheet();
  await storageLoad();
  await serverCreate();
})();

async function gracefulExit() {
  log.info("Gracefully Exiting...");
  
  try {
    await storageSave();
    await storageClose();
  } catch (error) {
    log.error("Could not gracefully exit!");
    console.error(error);
  }
  
  process.exit();
}

process.on('SIGINT', gracefulExit);
