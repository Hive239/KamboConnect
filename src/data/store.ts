/**
 * Generic localStorage-backed data store — the mock implementation of the
 * Base44 entity API surface used across the app:
 *   list(sort?, limit?) · filter(query, sort?, limit?) · get(id)
 *   create(data) · update(id, data) · delete(id)
 *
 * This is the SEAM. To migrate to Supabase, reimplement `makeEntity` to call
 * Supabase instead of localStorage — no page/component changes required.
 */
import type { BaseRecord, EntityName, EntityTypeMap } from '@/types/entities';
import { buildSeed } from './seed';
import { emit } from './events';
import { isSupabaseConfigured } from '@/lib/supabase';
import { makeSupabaseEntity } from './supabaseStore';

const DB_KEY = 'kc_mockdb_v2';

type DB = { [K in EntityName]: any[] };

let _db: DB | null = null;

function loadDB(): DB {
  if (_db) return _db;
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(DB_KEY) : null;
    if (raw) {
      _db = JSON.parse(raw);
      return _db as DB;
    }
  } catch {
    /* ignore corrupt storage */
  }
  _db = buildSeed() as DB;
  persist();
  return _db;
}

function persist() {
  try {
    if (typeof localStorage !== 'undefined' && _db) {
      localStorage.setItem(DB_KEY, JSON.stringify(_db));
    }
  } catch {
    /* storage full / unavailable — keep in-memory copy */
  }
}

/** Wipe and re-seed (used by the dev reset control). */
export function resetDB() {
  _db = buildSeed() as DB;
  persist();
  emit('*', 'reset', null);
}

// Write-time pub/sub lives in ./events (shared by the mock + Supabase stores).
export { subscribe } from './events';
export type { StoreChange, StoreOp } from './events';

// Cross-tab sync: another tab wrote to the DB → drop our cache and notify.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      _db = null; // force reload from the freshly-written value
      emit('*', 'reset', null);
    }
  });
}

function nowISO() {
  return new Date().toISOString();
}

function genId() {
  // Stable-enough unique id for a mock store.
  return (
    'm' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function collection(name: EntityName): any[] {
  const db = loadDB();
  if (!db[name]) db[name] = [];
  return db[name];
}

function sortRecords(records: any[], sort?: string): any[] {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return desc ? 1 : -1;
    return desc ? -1 : 1;
  });
}

function matches(record: any, query: Record<string, any>): boolean {
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined) return true;
    return record?.[k] === v;
  });
}

export interface EntityClient<T extends BaseRecord> {
  list(sort?: string, limit?: number): Promise<T[]>;
  filter(query: Partial<T> & Record<string, any>, sort?: string, limit?: number): Promise<T[]>;
  get(id: string): Promise<T>;
  create(data: Partial<T> & Record<string, any>): Promise<T>;
  update(id: string, data: Partial<T> & Record<string, any>): Promise<T>;
  delete(id: string): Promise<{ success: true }>;
}

/** Build a typed CRUD client backed by a localStorage collection. */
export function makeEntity<K extends EntityName>(
  name: K,
): EntityClient<EntityTypeMap[K]> {
  // When Supabase is configured (.env present), use the real backend.
  if (isSupabaseConfigured) return makeSupabaseEntity(name);
  type T = EntityTypeMap[K];
  return {
    async list(sort, limit) {
      let rows = sortRecords(collection(name), sort);
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return rows as T[];
    },
    async filter(query, sort, limit) {
      let rows = collection(name).filter((r) => matches(r, query));
      rows = sortRecords(rows, sort);
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return rows as T[];
    },
    async get(id) {
      const found = collection(name).find((r) => r.id === id);
      if (!found) throw new Error(`${name} ${id} not found`);
      return found as T;
    },
    async create(data) {
      const record = {
        ...data,
        id: genId(),
        created_date: nowISO(),
        updated_date: nowISO(),
      };
      collection(name).push(record);
      persist();
      emit(name, 'create', record);
      return record as T;
    },
    async update(id, data) {
      const rows = collection(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${name} ${id} not found`);
      rows[idx] = { ...rows[idx], ...data, id, updated_date: nowISO() };
      persist();
      emit(name, 'update', rows[idx]);
      return rows[idx] as T;
    },
    async delete(id) {
      const rows = collection(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const [removed] = rows.splice(idx, 1);
        persist();
        emit(name, 'delete', removed);
      }
      return { success: true };
    },
  };
}
