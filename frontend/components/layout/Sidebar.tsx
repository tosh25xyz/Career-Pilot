'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard, Briefcase, Brain, MessageSquare,
  Calendar, BarChart3, FileText, Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/cv',        icon: FileText,         label: 'My CV' },
  { href: '/dashboard/jobs',      icon: Briefcase,        label: 'Job Hunter' },
  { href: '/dashboard/assistant', icon: MessageSquare,    label: 'AI Assistant' },
  { href: '/dashboard/tracker',   icon: Brain,            label: 'Tracker' },
  { href: '/dashboard/calendar',  icon: Calendar,         label: 'Calendar' },
  { href: '/dashboard/progress',  icon: BarChart3,        label: 'Progress' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#090d18' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display font-bold text-base">CareerPilot</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'text-white'
                  : 'hover:text-white/80'
              )}
              style={active
                ? { background: 'rgba(40,171,253,0.12)', color: '#28abfd', border: '1px solid rgba(40,171,253,0.2)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
              }>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Account</span>
        </div>
      </div>
    </aside>
  );
}
