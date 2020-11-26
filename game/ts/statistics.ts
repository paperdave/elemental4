import { debounce } from "@reverse/debounce";
import { humanize } from "juration";
import { IsNullAPI } from "../../shared/api/internal/internal-null";
import { ElementalBaseAPI } from "../../shared/elem";
import { getAPI } from "./api";
import { getOwnedElements, getStatistics, setStatistics } from "./savefile";

interface ClientStats {        // check = tracking setup in the game
  startTime: number;           // √
  playTime: number;            // √
  sessionCount: number;        // √
  rediscoveries: number;       // √
  clicks: number;              // √
  elementsPickedUp: number;    // √
  elementsDropped: number;     // √
  combinationsSuccess: number; // √
  combinationsFailure: number; // √
  infoOpened: number;          // √
  hintsUsed: number;           //
  suggestionsSent: number;     // √
  suggestionsVoted: number;    // √
  suggestionsDownvoted: number;// √
  suggestionsCreated: number;  // √
}
type ClientStatName = keyof ClientStats

let currentStats: ClientStats = null;
let currentAPI: ElementalBaseAPI = null;
let currentSaveFile: ElementalBaseAPI = null;
let sessionStartTime: number;

function defaultStats(): ClientStats {
  return {
    clicks: 0,
    combinationsFailure: 0,
    combinationsSuccess: 0,
    rediscoveries: 0,
    elementsDropped: 0,
    elementsPickedUp: 0,
    playTime: 0,
    sessionCount: 0,
    infoOpened: 0,
    startTime: Date.now(),
    suggestionsSent: 0,
    suggestionsVoted: 0,
    suggestionsDownvoted: 0,
    suggestionsCreated: 0,
    hintsUsed: 0
  }
}

export function getTimeSinceStarted() {
  return (Date.now() - sessionStartTime) / 1000;
}
export async function startStatistics() {
  const api = getAPI();
  if(api[IsNullAPI]) return;
  
  const newStats = ((await getStatistics(api)) || defaultStats()) as ClientStats;

  newStats.sessionCount++;

  if (!currentStats) {
    let lastRecordedTime = parseInt(localStorage.getItem('time'));
    
    if(!isNaN(lastRecordedTime)) {
      newStats.playTime += lastRecordedTime;
    }

    setStatistics(api, newStats);
    
    setInterval(() => {
      localStorage.setItem('time', Math.round((Date.now() - sessionStartTime)/1000).toString())
    }, 5000);
  }

  sessionStartTime = Date.now();
  localStorage.setItem('time', '0');

  currentAPI = api;
  currentStats = newStats;
}
export async function endStatistics() {
  if(currentAPI) {
    currentStats.playTime += Math.round(Date.now() - sessionStartTime)/1000;
    setStatistics(currentAPI, currentStats);
  }
}
export async function getDisplayStatistics(): Promise<[string, any][]> {
  const owned = await getOwnedElements(currentAPI)
  return [
    ['Savefile Started', new Date(currentStats.startTime).toLocaleDateString() + ' ' + new Date(currentStats.startTime).toLocaleTimeString()],
    ['Time Played', humanize(Math.floor(currentStats.playTime + getTimeSinceStarted()))],
    ['Sessions', currentStats.sessionCount],

    ['Elements Discovered', owned.length],
    ['Newest Element', owned[owned.length - 1]],
    ['Elements Rediscovered', currentStats.rediscoveries],
    ['Combinations Tried', currentStats.combinationsFailure + currentStats.combinationsSuccess],
    ['Combinations Succeeded', currentStats.combinationsSuccess],
    ['Combinations Failed', currentStats.combinationsFailure],
    ['Combination Success Rate', (currentStats.combinationsSuccess/((currentStats.combinationsFailure+currentStats.combinationsSuccess) || 1) * 100).toFixed(1) + '%'],

    ...getAPI('suggestion') ? [
      ['Suggestions Sent', currentStats.suggestionsSent],
      ['Suggestions Voted', currentStats.suggestionsVoted],
      ['Suggestions Down Voted', currentStats.suggestionsDownvoted],
      ['Combinations Created', currentStats.suggestionsCreated],
    ] : ([] as any),

    ...getAPI('hint') ? [
      ['Hints Used', currentStats.hintsUsed]
    ] : ([] as any),

    ['Clicks', currentStats.clicks],
    ['Elements Inspected', currentStats.infoOpened ],
    ['Elements Picked Up', currentStats.elementsPickedUp],
    ['Elements Dropped', currentStats.elementsDropped],

  ]
}
const updateStatsWrite = debounce(() => {
  setStatistics(currentAPI, currentStats);
}, 10000);
export function incrementStatistic(name: ClientStatName, value = 1) {
  if(currentStats) {
    currentStats[name] += value;
    updateStatsWrite();
  }
}
