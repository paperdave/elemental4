import fs from 'fs-extra';
import { Database, RunResult } from 'sqlite3';
import { elementNameToStorageID, randomString } from "../shared/shared";
import { DynamicColor, ElementEntry, Entry, EntryNoNumber } from '../shared/elemental4-types';
import sha256 from 'sha256';
import { v4 as uuid } from 'uuid';
import { lookupIpCheck } from './ip-duplication';
import { SimpleEmitter } from '@reverse/emitter';
import { getCurrentTime, logCombo, logElement } from './data-logging';
import { createJoinedQueue } from '../shared/async-queue-exec';
import { debounce } from '@reverse/debounce';
import { DAILY_RESET } from './constants';
const ONE_DAY = 24*60*60*1000;

let currentDay: string;
let elementCount: number;
let entryCount: number;
let allElementIds: Map<string, string>;
let db: Database;
let nameLastModified: number;
let todayEntries: Entry[] = [];
let dbId: string = '';

export const newEntryEmitter = new SimpleEmitter();

export interface StorageElementRequest {
  text: string;
  color: DynamicColor;
  creator1: string;
  creator2: string;
  creator1p: string;
  creator2p: string;
  createdOn: number;
}
export interface DbSuggestion {
  finished: false;
  recipe: string;
  votes: string[];
  ips: string[];
  results: DbSuggestionEntry[]
  created: number;
  lastVote: number;
}
export interface DbFinishedSuggestion {
  finished: true;
  result: string;
}
export interface DbSuggestionEntry {
  name: string;
  score: number;
  voteCount: number;
  variants: DbVariant[];
  created: number;
  downvoteIps: string[];
  downvoteUsers: string[];
  lastDownvote: number;
}
export interface DbVariant {
  color: DynamicColor;
  score: number;
  text: string;
  creator: string;
}

function dbRun(sql: string, params?: any) {
  return new Promise<RunResult>((res, rej) => {
    db.run(...[sql, params, function(err) {
      res(this);
      rej(err)
    }].filter(Boolean) as [string, any]);
  });
}
function dbGet(sql: string, params?: any) {
  return new Promise<any>((res, rej) => {
    db.get(...[sql, params, function(err, row) {
      res(row);
      rej(err)
    }].filter(Boolean) as [string, any]);
  });
}
function dbAll(sql: string, params?: any) {
  return new Promise<any>((res, rej) => {
    db.all(...[sql, params, function(err, row) {
      res(row);
      rej(err)
    }].filter(Boolean) as [string, any]);
  });
}

export async function storageLoad() {
  await fs.ensureDir('data');
  await fs.ensureDir('data/db');

  db = await new Promise((res, rej) => {
    const d = new Database('data/sqlite.db')
    d.on('open', () => res(d));
    d.on('error', (e) => rej(e));
  });

  if (await fs.pathExists('data/meta.json')) {
    const {
      elementCount: elementCountValue,
      entryCount: entryCountValue,
      allElementIds: allElementIdsValue,
      currentDay: currentDayValue,
      nameLastModified: nameLastModifiedValue,
      dbId: dbIdValue
    } = await fs.readJSON('data/meta.json');

    elementCount = elementCountValue;
    entryCount = entryCountValue;
    allElementIds = new Map(Object.entries(allElementIdsValue));
    currentDay = currentDayValue;
    nameLastModified = nameLastModifiedValue;
    dbId = dbIdValue;

    await processDayPassing();

    todayEntries = fs.readFileSync('data/db/today.e4db').toString().split('\n').slice(0,-1).map(x => JSON.parse(x));

    return false;
  } else {
    await fs.writeFile('data/db/all.e4db', "");

    elementCount = 0;
    entryCount = 0;
    allElementIds = new Map();
    currentDay = getToday();
    todayEntries = [];
    nameLastModified = Date.now();
    dbId = 'initial';

    await dbRun(`CREATE TABLE ip_trust (ip_hash text PRIMARY KEY, trust integer, expire integer) WITHOUT ROWID;`)
    await dbRun(`CREATE TABLE users (private_id text PRIMARY KEY, public_id text, display text, elementCount integer, suggestCount integer) WITHOUT ROWID;`)
    await dbRun(`CREATE TABLE element_comments (id text PRIMARY KEY, user1 text, comment1 integer, user2 text, comment2 integer) WITHOUT ROWID;`)
    await dbRun(`CREATE TABLE suggestions (recipe text PRIMARY KEY, data text) WITHOUT ROWID;`)

    await initialDatabase();

    return true;
  }
}

export function getDbId() {
  return dbId;
}

const queue = createJoinedQueue();

setInterval(() => {
  queue(processDayPassing)();
}, 12 * 60 * 60 * 1000);

export async function storageSave() {
  await fs.writeJSON('data/meta.json', {
    elementCount,
    entryCount,
    allElementIds: Object.fromEntries(allElementIds),
    currentDay,
    nameLastModified,
    dbId,
  });
}
export async function storageClose() {
  await new Promise((res, rej) => db.close((err) => err ? rej(err) : res()));
}

function get32DaysAgo() {
  const x = new Date(new Date().getTime() - (32 * 24 * 60 * 60 * 1000))
  return `${x.getFullYear()}-${(x.getUTCMonth()+1).toString().padStart(2,'0')}-${x.getUTCDate().toString().padStart(2, '0')}`;
}

function getToday() {
  const x = new Date();
  return `${x.getUTCFullYear()}-${(x.getUTCMonth()+1).toString().padStart(2,'0')}-${x.getUTCDate().toString().padStart(2, '0')}`;
}

const debouncedStorageSave = debounce(storageSave, 1000);

export async function processDayPassing() {
  const today = getToday();
  if (currentDay !== today) {
    if(DAILY_RESET) {
      await fs.writeFile('data/db/today.e4db', '');
      await fs.writeFile('data/db/all.e4db', '');
      dbId = uuid();
      await storageSave();
      return true;
    } else {
      if(await fs.pathExists(`data/db/${get32DaysAgo()}.e4db`)) {
        await fs.remove(`data/db/${get32DaysAgo()}.e4db`);
      }
      await fs.move('data/db/today.e4db', `data/db/${currentDay}.e4db`);
      await fs.writeFile('data/db/today.e4db', '');
      currentDay = today;
      await storageSave();
    }
  }
  return false;
}

export const storageAddEntry = queue(async function storageAddEntry(obj: EntryNoNumber) {
  if(await processDayPassing()) return;
  
  entryCount++;
  const entry = entryCount;

  const entryText = JSON.stringify({
    entry,
    ...obj,
  }) + '\n';

  await fs.appendFile('data/db/all.e4db', entryText);
  await fs.appendFile('data/db/today.e4db', entryText);
  todayEntries.push({ entry, ...obj });

  newEntryEmitter.emit({
    entry,
    ...obj
  });

  debouncedStorageSave();
});

export async function storageAddElement(elem: StorageElementRequest) {
  elementCount++;
  const id = elementCount;

  await storageAddEntry({
    type: 'element',
    id: id.toString(),
    createdOn: Date.now(),
    color: elem.color,
    text: elem.text,
    creators: await Promise.all([elem.creator1, elem.creator2].filter(Boolean)),
  } as ElementEntry);

  await dbRun(`INSERT INTO element_comments (id, user1, comment1, user2, comment2) VALUES ($id, $user1, 0, $user2, 0)`, {
    $id: id.toString(),
    $user1: elem.creator1p,
    $user2: elem.creator2p,
  });

  await logElement(
    getCurrentTime(),
    id,
    elem.text.replace(/\s+/g, ' '),
    elementNameToStorageID(elem.text),
    elem.color.base,
    elem.color.saturation,
    elem.color.lightness,
    elem.creator1,
    elem.creator2
  );

  allElementIds.set(elementNameToStorageID(elem.text), id.toString());

  return id.toString();
}

export async function storageAddCombo(a: string, b: string, result: string) {
  await storageAddEntry({
    type: 'combo',
    recipe: a + '+' + b,
    result: result
  });
}

export async function storageGetSuggestion(recipe: string): Promise<DbSuggestion | DbFinishedSuggestion> {
  return JSON.parse((await dbGet("SELECT * FROM suggestions WHERE recipe=$recipe", { $recipe: recipe }))?.data || 'null');
}

export async function storageSetSuggestion(recipe: string, suggestion: DbSuggestion | DbFinishedSuggestion) {
  return await dbRun("INSERT OR REPLACE INTO suggestions(recipe, data) VALUES($recipe, $text)", { $recipe: recipe, $text: JSON.stringify(suggestion) });
}

export async function storageCheckIP(ip: string): Promise<boolean> {
  const hash = sha256(ip);
  const entry = (await dbGet("SELECT * FROM ip_trust WHERE ip_hash=$ip", { $ip: hash }));

  if(entry) {
    if (Date.now() < entry.expire) {
      return entry.trust;
    }
  } 
  const ipLookup = await lookupIpCheck(ip)
  await dbRun("INSERT OR REPLACE INTO ip_trust(ip_hash, trust, expire) VALUES($hash, $trust, $expire)", {
    $hash: hash,
    $trust: ipLookup ? 1 : 0,
    $expire: Date.now() + ONE_DAY * 5
  });
  return ipLookup;
}

export function storageElementNameExists(nameOrId: string) {
  return allElementIds.has(elementNameToStorageID(nameOrId));
}
export function storageGetElementNumberFromName(nameOrId: string) {
  return allElementIds.get(elementNameToStorageID(nameOrId));
}

export function storageGetEntriesAfter(lastEntry: number) {
  return todayEntries.filter(x => x.entry > lastEntry);
}

export async function getPublicId(privateId: string) {
  try {
    return (await dbGet("SELECT public_id FROM users WHERE private_id=$id", { $id: privateId })).public_id;
  } catch (error) {
    return 'null-user'
  }
}
export async function storageVerifyProfile(privateId: string) {
  try {
    return {
      exists: true,
      ...(await dbGet("SELECT public_id,display FROM users WHERE private_id=$id", { $id: privateId }))
    }
  } catch (error) {
    return { exists: false }
  }
}
export async function getPrivateId(publicId: string) {
  try {
    return (await dbGet("SELECT private_id FROM users WHERE public_id=$id", { $id: publicId })).private_id;
  } catch (error) {
    return 'null-user'
  }
}

export async function storageSetUserName(privateId: string, name: string) {
  const x = await dbRun("UPDATE users SET display = $text WHERE private_id = $id", { $id: privateId, $text: name });
  if(x.changes > 0) {
    nameLastModified = Date.now();
    return await getPublicId(privateId);
  }
}
export async function storageAddElementComment(elementId: string, privateId: string, comment: string) {
  const row = await dbGet("SELECT * FROM element_comments WHERE id=$elementId", { $elementId: elementId });
  if(row) {
    if (row.user1 === privateId) {
      if(row.comment1 === 1) return
      await dbRun("UPDATE element_comments SET comment1 = 1 WHERE id = $id", { $id: elementId });
      await storageAddEntry({
        type: 'comment',
        comment,
        id: elementId,
        user: await getPublicId(privateId)
      })
    } else if (row.user2 === privateId) {
      if(row.comment2 === 1) return
      await dbRun("UPDATE element_comments SET comment2 = 1 WHERE id = $id", { $id: elementId });
      await storageAddEntry({
        type: 'comment',
        comment,
        id: elementId,
        user: await getPublicId(privateId)
      });
    }
  } else {
    return false;
  }
}
export async function storageIncSuggestCount(privateId: string, name: string) {
  const entry = (await dbGet("SELECT * FROM users WHERE private_id=$id", { $id: privateId }));
  if (entry) {
    if(entry.elementCount > 0) return;
    await dbRun("UPDATE users SET suggestCount = $new WHERE private_id = $id", { $id: privateId, $new: entry.suggestCount + 1 });
  } else {
    const id = randomString(32);
    await dbRun("INSERT OR REPLACE INTO users(private_id, public_id, display, elementCount, suggestCount) VALUES($private_id, $public_id, $display, $elementCount, $suggestCount)", {
      $private_id: privateId,
      $public_id: id,
      $display: name,
      $elementCount: 0,
      $suggestCount: 1,
    });
  }
}
export async function storageDecSuggestCount(privateId: string) {
  const entry = (await dbGet("SELECT * FROM users WHERE private_id=$id", { $id: privateId }));
  if (entry) {
    if(entry.elementCount > 0) return;
    if(entry.suggestCount > 1) {
      await dbRun("UPDATE users SET suggestCount = $new WHERE private_id = $id", { $id: privateId, $new: entry.suggestCount - 1 });
    } else {
      await dbRun("DELETE FROM users WHERE private_id = $id", { $id: privateId });
    }
  }
}
export async function storageIncElementCount(privateId: string) {
  const entry = (await dbGet("SELECT * FROM users WHERE private_id=$id", { $id: privateId }));
  if (entry) {
    if(entry.elementCount > 0) return;
    await dbRun("UPDATE users SET elementCount = 1 WHERE private_id = $id", { $id: privateId });
  } else {
    const id = randomString(32);
    await dbRun("INSERT OR REPLACE INTO users(private_id, public_id, display, elementCount, suggestCount) VALUES($private_id, $public_id, $display, $elementCount, $suggestCount)", {
      $private_id: privateId,
      $public_id: id,
      $display: "",
      $elementCount: 1,
      $suggestCount: 0,
    });
  }
}

export async function storageDumpNames() {
  return Object.fromEntries((await dbAll("SELECT public_id, display from users WHERE elementCount > 0")).map(({ display, public_id }) => [public_id, display]))
}

export async function initialDatabase() {  
  const creationDate = Date.now();
  // Write Elements
  await storageAddElement({
    color: {
      base: 'blue',
      saturation: 0.5,
      lightness: 0.5,
    },
    text: "Air",
    creator1: 'God',
    creator2: null,
    creator1p: 'null-user',
    creator2p: 'null-user',
    createdOn: creationDate,
  });
  await storageAddElement({
    color: {
      base: 'brown',
      saturation: -0.1,
      lightness: -0.5,
    },
    text: "Earth",
    creator1: 'God',
    creator2: null,
    creator1p: 'null-user',
    creator2p: 'null-user',
    createdOn: creationDate,
  });
  await storageAddElement({
    color: {
      base: 'orange',
      saturation: 0,
      lightness: 0,
    },
    text: "Fire",
    creator1: 'God',
    creator2: null,
    creator1p: 'null-user',
    creator2p: 'null-user',
    createdOn: creationDate,
  });
  await storageAddElement({
    color: {
      base: 'dark-blue',
      saturation: 0,
      lightness: 0,
    },
    text: "Water",
    creator1: 'God',
    creator2: null,
    creator1p: 'null-user',
    creator2p: 'null-user',
    createdOn: creationDate,
  });
}

export function storageGetEntryCount() {
  return entryCount;
}
export function storageGetElementCount() {
  return elementCount;
}
