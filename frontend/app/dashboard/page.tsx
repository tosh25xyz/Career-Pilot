'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import Link from 'next/link';
import {
  Briefcase, Target, TrendingUp, Brain, Zap, ArrowRight,
  Upload, Loader2, MessageSquare, Calendar,
} from 'lucide-react';
import NudgeCard from '@/components/dashboard/NudgeCard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface Summary {
  has_cv: boolean;
  cv_filename: string | null;
  total_jobs_applications: number;
  applications_by_status: Record<string, number>;
  chat_sessions_count: number;
  overall_progress: number;
  nudges: any[];
}

function DashboardContent() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setSummary(res.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  if (!mounted) return null;

  const firstName = user?.firstName ?? 'there';

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ height: '28px', width: '200px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '100px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    );
  }

  const apps = summary?.applications_by_status ?? {};
  const totalApplied = (apps.applied ?? 0) + (apps.interviewing ?? 0) + (apps.offer ?? 0);

  return (
    <div style={{
      padding: '24px 20px', maxWidth: '1100px', margin: '0 auto',
      fontFamily: "'DM Sans', sans-serif",
    }} className="dashboard-content">

      {/* Header */}
      <div className="header-row" style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '20px', gap: '16px', flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            Good day, {firstName} 👋
          </h1>
        </div>
        <Link href="/dashboard/cv" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: 'white', textDecoration: 'none', flexShrink: 0,
        }}>
          <Upload size={15} /> {summary?.has_cv ? 'Update CV' : 'Upload CV'}
        </Link>
      </div>

      {/* Nudges — the integration glue */}
      {error ? (
        <div style={{
          padding: '14px 16px', borderRadius: '14px', marginBottom: '20px',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: '13px', color: 'rgba(255,255,255,0.6)',
        }}>
          Couldn't load your activity summary right now. The rest of the app still works — try refreshing.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {summary?.nudges.map((n, i) => <NudgeCard key={i} nudge={n} />)}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', marginBottom: '20px',
      }}>
        {[
          { label: 'Applications', value: summary?.total_jobs_applications ?? 0, icon: Briefcase, color: '#7c3aed' },
          { label: 'Applied/Active', value: totalApplied, icon: TrendingUp, color: '#3b82f6' },
          { label: 'AI Conversations', value: summary?.chat_sessions_count ?? 0, icon: MessageSquare, color: '#10b981' },
          { label: 'Overall Progress', value: `${summary?.overall_progress ?? 0}%`, icon: Target, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{s.label}</span>
              <s.icon size={15} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="actions-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px',
      }}>
        {[
          { href: '/dashboard/cv',        icon: Upload,        color: '#7c3aed', title: 'CV Intelligence', desc: 'Upload or update your CV' },
          { href: '/dashboard/jobs',      icon: Briefcase,     color: '#3b82f6', title: 'Job Hunter',      desc: 'Find and score opportunities' },
          { href: '/dashboard/assistant', icon: Zap,           color: '#10b981', title: 'AI Assistant',    desc: 'Roadmaps, cover letters, prep' },
          { href: '/dashboard/tracker',   icon: Brain,         color: '#f59e0b', title: 'Tracker',         desc: 'Manage your pipeline' },
          { href: '/dashboard/calendar',  icon: Calendar,      color: '#ec4899', title: 'Calendar',        desc: 'Deadlines and tasks' },
        ].map(({ href, icon: Icon, color, title, desc }) => (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px',
            borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: `${color}15`, border: `1px solid ${color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{title}</div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)' }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color, marginTop: 'auto' }}>
              Open <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .header-row { flex-direction: column; align-items: stretch; }
          .dashboard-content { padding: 16px 14px; }
        }
      `}</style>
    </div>
  );
}

// Wrap in ErrorBoundary — এই page crash করলেও sidebar/nav কাজ করবে
export default function DashboardPage() {
  return (
    <ErrorBoundary fallbackTitle="Dashboard couldn't load">
      <DashboardContent />
    </ErrorBoundary>
  );
}
