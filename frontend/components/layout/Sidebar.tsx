'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  LayoutDashboard, Briefcase, MessageSquare,
  FileText, BarChart3, Map, Calendar,
  Settings, ChevronDown, Crown
} from 'lucide-react';

const nav = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/jobs',      icon: Briefcase,        label: 'Job Hunter',          badge: null },
  { href: '/dashboard/assistant', icon: MessageSquare,    label: 'AI Assistant',        badge: null },
  { href: '/dashboard/cv',        icon: FileText,         label: 'Resume Intelligence', badge: null },
  { href: '/dashboard/progress',  icon: BarChart3,        label: 'Progress Tracker',    badge: null },
  { href: '/dashboard/tracker',   icon: FileText,         label: 'Applications',        badge: 12 },
  { href: '/dashboard/roadmap',   icon: Map,              label: 'Roadmap',             badge: null },
  { href: '/dashboard/calendar',  icon: Calendar,         label: 'Calendar',            badge: null },
  { href: '/dashboard/settings',  icon: Settings,         label: 'Settings',            badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside style={{
      width: '230px',
      minWidth: '230px',
      height: '100vh',
      background: '#0a0d1a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          }}>
            {/* Star icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', letterSpacing: '-0.02em' }}>
              CareerPilot
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
              Your AI Career Co-pilot
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {nav.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px', marginBottom: '2px',
                transition: 'all 0.15s ease', cursor: 'pointer',
                background: active ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))' : 'transparent',
                border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                }
              }}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', fontWeight: active ? 600 : 400, flex: 1 }}>
                  {label}
                </span>
                {badge && (
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 7px',
                    borderRadius: '20px', background: 'rgba(124,58,237,0.3)',
                    color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)',
                  }}>{badge}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Upgrade Card ── */}
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{
          borderRadius: '14px', padding: '14px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))',
          border: '1px solid rgba(124,58,237,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Crown size={14} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Level up your career 🚀</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px', lineHeight: 1.4 }}>
            Complete your profile to unlock better matches
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '5px', marginBottom: '4px' }}>
            <div style={{
              width: '75%', height: '100%', borderRadius: '99px',
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            }} />
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>75%</div>
        </div>
      </div>

      {/* ── User ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <UserButton afterSignOutUrl="/" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', truncate: true }}>
            {user?.fullName ?? 'User'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            {user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? 'Software Engineer'}
          </div>
        </div>
        <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
      </div>
    </aside>
  );
}
