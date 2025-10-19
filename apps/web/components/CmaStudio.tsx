'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ParcelSummary } from '@devfindr/shared';

interface CmaStudioProps {
  subjectParcelId: string;
}

export function CmaStudio({ subjectParcelId }: CmaStudioProps) {
  const [parcels, setParcels] = useState<ParcelSummary[]>([]);
  const [selected, setSelected] = useState<ParcelSummary[]>([]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    async function loadParcels() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/parcels/search?q=`);
      const json = await response.json();
      setParcels(json.items ?? []);
    }
    loadParcels();
  }, []);

  const valuationBand = useMemo(() => {
    if (selected.length === 0) {
      return null;
    }
    const prices = selected.map((parcel) => parcel.last_sale_price ?? 0).filter(Boolean);
    const avg = prices.reduce((acc, val) => acc + val, 0) / prices.length;
    return {
      low: Math.round(avg * 0.95),
      base: Math.round(avg),
      high: Math.round(avg * 1.05)
    };
  }, [selected]);

  async function composeCma() {
    try {
      setStatus('Generating…');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cma/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_parcel_id: subjectParcelId,
          comps: selected.map((parcel) => ({ parcel_id: parcel.id })),
          branding_options: { agent_name: 'Sample Agent' }
        })
      });
      const json = await response.json();
      setStatus(`Report ${json.report_id} ${json.status}`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to queue report');
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Comparable sales</h2>
            <p className="text-sm text-slate-500">Drag comps into selection to calculate valuation band.</p>
          </div>
          <button
            onClick={composeCma}
            disabled={selected.length === 0}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            Generate CMA PDF
          </button>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {parcels.map((parcel) => (
            <article
              key={parcel.id}
              className="rounded-xl border border-slate-200 p-4 shadow-sm transition hover:-translate-y-1"
            >
              <h3 className="text-sm font-semibold text-slate-800">{parcel.address}</h3>
              <p className="text-xs text-slate-500">{parcel.cad_id}</p>
              <p className="mt-2 text-sm text-brand-primary">${parcel.last_sale_price?.toLocaleString() ?? 'N/A'}</p>
              <button
                className="mt-4 w-full rounded-md border border-brand-primary px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10"
                onClick={() =>
                  setSelected((prev) =>
                    prev.find((item) => item.id === parcel.id)
                      ? prev
                      : [...prev, parcel]
                  )
                }
              >
                Add comp
              </button>
            </article>
          ))}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-brand-primary/20 bg-white p-5 shadow">
          <h3 className="text-sm font-semibold text-slate-800">Selection</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {selected.map((parcel) => (
              <li key={parcel.id} className="flex items-center justify-between">
                <span>{parcel.address}</span>
                <button
                  onClick={() => setSelected((prev) => prev.filter((p) => p.id !== parcel.id))}
                  className="text-xs text-brand-primary"
                >
                  Remove
                </button>
              </li>
            ))}
            {selected.length === 0 && <li className="text-xs text-slate-400">Drag comps into your selection.</li>}
          </ul>
        </div>
        {valuationBand && (
          <div className="rounded-2xl border border-slate-200 bg-brand-primary/5 p-5 text-center text-sm">
            <p className="text-xs uppercase text-slate-500">Valuation band</p>
            <p className="mt-2 text-2xl font-semibold text-brand-primary">${valuationBand.base.toLocaleString()}</p>
            <p className="text-xs text-slate-500">
              Range ${valuationBand.low.toLocaleString()} - ${valuationBand.high.toLocaleString()}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <h3 className="text-sm font-semibold text-slate-800">Status</h3>
          <p className="mt-2 text-slate-500">{status || 'Select comps to enable PDF export.'}</p>
        </div>
      </aside>
    </div>
  );
}
