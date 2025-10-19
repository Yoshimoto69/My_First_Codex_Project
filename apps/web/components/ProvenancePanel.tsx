'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { ProvenanceEntry } from '@devfindr/shared';

interface ProvenancePanelProps {
  entityType: string;
  entityId: string;
}

export function ProvenancePanel({ entityType, entityId }: ProvenancePanelProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ProvenanceEntry[]>([]);

  useEffect(() => {
    async function fetchProvenance() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/provenance/${entityType}/${entityId}`);
        const json = await res.json();
        setEntries(json.items ?? []);
      } catch (error) {
        console.error('Provenance fetch failed', error);
      }
    }
    fetchProvenance();
  }, [entityType, entityId]);

  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-brand-primary px-4 py-2 text-sm text-white shadow-lg"
      >
        {open ? 'Hide' : 'Show'} provenance
      </button>
      <div
        className={clsx(
          'provenance-panel mt-3 w-80 rounded-2xl bg-white p-4 text-sm text-slate-700 transition-all',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <h3 className="font-semibold text-slate-900">Source & licence</h3>
        <ul className="mt-2 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="border-b border-slate-100 pb-3 last:border-none">
              <p className="font-medium">{entry.source_name}</p>
              <p className="text-xs text-slate-500">
                <a className="text-brand-primary" href={entry.source_url} target="_blank" rel="noreferrer">
                  {entry.source_url}
                </a>
              </p>
              <p className="mt-1 text-xs text-slate-500">Licence: {entry.license}</p>
              <p className="text-xs text-slate-400">Last fetched: {new Date(entry.fetched_at).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Refresh cadence: {entry.refresh_cadence}</p>
            </li>
          ))}
        </ul>
        {entries.length === 0 && <p className="text-xs text-slate-400">Loading provenance...</p>}
      </div>
    </div>
  );
}
