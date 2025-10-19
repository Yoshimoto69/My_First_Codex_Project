import Link from 'next/link';

const roles = [
  { slug: 'developer', title: 'Developer Workspace', description: 'Site pipeline, risk cards, feasibility.' },
  { slug: 'agent', title: 'Agent Workspace', description: 'CMA Studio and branded reports.' },
  { slug: 'investor', title: 'Investor Workspace', description: 'Portfolio tracking and renovation ROI.' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-white p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="text-center">
          <h1 className="text-4xl font-semibold text-brand-primary">DevFindr + PricePro</h1>
          <p className="mt-3 text-lg text-slate-600">
            Dual-app platform delivering explainable parcel intelligence, feasibility, and CMAs with provenance.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <Link key={role.slug} href={`/${role.slug}`} className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-slate-900">{role.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{role.description}</p>
              <span className="mt-4 inline-flex items-center text-brand-primary">
                Enter workspace →
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
