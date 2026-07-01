/**
 * DEV-ONLY floating control to switch between demo accounts and reset seed data.
 * Lets us review every role-gated page offline. Remove (or guard behind an env
 * flag) before any real deployment.
 */
import { useState } from 'react';
import { DEMO_ACCOUNTS, getCurrentUserId, setCurrentUserId } from '@/data/session';
import { resetDB } from '@/data/store';

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const currentId = getCurrentUserId();

  const switchTo = (id: string) => {
    setCurrentUserId(id);
    window.location.reload();
  };

  const reset = () => {
    resetDB();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans text-sm">
      {open ? (
        <div className="w-64 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-foreground">Dev · Switch role</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                onClick={() => switchTo(a.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                  currentId === a.id ? 'bg-gray-900 text-white' : 'hover:bg-accent text-foreground'
                }`}
              >
                <div className="font-medium">{a.label}</div>
                <div className={`text-xs ${currentId === a.id ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>{a.description}</div>
              </button>
            ))}
          </div>
          <button
            onClick={reset}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-muted-foreground hover:bg-accent"
          >
            ↺ Reset demo data
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-gray-900 px-4 py-2 font-medium text-white shadow-lg hover:bg-gray-700"
        >
          Dev
        </button>
      )}
    </div>
  );
}
