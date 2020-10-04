// @ts-nocheck
// CacheMap.ts - EXPORTED FROM SEQUENCER

export interface CacheOptions<Key extends PropertyKey, Value> {
  /** in seconds */
  ttl: number | null;
  /** in seconds */
  checkTime: number;
  /** called after a key is removed */
  onDelete?: (key: Key, value: Value) => void;
}

interface Entry<Key, Value> {
  key: Key;
  value: Value;
  expires: number | null;
}

export class CacheMap<Key extends PropertyKey, Value> {
  private options: CacheOptions<Key, Value>;
  private timeout: NodeJS.Timeout | null;
  private map = new Map<Key, Entry<Key, Value>>();

  constructor(options: Partial<CacheOptions<Key, Value>>) {
    this.options = {
      ttl: 5 * 60,
      checkTime: 10 * 60,
      ...options,
    };
    this.timeout = null;
  }

  set(key: Key, value: Value, ttl: number | null = this.options.ttl): void {
    const entry = this.map.get(key);
    if (entry) {
      entry.value = value;
      entry.expires = ttl ? Date.now() + ttl * 1000 : null;
    } else {
      this.map.set(key, {
        key,
        value,
        expires: ttl ? Date.now() + ttl * 1000 : null,
      });
      if (this.timeout !== null) {
        this.timeout = setTimeout(this.update, this.options.checkTime * 1000);
      }
    }
  }

  get(key: Key): Value | null {
    const entry = this.map.get(key);
    if (entry && (!entry.expires || entry.expires > Date.now())) {
      return entry.value;
    }
    return null;
  }

  has(key: Key): boolean {
    return this.map.has(key);
  }

  touch(key: Key, ttl: number | null = this.options.ttl): void {
    const entry = this.map.get(key);
    if (entry) {
      entry.expires = ttl ? Date.now() + ttl * 1000 : null;
    }
  }

  private update() {
    this.map.forEach(entry => {
      if (entry.expires && entry.expires < Date.now()) {
        this.delete(entry.key);
      }
    });
    if (this.map.size >= 1) {
      this.timeout = setTimeout(this.update, this.options.checkTime);
    }
  }

  delete(key: Key) {
    const entry = this.map.get(key);
    if (entry) {
      this.options.onDelete && this.options.onDelete(key, entry.value);
    }
    this.map.delete(key);
    if (this.map.size === 0 && this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  deleteAll() {
    this.map.forEach(entry => {
      this.delete(entry.key);
    });
  }

  dispose() {
    if (this.timeout) clearTimeout(this.timeout);
    this.map.clear();
  }
}
