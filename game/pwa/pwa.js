var cacheName = 'ELEMENTAL';

// this worker is different from others, since all the cache management is done in
// the actual game, not the worker. all this worker does is fetch data and manage stores.

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => {
      // match a cached entry, if not it will run fetch
      return r || fetch(e.request);
    })
  );
});

// to get it to work without reloading we have to claim all pages,
// so any open pages before the install will get their fetch() intercepted
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Store stuff.
class Store {
  constructor(dbName = 'keyval-store', storeName = 'keyval') {
    const connection = (version) => new Promise((resolve, reject) => {
      const db = indexedDB.open(dbName, version);
      db.onerror = () => reject(db.error);
      db.onsuccess = () => {
        // If a later version of this database wants to open,
        // close and create a new connection for the new version.
        db.result.onversionchange = () => {
          db.result.close();
          this._dbp = connection();
        }
        db.result.onabort = (e) => {
          console.error('IDB Aborted', e);
        }
        db.result.onclose = (e) => {
          console.error('IDB Closed', e);
        }
        // If this database has been opened before, but never with this
        // storeName, the objectStore won't exist yet. In which case,
        // force an upgrade by opening a connection with version n+1.
        if (!db.result.objectStoreNames.contains(storeName)) {
          resolve(connection(db.result.version + 1));
        }
        else {
          resolve(db.result);
        }
      }

      // First time setup: create an empty object store
      db.onupgradeneeded = () => {
        db.result.createObjectStore(storeName);
      };
    });

    this.dbName = dbName;
    this.storeName = storeName;
    this._dbp = connection();
  }

  _withIDBStore(type, callback) {
    return this._dbp.then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, type);
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () => reject(transaction.error);
      callback(transaction.objectStore(this.storeName));
    }));
  }
}

let stores = {};

function store(name) {
  if(!stores[name]) stores[name] = new Store('ELEMENTAL', name)
  return stores[name];
}

function get(key, store) {
  let req;
  return store._withIDBStore('readonly', store => {
    req = store.get(key);
  }).then(() => req.result);
}

function set(key, value, store) {
  return store._withIDBStore('readwrite', store => {
    store.put(value, key);
  });
}

function del(key, store) {
  return store._withIDBStore('readwrite', store => {
    store.delete(key);
  });
}

function clear(store) {
  return store._withIDBStore('readwrite', store => {
    store.clear();
  });
}

function keys(store) {
  const keys = [];

  return store._withIDBStore('readonly', store => {
    // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
    // And openKeyCursor isn't supported by Safari.
    (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
      if (!this.result) return;
      keys.push(this.result.key);
      this.result.continue()
    };
  }).then(() => keys);
}

self.addEventListener('message', (ev) => {
  const data = ev.data;
  switch (data.type) {
    case 'elem4-worker:set':
      if(!data.item) {
        console.error('null item', data)
      }
      set(data.key, data.item, store(data.store)).then(() => {
        ev.source.postMessage({
          return_id: data.return_id,
        });
      }).catch((e) => {
        console.error('IDB Write Failure.')
        console.error(e);
      });
      break;
    case 'elem4-worker:del':
      del(data.key, store(data.store)).then(() => {
        ev.source.postMessage({
          return_id: data.return_id,
        });
      });
      break;
    case 'elem4-worker:clear':
      clear(store(data.store)).then(item => {
        ev.source.postMessage({
          return_id: data.return_id,
        });
      }).catch((e) => {
        console.error('IDB Write Failure.')
        console.error(e);
      });
      break;
    case 'elem4-worker:get':
      get(data.key, store(data.store)).then(item => {
        ev.source.postMessage({
          return_id: data.return_id,
          return_value: item,
        });
      }).catch((e) => {
        console.error('IDB Write Failure.')
        console.error(e);
      });
      break;
    case 'elem4-worker:keys':
      keys(store(data.store)).then(item => {
        ev.source.postMessage({
          return_id: data.return_id,
          return_value: item,
        });
      }).catch((e) => {
        console.error('IDB Write Failure.')
        console.error(e);
      });
      break;
    case 'elem4-worker:length':
      length(data.key, store(data.store)).then(item => {
        ev.source.postMessage({
          return_id: data.return_id,
          return_value: item,
        });
      }).catch((e) => {
        console.error('IDB Write Failure.')
        console.error(e);
      });
      break;
    default:
      console.log('Oh Hell', data)
      break;
  }
});
