/** Shared change-event bus for the data layer (mock + Supabase both emit here). */
import type { EntityName } from '@/types/entities';

export type StoreOp = 'create' | 'update' | 'delete' | 'reset';
export interface StoreChange {
  entity: EntityName | '*';
  op: StoreOp;
  record: any | null;
}
type StoreListener = (change: StoreChange) => void;

const listeners = new Set<StoreListener>();

export function emit(entity: EntityName | '*', op: StoreOp, record: any) {
  const change: StoreChange = { entity, op, record };
  listeners.forEach((l) => {
    try { l(change); } catch { /* a bad listener shouldn't break a write */ }
  });
}

export function subscribe(
  entityOrCb: EntityName | '*' | StoreListener,
  maybeCb?: StoreListener,
): () => void {
  const filterEntity = typeof entityOrCb === 'function' ? '*' : entityOrCb;
  const cb = (typeof entityOrCb === 'function' ? entityOrCb : maybeCb) as StoreListener;
  const wrapped: StoreListener = (change) => {
    if (filterEntity === '*' || change.entity === filterEntity || change.entity === '*') cb(change);
  };
  listeners.add(wrapped);
  return () => { listeners.delete(wrapped); };
}
