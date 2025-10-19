'use client';

import { useState } from 'react';
import type { FeasoInputs } from '@devfindr/shared';

interface FeasoModalProps {
  parcelId: string;
}

export function FeasoModal({ parcelId }: FeasoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputs, setInputs] = useState<FeasoInputs>({
    parcel_id: parcelId,
    build_cost_m2: 2100,
    siteworks_pct: 8,
    finance_pct: 6,
    contingency_pct: 10,
    gst_pct: 10,
    sales_price_m2: 4200,
    units_n: 12,
    gross_floor_area_sqm: 1080,
    holding_months: 18
  });

  async function runFeaso() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feaso/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const json = await res.json();
      setResult(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
      >
        Feaso-in-a-Click
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <header className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Feasibility Snapshot</h2>
                <p className="text-sm text-slate-500">Adjust assumptions to evaluate IRR & residual.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                Close
              </button>
            </header>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col text-sm text-slate-600">
                Parcel
                <input value={inputs.parcel_id} disabled className="mt-1 rounded-md border border-slate-200 bg-slate-100 px-3 py-2" />
              </div>
              {Object.entries(inputs)
                .filter(([key]) => key !== 'parcel_id')
                .map(([key, value]) => {
                  const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                  return (
                    <label key={key} className="flex flex-col text-sm text-slate-600">
                      {key.replace(/_/g, ' ')}
                      <input
                        type="number"
                        value={numericValue}
                        onChange={(event) =>
                          setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) || 0 }))
                        }
                        className="mt-1 rounded-md border border-slate-200 px-3 py-2"
                      />
                    </label>
                  );
                })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={runFeaso}
                disabled={loading}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                {loading ? 'Running…' : 'Run Feaso'}
              </button>
              {result && (
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-xs uppercase text-slate-500">IRR</p>
                    <p className="text-lg font-semibold text-brand-primary">{result.irr_pct}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Residual</p>
                    <p className="text-lg font-semibold text-brand-primary">
                      ${Number(result.residual).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Margin</p>
                    <p className="text-lg font-semibold text-brand-primary">{Number(result.profit_margin_pct).toFixed(2)}%</p>
                  </div>
                </div>
              )}
            </div>
            {result && (
              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700">Sensitivity</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {result.sensitivity?.map((row: any) => (
                    <li key={row.delta_pct} className="flex justify-between text-slate-600">
                      <span>{row.delta_pct}% revenue shift</span>
                      <span className="font-medium text-brand-primary">{row.irr_pct}% IRR</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
