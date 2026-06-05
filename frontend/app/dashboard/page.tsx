import { currentUser } from '@clerk/nextjs/server';
import { Briefcase, Target, TrendingUp, Brain, Zap, ArrowRight, Upload } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? 'there';

  const stats = [
    { label: 'Jobs Found',    value: '0',   icon: Briefcase, color: '#28abfd', change: 'Search now →' },
    { label: 'Avg Fit Score', value: '—',   icon: Target,    color: '#34d399', change: 'Upload CV first' },
    { label: 'Applications',  value: '0',   icon: TrendingUp,color: '#a78bfa', change: 'Track now →' },
    { label: 'Skills Gaps',   value: '—',   icon: Brain,     color: '#f59e0b', change: 'Upload CV first' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="section-label mb-1">Welcome back</p>
          <h1 className="text-3xl font-display font-bold">Good morning, {firstName} 👋</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Your career co-pilot is ready. Start by uploading your CV.
          </p>
        </div>
        <Link href="/dashboard/cv" className="btn-primary">
          <Upload className="w-4 h-4" /> Upload CV
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="glass p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono mb-1">{value}</div>
            <div className="text-xs" style={{ color }}>{change}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            href: '/dashboard/cv',
            icon: Upload,
            color: '#28abfd',
            title: 'Upload Your CV',
            desc: 'Start here — your CV powers everything',
            cta: 'Upload now',
            priority: true,
          },
          {
            href: '/dashboard/jobs',
            icon: Briefcase,
            color: '#34d399',
            title: 'Hunt Jobs',
            desc: 'Search in natural language, get structured results',
            cta: 'Search jobs',
            priority: false,
          },
          {
            href: '/dashboard/assistant',
            icon: Zap,
            color: '#a78bfa',
            title: 'Ask AI Assistant',
            desc: 'Get a roadmap, cover letter, or readiness check',
            cta: 'Start chat',
            priority: false,
          },
        ].map(({ href, icon: Icon, color, title, desc, cta, priority }) => (
          <Link key={href} href={href}
            className="glass-hover p-5 flex flex-col gap-3 group"
            style={priority ? { border: '1px solid rgba(40,171,253,0.25)' } : {}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</div>
            </div>
            <div className="flex items-center gap-1 text-sm mt-auto" style={{ color }}>
              {cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* AI Nudge */}
      <div className="glass p-5" style={{ background: 'rgba(40,171,253,0.04)', border: '1px solid rgba(40,171,253,0.12)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <div className="text-xs font-mono text-brand-400 mb-1">AI NUDGE</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Upload your CV to unlock personalized job matches, skill gap analysis, and your first AI-generated cover letter. It only takes 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
