/**
 * Sync status indicator for Sprout v2.
 *
 * Shows sync state in the parent app. Hidden in child app to avoid confusion.
 * Displays: syncing spinner, last sync time, offline badge, error state.
 */

import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icons';
import type { SyncStatus } from '../lib/sync';
import { formatDistanceToNow } from 'date-fns';

interface SyncIndicatorProps {
  status: SyncStatus;
  compact?: boolean;
}

export function SyncIndicator({ status, compact = false }: SyncIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--ink-soft)',
        }}
      >
        {status.status === 'syncing' ? (
          <>
            <div
              style={{
                width: 12,
                height: 12,
                border: '2px solid var(--sky)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span>Syncing...</span>
          </>
        ) : status.status === 'error' ? (
          <>
            <Icon name="arrowr" style={{ width: 12, height: 12, color: 'var(--berry)', transform: 'rotate(45deg)' }} />
            <span style={{ color: 'var(--berry-deep)' }}>Sync error</span>
          </>
        ) : !isOnline ? (
          <>
            <span style={{ fontSize: 14 }}>📡</span>
            <span>Offline</span>
          </>
        ) : status.lastSyncAt ? (
          <>
            <Icon name="check" style={{ width: 12, height: 12, color: 'var(--sprout)' }} />
            <span>Synced {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}</span>
          </>
        ) : (
          <>
            <Icon name="check" style={{ width: 12, height: 12, color: 'var(--ink-soft)' }} />
            <span>Ready</span>
          </>
        )}
      </div>
    );
  }

  // Full status card
  return (
    <div className="card soft" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="eyebrow">Cloud sync</p>
        {status.status === 'syncing' ? (
          <div
            style={{
              width: 16,
              height: 16,
              border: '2px solid var(--sky)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : status.status === 'error' ? (
          <span style={{ fontSize: 18 }}>⚠️</span>
        ) : !isOnline ? (
          <span style={{ fontSize: 18 }}>📡</span>
        ) : (
          <Icon name="check" style={{ width: 16, height: 16, color: 'var(--sprout)' }} />
        )}
      </div>

      {status.status === 'syncing' ? (
        <p className="meta">Syncing your family data...</p>
      ) : status.status === 'error' ? (
        <>
          <p className="body" style={{ color: 'var(--berry-deep)' }}>
            Sync failed: {status.error}
          </p>
          <p className="meta">
            Your changes are saved locally and will sync when the connection is restored.
          </p>
        </>
      ) : !isOnline ? (
        <>
          <p className="body">You're offline</p>
          <p className="meta">
            Everything still works! Your changes will sync automatically when you're back online.
          </p>
          {status.pendingChanges > 0 && (
            <p className="meta" style={{ color: 'var(--sun-deep)' }}>
              {status.pendingChanges} change{status.pendingChanges !== 1 ? 's' : ''} waiting to sync
            </p>
          )}
        </>
      ) : status.lastSyncAt ? (
        <p className="meta">
          Last synced {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}
          {status.pendingChanges > 0 && ` · ${status.pendingChanges} pending`}
        </p>
      ) : (
        <p className="meta">Ready to sync</p>
      )}
    </div>
  );
}

// Add spin animation to global styles if not already present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-sync-animation]')) {
    style.setAttribute('data-sync-animation', 'true');
    document.head.appendChild(style);
  }
}
