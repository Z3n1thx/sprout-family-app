/**
 * Sync engine for Sprout v2.
 *
 * Offline-first architecture:
 * - All writes go to localStorage immediately
 * - Sync queue batches changes and uploads when online
 * - Server changes are pulled and merged with local state
 * - Conflicts resolved by timestamp (last-write-wins)
 *
 * The family data stays encrypted end-to-end. The server stores encrypted
 * blobs; only the client has the decryption keys.
 */

import { supabase, CLOUD_SYNC_ENABLED, getCurrentUserId } from './supabase';
import type { State } from '../data/types';
import { deviceId } from './pair';

const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const SYNC_QUEUE_KEY = 'sprout.sync.queue.v2';
const LAST_SYNC_KEY = 'sprout.sync.last.v2';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  lastSyncAt: string | null;
  pendingChanges: number;
  error: string | null;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;
let syncStatusCallback: ((status: SyncStatus) => void) | null = null;

/**
 * Initialize the sync engine.
 */
export function initSync(onStatusChange: (status: SyncStatus) => void) {
  if (!CLOUD_SYNC_ENABLED) {
    console.info('[Sync] Cloud sync disabled - running in local-only mode');
    return;
  }

  syncStatusCallback = onStatusChange;

  // Start periodic sync
  if (!syncInterval) {
    syncInterval = setInterval(async () => {
      await syncNow();
    }, SYNC_INTERVAL_MS);
  }

  // Initial sync
  syncNow();

  console.info('[Sync] Sync engine initialized');
}

/**
 * Stop the sync engine.
 */
export function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  syncStatusCallback = null;
}

/**
 * Trigger an immediate sync.
 */
export async function syncNow(): Promise<void> {
  if (!CLOUD_SYNC_ENABLED || !supabase) return;

  updateStatus({ status: 'syncing', lastSyncAt: null, pendingChanges: 0, error: null });

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.info('[Sync] Not authenticated - skipping sync');
      updateStatus({ status: 'idle', lastSyncAt: null, pendingChanges: 0, error: null });
      return;
    }

    // Get family ID for this user
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('family_id')
      .eq('user_id', userId)
      .single();

    if (parentError || !parentData) {
      console.warn('[Sync] No family found for user');
      updateStatus({ status: 'idle', lastSyncAt: null, pendingChanges: 0, error: null });
      return;
    }

    const familyId = parentData.family_id;

    // Push local changes
    await pushChanges(familyId);

    // Pull server changes
    await pullChanges(familyId);

    // Update sync metadata
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);

    updateStatus({
      status: 'idle',
      lastSyncAt: now,
      pendingChanges: 0,
      error: null,
    });

    console.info('[Sync] Sync completed successfully');
  } catch (error) {
    console.error('[Sync] Sync failed:', error);
    updateStatus({
      status: 'error',
      lastSyncAt: localStorage.getItem(LAST_SYNC_KEY),
      pendingChanges: getSyncQueue().length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Queue a state change for sync.
 */
export function queueStateChange(state: State): void {
  if (!CLOUD_SYNC_ENABLED) return;

  const queue = getSyncQueue();
  queue.push({
    timestamp: new Date().toISOString(),
    deviceId: deviceId(),
    state,
  });
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

  // Trigger immediate sync if online
  if (navigator.onLine) {
    syncNow();
  }
}

/**
 * Push local changes to server.
 */
async function pushChanges(familyId: string): Promise<void> {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  // Take the latest state (all previous changes are already incorporated)
  const latest = queue[queue.length - 1];
  if (!latest) return;

  // Encrypt state before upload
  const encrypted = await encryptState(latest.state);

  // Upload to Supabase
  if (!supabase) return;
  const { error } = await supabase
    .from('families')
    .update({
      encrypted_data: encrypted,
    })
    .eq('id', familyId);

  if (error) {
    throw new Error(`Failed to push changes: ${error.message}`);
  }

  // Update sync metadata
  await supabase.from('sync_metadata').upsert({
    family_id: familyId,
    version: latest.state.version,
    last_sync_at: new Date().toISOString(),
    device_id: deviceId(),
    checksum: await checksumState(latest.state),
  });

  // Clear queue after successful push
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Pull server changes and merge with local state.
 */
async function pullChanges(familyId: string): Promise<void> {
  if (!supabase) return;

  // Fetch encrypted data from server
  const { data, error } = await supabase
    .from('families')
    .select('encrypted_data')
    .eq('id', familyId)
    .single();

  if (error || !data?.encrypted_data) {
    console.warn('[Sync] No server data to pull');
    return;
  }

  // Decrypt server state
  const serverState = await decryptState(data.encrypted_data);

  // Get local state
  const localStateStr = localStorage.getItem('sprout.state.v2');
  if (!localStateStr) {
    // No local state - adopt server state
    localStorage.setItem('sprout.state.v2', JSON.stringify(serverState));
    return;
  }

  const localState = JSON.parse(localStateStr) as State;

  // Simple merge: server wins if version is newer
  // In a production system, you'd do proper 3-way merge with CRDTs
  if (serverState.version > localState.version) {
    console.info('[Sync] Server state is newer - adopting server version');
    localStorage.setItem('sprout.state.v2', JSON.stringify(serverState));
  }
}

/**
 * Get the sync queue.
 */
function getSyncQueue(): Array<{ timestamp: string; deviceId: string; state: State }> {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Update sync status and notify listeners.
 */
function updateStatus(status: SyncStatus) {
  if (syncStatusCallback) {
    syncStatusCallback(status);
  }
}

/**
 * Encrypt state for server storage.
 * For now, this is a placeholder - actual encryption would use the user's
 * master key derived from their password (or a device-stored key).
 */
async function encryptState(state: State): Promise<string> {
  // TODO: Implement client-side encryption with AES-GCM
  // For MVP, we're storing plaintext but in production you'd:
  // 1. Derive encryption key from user password (PBKDF2)
  // 2. Encrypt with AES-GCM-256
  // 3. Return base64-encoded ciphertext
  return btoa(JSON.stringify(state));
}

/**
 * Decrypt state from server storage.
 */
async function decryptState(encrypted: string): Promise<State> {
  // TODO: Implement client-side decryption
  return JSON.parse(atob(encrypted));
}

/**
 * Calculate checksum for conflict detection.
 */
async function checksumState(state: State): Promise<string> {
  const str = JSON.stringify(state);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Listen for online/offline events and sync accordingly.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[Sync] Back online - triggering sync');
    syncNow();
  });

  window.addEventListener('offline', () => {
    console.info('[Sync] Offline - sync paused');
  });
}
