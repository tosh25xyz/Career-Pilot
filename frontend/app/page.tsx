'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export default function HomePage() {

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #080b18;
      color: white;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 4px; }

    .page { min-height: 100vh; background: #080b18; position: relative; overflow: hidden; }

    /* Grid bg */
    .page::before {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
      background-size: 44px 44px;
    }

    /* Orbs */
    .orb {
      position: fixed; border-radius: 50%;
      filter: blur(100px); pointer-events: none; z-index: 0;
    }
    .orb-1 {
      width: 700px; height: 700px;
      background: radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%);
      top: -200px; left: -150px;
    }
    .orb-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(79,70,229,0.1), transparent 70%);
      top: 300px; right: -100px;
    }
    .orb-3 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%);
      bottom: 0; left: 40%;
    }

    /* ── Navbar ── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 48px;
      background: rgba(8,11,24,0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .nav-logo {
      display: flex; align-items: center; gap: 10px; text-decoration: none;
    }
    .nav-logo-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(124,58,237,0.4);
      font-size: 18px;
    }
    .nav-logo-text {
      font-weight: 800; font-size: 16px; color: white; letter-spacing: -0.02em;
    }
    .nav-links { display: flex; align-items: center; gap: 10px; }
    .btn-nav-ghost {
      padding: 9px 20px; border-radius: 10px; font-size: 13px;
      font-weight: 600; color: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.08);
      background: transparent; cursor: pointer; text-decoration: none;
      transition: all 0.2s ease; display: inline-flex; align-items: center;
    }
    .btn-nav-ghost:hover {
      color: white; border-color: rgba(124,58,237,0.4);
      background: rgba(124,58,237,0.08);
    }
    .btn-nav-primary {
      padding: 9px 22px; border-radius: 10px; font-size: 13px;
      font-weight: 700; color: white; text-decoration: none;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,0.35);
      transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-nav-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 30px rgba(124,58,237,0.5);
    }

    /* ── Hero ── */
    .hero {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto;
      padding: 100px 48px 80px;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 18px; border-radius: 99px; margin-bottom: 32px;
      background: rgba(124,58,237,0.1);
      border: 1px solid rgba(124,58,237,0.25);
      font-size: 12px; font-weight: 600; color: #a78bfa;
      letter-spacing: 0.02em;
    }
    .hero-badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #7c3aed;
      box-shadow: 0 0 8px rgba(124,58,237,0.8);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    .hero-title {
      font-size: 72px; font-weight: 800; line-height: 1.05;
      letter-spacing: -0.04em; color: white; margin-bottom: 24px;
    }
    .hero-title-gradient {
      background: linear-gradient(135deg, #a78bfa, #7c3aed, #4f46e5);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 18px; line-height: 1.7; color: rgba(255,255,255,0.5);
      max-width: 600px; margin: 0 auto 40px;
    }
    .hero-sub em { color: rgba(255,255,255,0.75); font-style: normal; font-weight: 500; }

    .hero-cta { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 48px; }
    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 700;
      color: white; text-decoration: none;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border: none; cursor: pointer;
      box-shadow: 0 8px 32px rgba(124,58,237,0.4);
      transition: all 0.25s ease;
    }
    .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(124,58,237,0.55); }
    .btn-hero-ghost {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 600;
      color: rgba(255,255,255,0.65); text-decoration: none;
      border: 1px solid rgba(255,255,255,0.1); background: transparent;
      transition: all 0.2s ease; cursor: pointer;
    }
    .btn-hero-ghost:hover { color: white; border-color: rgba(124,58,237,0.4); background: rgba(124,58,237,0.06); }

    .hero-trust { display: flex; align-items: center; justify-content: center; gap: 28px; flex-wrap: wrap; }
    .trust-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.35); }
    .trust-check { color: #10b981; font-size: 15px; }

    /* ── Dashboard Preview ── */
    .preview-wrap {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto;
      padding: 0 48px 80px;
    }
    .preview-card {
      border-radius: 20px; overflow: hidden;
      border: 1px solid rgba(124,58,237,0.2);
      background: rgba(13,16,37,0.9);
      box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.08);
    }
    .preview-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .preview-url {
      margin-left: 12px; font-size: 11px; font-family: monospace;
      color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.04); padding: 3px 12px; border-radius: 6px;
    }
    .preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px; }
    .preview-stat {
      padding: 16px; border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .preview-stat-icon { font-size: 22px; margin-bottom: 10px; }
    .preview-stat-val { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.03em; }
    .preview-stat-label { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
    .preview-nudge {
      margin: 0 20px 20px;
      padding: 14px 16px; border-radius: 14px;
      background: rgba(124,58,237,0.06);
      border: 1px solid rgba(124,58,237,0.15);
      display: flex; align-items: flex-start; gap: 12px;
    }
    .preview-nudge-icon {
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .preview-nudge-label { font-size: 10px; font-weight: 700; color: #a78bfa; letter-spacing: 0.08em; margin-bottom: 4px; }
    .preview-nudge-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; }

    /* ── Features ── */
    .features {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto; padding: 80px 48px;
    }
    .features-header { text-align: center; margin-bottom: 56px; }
    .section-eyebrow {
      display: inline-block;
      font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
      color: #a78bfa; text-transform: uppercase; margin-bottom: 14px;
    }
    .features-title { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; color: white; }
    .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .feature-card {
      padding: 28px; border-radius: 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      transition: all 0.3s ease; cursor: default;
    }
    .feature-card:hover {
      border-color: rgba(124,58,237,0.3);
      background: rgba(124,58,237,0.04);
      transform: translateY(-2px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(124,58,237,0.06);
    }
    .feature-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; margin-bottom: 18px;
    }
    .feature-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 10px; }
    .feature-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.65; margin-bottom: 16px; }
    .feature-tags { display: flex; flex-wrap: wrap; gap: 7px; }
    .tag {
      font-size: 11px; font-weight: 600; padding: 4px 12px;
      border-radius: 99px; letter-spacing: 0.02em;
    }

    /* ── CTA Section ── */
    .cta-section {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto; padding: 0 48px 100px;
    }
    .cta-card {
      padding: 72px 48px; border-radius: 24px; text-align: center;
      background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%);
      border: 1px solid rgba(124,58,237,0.15);
    }
    .cta-title { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; }
    .cta-sub { font-size: 16px; color: rgba(255,255,255,0.45); margin-bottom: 36px; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="page">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ── Navbar ── */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">✦</div>
            <span className="nav-logo-text">CareerPilot</span>
          </a>
          <div className="nav-links">
            <SignedOut>
              <a href="/sign-in" className="btn-nav-ghost">Sign In</a>
              <a href="/sign-up" className="btn-nav-primary">Get Started →</a>
            </SignedOut>
            <SignedIn>
              <a href="/dashboard" className="btn-nav-primary">Dashboard →</a>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Powered by Claude AI · RAG-grounded
          </div>

          <h1 className="hero-title">
            Your AI Career<br />
            <span className="hero-title-gradient">Co-pilot</span>
          </h1>

          <p className="hero-sub">
            Upload your CV once. CareerPilot hunts jobs, scores your fit, drafts cover letters,
            and builds your roadmap — all grounded in <em>your actual experience</em>.
          </p>

          <div className="hero-cta">
            <a href="/sign-up" className="btn-hero-primary">
              Start for Free ✦
            </a>
            <a href="#features" className="btn-hero-ghost">
              See Features →
            </a>
          </div>

          <div className="hero-trust">
            {['No hallucinated profiles', 'RAG-grounded AI', 'Real job data'].map(t => (
              <div key={t} className="trust-item">
                <span className="trust-check">✓</span> {t}
              </div>
            ))}
          </div>
        </section>

        {/* ── Dashboard Preview ── */}
        <div className="preview-wrap">
          <div className="preview-card">
            <div className="preview-bar">
              <div className="dot" style={{ background: '#ef4444' }} />
              <div className="dot" style={{ background: '#f59e0b' }} />
              <div className="dot" style={{ background: '#10b981' }} />
              <div className="preview-url">careerpilot.app/dashboard</div>
            </div>

            <div className="preview-grid">
              {[
                { icon: '📤', val: '28', label: 'Applications Sent',  bg: 'rgba(124,58,237,0.12)' },
                { icon: '📅', val: '7',  label: 'Interviews',         bg: 'rgba(59,130,246,0.12)' },
                { icon: '📈', val: '72%',label: 'Skill Progress',     bg: 'rgba(236,72,153,0.12)' },
                { icon: '🎯', val: '4/5',label: 'Weekly Goal',        bg: 'rgba(16,185,129,0.12)' },
              ].map(s => (
                <div key={s.label} className="preview-stat" style={{ background: s.bg }}>
                  <div className="preview-stat-icon">{s.icon}</div>
                  <div className="preview-stat-val">{s.val}</div>
                  <div className="preview-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="preview-nudge">
              <div className="preview-nudge-icon">✦</div>
              <div>
                <div className="preview-nudge-label">AI NUDGE</div>
                <div className="preview-nudge-text">
                  You haven't applied this week. Based on your CV, here are 3 ML internships in Dhaka that are a strong match...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <section className="features" id="features">
          <div className="features-header">
            <div className="section-eyebrow">Four Pillars</div>
            <h2 className="features-title">Everything you need, in one place</h2>
          </div>

          <div className="features-grid">
            {[
              {
                icon: '💼', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',
                title: 'Job Hunter Agent',
                desc: 'Natural language job search with structured cards, live data, fit scores, and AI reasoning grounded in your CV.',
                tags: ['Live job search', 'Fit scoring', 'Deadline tracking'],
              },
              {
                icon: '🧠', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
                title: 'CV Intelligence (RAG)',
                desc: 'Upload your CV once. Chunked, embedded, and stored as the single source of truth for every AI response.',
                tags: ['PDF/DOCX upload', 'Vector DB', 'Section-aware'],
              },
              {
                icon: '✦', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
                title: 'Personal AI Assistant',
                desc: 'Ask anything — readiness checks, skill gaps, learning roadmaps, and personalized cover letters from your real experience.',
                tags: ['RAG-grounded', 'Cover letters', 'Roadmaps'],
              },
              {
                icon: '📊', color: '#10b981', bg: 'rgba(16,185,129,0.12)',
                title: 'Productivity Tracker',
                desc: 'Kanban board, goal setting, calendar deadlines, progress dashboard, and proactive AI nudges to keep you on track.',
                tags: ['Kanban board', 'Calendar', 'Progress stats'],
              },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
                <div className="feature-tags">
                  {f.tags.map(t => (
                    <span key={t} className="tag" style={{
                      background: f.bg, color: f.color,
                      border: `1px solid ${f.color}30`,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="cta-card">
            <h2 className="cta-title">Ready to pilot your career?</h2>
            <p className="cta-sub">Upload your CV and let AI do the heavy lifting.</p>
            <a href="/sign-up" className="btn-hero-primary" style={{ display: 'inline-flex' }}>
              Get Started Free ✦
            </a>
          </div>
        </section>

      </div>
    </>
  );
}
