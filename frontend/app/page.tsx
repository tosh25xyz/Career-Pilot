'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { 
  Briefcase, Brain, Zap, Target, ArrowRight, 
  CheckCircle, Sparkles, TrendingUp, Calendar
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900 bg-grid overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb w-[600px] h-[600px] bg-brand-500/10 top-[-200px] left-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-brand-700/10 top-[300px] right-[-100px]" />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">CareerPilot</span>
        </div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/sign-up" className="btn-primary text-sm">Get Started</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn-primary text-sm">Dashboard</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-mono"
            style={{ background: 'rgba(40,171,253,0.08)', border: '1px solid rgba(40,171,253,0.2)', color: '#28abfd' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Claude AI · RAG-grounded
          </div>

          <h1 className="text-6xl md:text-7xl font-display font-bold leading-tight mb-6"
            style={{ letterSpacing: '-0.03em' }}>
            Your AI Career<br />
            <span style={{ background: 'linear-gradient(135deg, #28abfd, #88dcff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Co-pilot
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Upload your CV once. CareerPilot hunts jobs, scores your fit, drafts cover letters,
            and builds your personalized learning roadmap — all grounded in <em>your actual experience</em>.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="btn-primary text-base px-7 py-3.5">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="btn-ghost text-base px-7 py-3.5">
              See Features
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
            {['No hallucinated profiles', 'RAG-grounded AI', 'Real job data'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#28abfd' }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard Preview Card ── */}
        <div className="mt-20 glass p-6 max-w-5xl mx-auto" style={{ border: '1px solid rgba(40,171,253,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>careerpilot.app/dashboard</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Briefcase, label: 'Jobs Found', value: '142', color: '#28abfd' },
              { icon: Target,    label: 'Avg Fit Score', value: '78%', color: '#34d399' },
              { icon: Brain,     label: 'Skills Gap', value: '3 left', color: '#f59e0b' },
              { icon: TrendingUp,label: 'Applications', value: '12 sent', color: '#a78bfa' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon className="w-5 h-5 mb-3" style={{ color }} />
                <div className="text-xl font-bold font-mono mb-0.5">{value}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs font-mono mb-2" style={{ color: '#28abfd' }}>AI ASSISTANT</div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              💡 "You haven't applied this week. Based on your CV, here are 3 ML internships in Dhaka that are a strong match..."
            </div>
          </div>
        </div>

        {/* ── 4 Pillars ── */}
        <section id="features" className="mt-32">
          <div className="text-center mb-16">
            <div className="section-label mb-3">Four Pillars</div>
            <h2 className="text-4xl font-display font-bold">Everything you need, in one place</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: Briefcase,
                color: '#28abfd',
                title: 'Job Hunter Agent',
                desc: 'Natural language job search with structured cards, fit scores, and AI reasoning on why each role matches your CV.',
                tags: ['Live job search', 'Fit scoring', 'Deadline tracking'],
              },
              {
                icon: Brain,
                color: '#34d399',
                title: 'CV Intelligence (RAG)',
                desc: 'Upload your CV once. It gets chunked, embedded, and becomes the single source of truth for every AI response.',
                tags: ['PDF/DOCX upload', 'Vector DB', 'Section-aware'],
              },
              {
                icon: Sparkles,
                color: '#f59e0b',
                title: 'Personal AI Assistant',
                desc: 'Ask anything — readiness checks, skill gaps, learning roadmaps, and personalized cover letters grounded in your real experience.',
                tags: ['RAG-grounded', 'Cover letters', 'Roadmaps'],
              },
              {
                icon: Calendar,
                color: '#a78bfa',
                title: 'Productivity Tracker',
                desc: 'Kanban application tracker, goal setting, calendar deadlines, progress dashboard, and proactive AI nudges.',
                tags: ['Kanban board', 'Calendar', 'Progress stats'],
              },
            ].map(({ icon: Icon, color, title, desc, tags }) => (
              <div key={title} className="glass-hover p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full font-mono"
                      style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="mt-32 text-center glass p-16"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(40,171,253,0.08) 0%, transparent 70%)', border: '1px solid rgba(40,171,253,0.12)' }}>
          <h2 className="text-4xl font-display font-bold mb-4">Ready to pilot your career?</h2>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Upload your CV and let AI do the heavy lifting.</p>
          <Link href="/sign-up" className="btn-primary text-base px-8 py-4">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
