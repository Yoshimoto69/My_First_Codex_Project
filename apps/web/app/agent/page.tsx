import { WorkspaceShell } from '@/components/WorkspaceShell';
import { CmaStudio } from '@/components/CmaStudio';

export const metadata = {
  title: 'Agent Workspace — CMA Studio',
};

export default function AgentPage() {
  return (
    <WorkspaceShell
      role="agent"
      title="Agent Workspace"
      description="Build CMA packages and share branded reports."
    >
      <CmaStudio subjectParcelId="parcel-1" />
    </WorkspaceShell>
  );
}
