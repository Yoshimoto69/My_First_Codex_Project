import { WorkspaceShell } from '@/components/WorkspaceShell';
import { ParcelRiskCard } from '@/components/ParcelRiskCard';

export const metadata = {
  title: 'Developer Workspace — Parcel Pipeline',
};

export default function DeveloperPage() {
  return (
    <WorkspaceShell
      role="developer"
      title="Developer Workspace"
      description="Screen parcels, assess risks, and launch feasibility."
    >
      <ParcelRiskCard parcelId="parcel-1" />
    </WorkspaceShell>
  );
}
