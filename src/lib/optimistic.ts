// ---------------------------------------------------------------------
// Shared optimistic-update helpers for the admin CMS screens.
//
// Pattern used everywhere in this app (matches GenericCollectionCMS,
// which was the first screen hardened this way):
//   1. Apply the change to local React state immediately (UI feels
//      instant — no spinner-then-pop-in).
//   2. Fire the real request to the server.
//   3. On success, reconcile local state with whatever the server
//      actually returned (never assume the optimistic guess was exact).
//   4. On failure, restore the exact previous state and surface a real
//      error — never leave the UI claiming a change that Firestore
//      rejected.
//
// A snapshot of "previous state" is captured up front and restored
// verbatim on failure, so rollback is always exact regardless of what
// else changed in the meantime.
// ---------------------------------------------------------------------

import React from 'react';
import { fetchApi } from './api';

type SetItems<T> = React.Dispatch<React.SetStateAction<T[]>>;
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
type Notify = (text: string, type?: 'success' | 'error' | 'info') => void;

interface Labels {
  success: string;
  failure: string;
}

/** Optimistically add a new item to a list-backed collection endpoint. */
export async function optimisticCreate<T extends { id: string }>(
  items: T[],
  setItems: SetItems<T>,
  endpoint: string,
  payload: T,
  notify: Notify,
  labels: Labels
): Promise<boolean> {
  const previous = items;
  setItems(prev => [...prev, payload]);
  try {
    const saved = await fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    setItems(prev => prev.map(it => (it.id === payload.id ? { ...payload, ...(saved || {}) } : it)));
    notify(labels.success, 'success');
    return true;
  } catch (err: any) {
    setItems(previous);
    notify(err?.message || labels.failure, 'error');
    return false;
  }
}

/** Optimistically apply a partial update to one item in a list-backed
 * collection endpoint. Pass only the fields that changed. */
export async function optimisticUpdate<T extends { id: string }>(
  items: T[],
  setItems: SetItems<T>,
  endpoint: string,
  id: string,
  patch: Partial<T>,
  notify: Notify,
  labels: Labels
): Promise<boolean> {
  const previous = items;
  setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  try {
    const saved = await fetchApi<T>(`${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...(saved || patch) } : it)));
    notify(labels.success, 'success');
    return true;
  } catch (err: any) {
    setItems(previous);
    notify(err?.message || labels.failure, 'error');
    return false;
  }
}

/** Optimistically remove one item from a list-backed collection endpoint. */
export async function optimisticDelete<T extends { id: string }>(
  items: T[],
  setItems: SetItems<T>,
  endpoint: string,
  id: string,
  notify: Notify,
  labels: Labels
): Promise<boolean> {
  const previous = items;
  setItems(prev => prev.filter(it => it.id !== id));
  try {
    await fetchApi(`${endpoint}/${id}`, { method: 'DELETE' });
    notify(labels.success, 'success');
    return true;
  } catch (err: any) {
    setItems(previous);
    notify(err?.message || labels.failure, 'error');
    return false;
  }
}

/** Same idea for singleton-document screens (site settings, branding,
 * homepage config, a single page's content) instead of a list. */
export async function optimisticSingletonSave<T>(
  current: T,
  setCurrent: SetState<T>,
  endpoint: string,
  patch: Partial<T>,
  notify: Notify,
  labels: Labels,
  method: 'POST' | 'PUT' = 'POST'
): Promise<boolean> {
  const previous = current;
  setCurrent(prev => ({ ...(prev as any), ...patch } as T));
  try {
    const saved = await fetchApi<T>(endpoint, { method, body: JSON.stringify(patch) });
    setCurrent(prev => ({ ...(prev as any), ...(saved || patch) } as T));
    notify(labels.success, 'success');
    return true;
  } catch (err: any) {
    setCurrent(previous);
    notify(err?.message || labels.failure, 'error');
    return false;
  }
}
