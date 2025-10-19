'use client';

import { useEffect, useState } from 'react';
import type { ParcelSummary } from '@devfindr/shared';
import { ProvenancePanel } from './ProvenancePanel';
import { FeasoModal } from './FeasoModal';

interface ParcelRiskCardProps {
  parcelId: string;
}

interface RiskCardResponse {
  parcel: ParcelSummary;
  metrics: Record<string, number>;
  overlays: Array<{
    overlay_type: string;
    authority?: string;
    severity?: string;
  }>;
  da_precedents: Array<{ id: string; proposal: string; status: string }>;
  owner_masked?: string;
}

export function ParcelRiskCard({ parcelId }: ParcelRiskCardProps) {
  const [data, setData] = useState<RiskCardResponse | null>(null);

  useEffect(() => {
    async function fetchRiskCard() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/parcels/${parcelId}/risk-card`);
      const json = await response.json();
      setData(json);
    }
    fetchRiskCard();
  }, [parcelId]);

  if (!data) {
    return <div className="rounded-xl bg-white p-6 shadow">Loading risk card…</div>;
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-brand-primary">Parcel overview</p>
          <h2 className="text-2xl font-semibold text-slate-900">{data.parcel.address}</h2>
          <p className="text-sm text-slate-500">{data.parcel.cad_id} · {data.parcel.zoning_code}</p>
          <div className="flex flex-wrap gap-2">
            {data.overlays.map((overlay) => (
              <span
                key={`${overlay.overlay_type}-${overlay.authority}`}
                className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs text-brand-primary"
              >
                {overlay.overlay_type} · {overlay.severity || 'n/a'}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Area</p>
            <p className="text-lg font-semibold text-slate-900">{data.metrics.area_sqm} m²</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Frontage</p>
            <p className="text-lg font-semibold text-slate-900">{data.metrics.frontage_m} m</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Slope</p>
            <p className="text-lg font-semibold text-slate-900">{data.metrics.slope_pct}%</p>
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">DA precedents</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {data.da_precedents.map((da) => (
              <li key={da.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-800">{da.proposal}</p>
                <p className="text-xs uppercase text-slate-500">Status: {da.status}</p>
              </li>
            ))}
            {data.da_precedents.length === 0 && <li className="text-xs text-slate-400">No DA precedents linked.</li>}
          </ul>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase text-slate-500">Owner (masked)</p>
            <p className="font-medium text-slate-800">{data.owner_masked}</p>
          </div>
          <FeasoModal parcelId={parcelId} />
        </div>
      </div>
      <ProvenancePanel entityType="parcel" entityId={parcelId} />
    </div>
  );
}
