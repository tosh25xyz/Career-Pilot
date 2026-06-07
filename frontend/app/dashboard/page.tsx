'use client';

import { useState } from 'react';
import {
  Send, Calendar, TrendingUp, Target,
  Bell, MessageSquare, Search, Sparkles,
  CheckCircle2, Clock, AlertCircle, X,
  ChevronRight, Plus, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ── Mock Data ────────────────────────────────────────────────────
const weeklyData = [
  { day: 'Mon', apps: 3 }, { day: 'Tue', apps: 5 },
  { day: 'Wed', apps: 4 }, { day: 'Thu', apps: 8 },
  { day: 'Fri', apps: 18 }, { day: 'Sat', apps: 14 },
  { day: 'Sun', apps: 12 },
];

const pieData = [
  { name: 'Applied',      value: 28, color: '#7c3aed' },
  { name: 'Interviewing', value: 7,  color: '#3b82f6' },
  { name: 'Offer',        value: 3,  color: '#10b981' },
  { name: 'Rejected',     value: 12, color: '#ef4444' },
];

const jobMatches = [
  { role: 'ML Engineer Intern',   company: 'Google',  location: 'Dhaka, BD', match: 98, color: '#ea4335', logo: 'G' },
  { role: 'Data Engineer Intern', company: 'Meta',    location: 'Remote',    match: 92, color: '#1877f2', logo: 'M' },
  { role: 'Backend Developer',    company: 'Shohoz',  location: 'Dhaka, BD', match: 88, color: '#00b14f', logo: 'S' },
];

const deadlines = [
  { role: 'Google ML Intern',     type: 'Application Deadline', urgency: 'tomorrow',   color: '#ef4444' },
  { role: 'BRACNet Dev Intern',   type: 'Application Deadline', urgency: '3 days left', color: '#f59e0b' },
  { role: 'Samsung R&D Intern',   type: 'Application Deadline', urgency: '5 days left', color: '#10b981' },
];

const skills = [
  { name: 'Python',           level: 'Advanced',     pct: 85, color: '#3b82f6' },
  { name: 'Machine Learning', level: 'Intermediate', pct: 72, color: '#8b5cf6' },
  { name: 'SQL',              level: 'Advanced',     pct: 68, color: '#06b6d4' },
  { name: 'Data Structures',  level: 'Intermediate', pct: 55, color: '#f59e0b' },
];

const tasks = [
  { label: 'Apply to 5 jobs',         progress: '5 / 5',     done: true  },
  { label: 'Finish DSA - Arrays',     progress: 'Completed', done: true  },
  { label: 'Update Resume',           progress: 'High Priority', done: false, urgent: true },
  { label: 'Finish ML Course - Week 3', progress: '2 days left', done: false, urgent: false },
];

const roadmap = [
  { label: 'Foundations',  done: true },
  { label: 'Core Skills',  done: true },
  { label: 'Advanced Skills', done: false, active: true },
  { label: 'Job Ready',    done: false, locked: true },
];

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, iconBg }: any) {
  return (
    <div style={{
      background: gradient,
      borderRadius: '16px', padding: '20px 22px',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: '10px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</div>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [showAI, setShowAI] = useState(true);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
    .recharts-tooltip-wrapper { outline: none; }
    .custom-tooltip {
      background: #13172b; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 8px 12px; font-family: 'DM Sans', sans-serif;
    }
  `;

  const S: any = {
    page: {
      flex: 1, overflowY: 'auto', background: '#0d1025',
      fontFamily: "'DM Sans', sans-serif", color: 'white',
    },
    // Topbar
    topbar: {
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: '#0d1025', position: 'sticky', top: 0, zIndex: 10,
    },
    greeting: { flex: 1 },
    searchBox: {
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '9px 16px', width: '340px',
    },
    askBtn: {
      display: 'flex', alignItems: 'center', gap: '8px',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      border: 'none', borderRadius: '12px', padding: '10px 20px',
      color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    },
    iconBtn: {
      width: '38px', height: '38px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', position: 'relative' as const,
    },
    badge: {
      position: 'absolute' as const, top: '-4px', right: '-4px',
      background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700,
      borderRadius: '99px', minWidth: '16px', height: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
    },
    // Content
    content: { padding: '24px 28px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
    row: { display: 'flex', gap: '16px' },
    card: {
      background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.07)', padding: '20px',
    },
    cardTitle: { fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '14px' },
    sectionLabel: {
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
      color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: '10px',
    },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip">
          <div style={{ color: '#a78bfa', fontWeight: 700 }}>{payload[0].value} apps</div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>{css}</style>
      <div style={S.page}>

        {/* ── Topbar ── */}
        <div style={S.topbar}>
          <div style={S.greeting}>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              👋 Hey, Mahfuz!
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              Let's make this week productive.
            </div>
          </div>

          {/* Search */}
          <div style={S.searchBox}>
            <Search size={15} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
              Search jobs, skills, companies...
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px',
            }}>⌘K</span>
          </div>

          {/* Icons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={S.iconBtn}>
              <Bell size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <div style={S.badge}>2</div>
            </div>
            <div style={S.iconBtn}>
              <MessageSquare size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <div style={S.badge}>3</div>
            </div>
          </div>

          <button style={S.askBtn}>
            <Sparkles size={15} /> Ask AI
          </button>
        </div>

        {/* ── Main Content ── */}
        <div style={S.content}>

          {/* ── Row 1: Stat Cards ── */}
          <div style={S.row}>
            <StatCard
              label="Applications Sent" value="28"
              sub="↑ 34% vs last week"
              gradient="linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))"
              iconBg="rgba(124,58,237,0.2)"
              icon={<Send size={18} style={{ color: '#a78bfa' }} />}
            />
            <StatCard
              label="Interviews" value="7"
              sub="↑ 16% vs last week"
              gradient="linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))"
              iconBg="rgba(59,130,246,0.2)"
              icon={<Calendar size={18} style={{ color: '#60a5fa' }} />}
            />
            <StatCard
              label="Skill Progress" value="72%"
              sub={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '5px', width: '100%' }}>
                    <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #ec4899, #a855f7)', borderRadius: '99px' }} />
                  </div>
                </div>
              }
              gradient="linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.08))"
              iconBg="rgba(236,72,153,0.2)"
              icon={<TrendingUp size={18} style={{ color: '#f472b6' }} />}
            />
            <StatCard
              label="Weekly Goal" value="4 / 5"
              sub="Tasks Completed"
              gradient="linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))"
              iconBg="rgba(16,185,129,0.2)"
              icon={<Target size={18} style={{ color: '#34d399' }} />}
            />
          </div>

          {/* ── Row 2: Chart + AI Copilot ── */}
          <div style={{ ...S.row, alignItems: 'flex-start' }}>

            {/* Application Analytics */}
            <div style={{ ...S.card, flex: 1.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={S.cardTitle}>Application Analytics</div>
                <div style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.05)', padding: '5px 12px',
                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                }}>
                  This Week <ChevronRight size={12} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {/* Line chart */}
                <div style={{ flex: 1, height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="apps" stroke="#7c3aed" strokeWidth={2.5}
                        fill="url(#grad)" dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#a78bfa' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <PieChart width={110} height={110}>
                      <Pie data={pieData} cx={55} cy={55} innerRadius={32} outerRadius={50}
                        dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>28</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Total</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '120px' }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: d.color, flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.55)', flex: 1 }}>{d.name}</span>
                        <span style={{ color: 'white', fontWeight: 600 }}>{d.value}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                          ({Math.round(d.value / 50 * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Copilot */}
            {showAI && (
              <div style={{
                ...S.card, width: '300px', flexShrink: 0,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Sparkles size={13} style={{ color: 'white' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>AI Copilot</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />
                    <X size={14} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                      onClick={() => setShowAI(false)} />
                  </div>
                </div>

                {/* AI message */}
                <div style={{
                  display: 'flex', gap: '10px', marginBottom: '14px',
                  background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={12} style={{ color: 'white' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    Hello Mahfuz! 👋<br />
                    Here are 3 jobs that match your profile <strong style={{ color: '#a78bfa' }}>98%</strong> this week.
                  </div>
                </div>

                {/* Job matches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {jobMatches.map(job => (
                    <div key={job.role} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '10px 12px',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: job.color, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 800, fontSize: '14px',
                        color: 'white', flexShrink: 0,
                      }}>{job.logo}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.role}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {job.company} · {job.location}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                        borderRadius: '20px', background: 'rgba(16,185,129,0.15)',
                        color: '#34d399', border: '1px solid rgba(16,185,129,0.3)',
                        flexShrink: 0,
                      }}>{job.match}% Match</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '12px', textAlign: 'center', fontSize: '12px',
                  color: '#a78bfa', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  View all recommendations <ChevronRight size={12} />
                </div>
              </div>
            )}
          </div>

          {/* ── Row 3: Deadlines + Skills + Tasks + Roadmap ── */}
          <div style={S.row}>

            {/* Upcoming Deadlines */}
            <div style={{ ...S.card, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: '#a78bfa' }} />
                  <span style={S.cardTitle}>Upcoming Deadlines</span>
                </div>
                <X size={13} style={{ color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deadlines.map(d => (
                  <div key={d.role} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: d.color + '30', border: `2px solid ${d.color}`,
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{d.role}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{d.type}</div>
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                      borderRadius: '20px', background: d.color + '20',
                      color: d.color, border: `1px solid ${d.color}40`,
                      whiteSpace: 'nowrap',
                    }}>{d.urgency}</div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '12px', fontSize: '12px', color: '#a78bfa',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                View all deadlines <ChevronRight size={12} />
              </div>
            </div>

            {/* Skill Progress */}
            <div style={{ ...S.card, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={15} style={{ color: '#a78bfa' }} />
                  <span style={S.cardTitle}>Skill Progress</span>
                </div>
                <span style={{ fontSize: '12px', color: '#a78bfa', cursor: 'pointer' }}>View all</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {skills.map(s => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: s.color + '20', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{s.name}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: s.color }}>{s.pct}%</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{s.level}</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '5px' }}>
                      <div style={{
                        width: `${s.pct}%`, height: '100%', borderRadius: '99px',
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Tasks */}
            <div style={{ ...S.card, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>📋</span>
                  <span style={S.cardTitle}>Weekly Tasks</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '12px', color: '#a78bfa', cursor: 'pointer',
                }}>
                  <Plus size={13} /> Add Task
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map(t => (
                  <div key={t.label} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {t.done
                      ? <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      : <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                          border: '2px solid rgba(255,255,255,0.2)',
                        }} />
                    }
                    <span style={{
                      flex: 1, fontSize: '13px',
                      color: t.done ? 'rgba(255,255,255,0.4)' : 'white',
                      textDecoration: t.done ? 'line-through' : 'none',
                    }}>{t.label}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                      borderRadius: '20px', whiteSpace: 'nowrap',
                      background: t.done ? 'rgba(16,185,129,0.1)' : t.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: t.done ? '#10b981' : t.urgent ? '#ef4444' : '#f59e0b',
                      border: `1px solid ${t.done ? 'rgba(16,185,129,0.2)' : t.urgent ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>{t.progress}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Roadmap */}
            <div style={{ ...S.card, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🗺️</span>
                  <span style={S.cardTitle}>Career Roadmap</span>
                </div>
                <ExternalLink size={13} style={{ color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }} />
              </div>

              {/* Donut */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <PieChart width={90} height={90}>
                    <Pie data={[{ value: 64 }, { value: 36 }]} cx={45} cy={45}
                      innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      <Cell fill="#7c3aed" />
                      <Cell fill="rgba(255,255,255,0.06)" />
                    </Pie>
                  </PieChart>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>64%</div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: '14px' }}>
                Overall Progress
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roadmap.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {r.done
                      ? <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      : r.active
                        ? <Clock size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        : <AlertCircle size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    }
                    <span style={{
                      fontSize: '13px',
                      color: r.locked ? 'rgba(255,255,255,0.25)' : r.active ? '#f59e0b' : r.done ? 'rgba(255,255,255,0.5)' : 'white',
                      fontWeight: r.active ? 600 : 400,
                    }}>{r.label}</span>
                    {r.done && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#10b981' }}>Completed</span>}
                    {r.active && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#f59e0b' }}>In Progress</span>}
                    {r.locked && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>Locked</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
