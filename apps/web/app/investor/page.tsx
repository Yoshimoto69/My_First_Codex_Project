import { WorkspaceShell } from '@/components/WorkspaceShell';

export const metadata = {
  title: 'Investor Workspace — Portfolio Tracker',
};

export default function InvestorPage() {
  const holdings = [
    { id: 'parcel-1', address: '10 Sample St, Marrickville NSW', equity: 820000, last_update: '2024-01-10' },
    { id: 'parcel-2', address: '25 Oak Ave, Coorparoo QLD', equity: 540000, last_update: '2024-01-05' }
  ];

  return (
    <WorkspaceShell
      role="investor"
      title="Investor Workspace"
      description="Monitor equity positions and plan renovation ROI."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Portfolio overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Connect to Supabase portfolio tables to display live holdings.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="py-2">Address</th>
              <th className="py-2">Equity</th>
              <th className="py-2">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.id} className="border-t border-slate-100">
                <td className="py-3 text-slate-700">{holding.address}</td>
                <td className="py-3 font-medium text-brand-primary">${holding.equity.toLocaleString()}</td>
                <td className="py-3 text-slate-500">{holding.last_update}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspaceShell>
  );
}
