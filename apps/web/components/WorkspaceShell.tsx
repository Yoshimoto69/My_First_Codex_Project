'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import clsx from 'clsx';

const navItems = {
  developer: [
    { href: '/developer', label: 'Parcel Pipeline' },
    { href: '/developer/feaso', label: 'Feaso-in-a-Click' },
    { href: '/developer/outreach', label: 'Outreach Lists', disabled: true }
  ],
  agent: [
    { href: '/agent', label: 'CMA Studio' },
    { href: '/agent/reports', label: 'Branded Reports', disabled: true }
  ],
  investor: [
    { href: '/investor', label: 'Portfolio Tracker' },
    { href: '/investor/roi', label: 'Renovation ROI', disabled: true }
  ]
} as const;

interface WorkspaceShellProps {
  role: keyof typeof navItems;
  children: ReactNode;
  title: string;
  description: string;
}

export function WorkspaceShell({ role, children, title, description }: WorkspaceShellProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <button
            className="rounded-md border border-brand-primary px-3 py-1 text-sm text-brand-primary"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? 'Hide' : 'Show'} navigation
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px,1fr]">
        <nav className={clsx('space-y-2', { hidden: !open, 'md:block': true })}>
          {navItems[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-disabled={item.disabled}
              className={clsx(
                'block rounded-lg px-3 py-2 text-sm transition',
                item.disabled
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-white text-slate-700 hover:bg-brand-primary/10 hover:text-brand-primary'
              )}
            >
              {item.label}
              {item.disabled && <span className="ml-2 rounded bg-slate-200 px-2 text-xs uppercase">Soon</span>}
            </Link>
          ))}
        </nav>
        <section className="space-y-6">{children}</section>
      </div>
    </div>
  );
}
