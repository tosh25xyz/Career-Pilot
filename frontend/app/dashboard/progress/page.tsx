'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { Loader2, Plus, Trash2, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface Stats {
  applications: { total: number; saved: number; applied: number; interviewing: number; offer: number; rejected: number; };
  goals: { total: number; completed: number; };
  todos: { total: number; done: number; };
  has_cv: boolean;
  overall_progress: number;
}

interface Goal {
  id: string; title: string; goal_type: string;
  target_value: number; current_value: number;
  progress_pct: number; is_complete: boolean; deadline: string | null;
}

const GOAL_TYPES = [
  { key: 'apply', label: 'Apply to jobs', color: '#7c3aed' },
  { key: 'learn', label: 'Learn skill',   color: '#3b82f6' },
  { key: 'cv',    label: 'Update CV',     color: '#10b981' },
  { key: 'other', label: 'Other',         color: '#f59e0b' },
];

const STATUS_COLORS = ['#64748b','#3b82f6','#f59e0b','#10b981','#ef4444'];

export default function ProgressPage() {
  const { getToken } = useAuth();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [goals, setGoals]   = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ title: '', goal_type: 'apply', target_value: 5, deadline: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const api = async (method: string, url: string, data?: any) => {
    const token = await getToken();
    return axios({ method, url: `${process.env.NEXT_PUBLIC_API_URL}${url}`, data, headers: { Authorization: `Bearer ${token}` } });
  };

  useEffect(() => {
    Promise.all([
      api('get', '/tracker/stats'),
      api('get', '/tracker/goals'),
    ]).then(([s, g]) => {
      setStats(s.data);
      setGoals(g.data.goals);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addGoal = async () => {
    if (!newGoal.title.trim()) return;
    const r = await api('post', '/tracker/goals', {
      ...newGoal,
      deadline: newGoal.deadline || null,
    });
    setGoals(p => [r.data, ...p]);
    setNewGoal({ title: '', goal_type: 'apply', target_value: 5, deadline: '' });
  };

  const updateProgress = async (id: string, val: number) => {
    const r = await api('patch', `/tracker/goals/${id}/progress`, { current_value: val });
    setGoals(p => p.map(g => g.id === id ? r.data : g));
  };

  const deleteGoal = async (id: string) => {
    await api('delete', `/tracker/goals/${id}`);
    setGoals(p => p.filter(g => g.id !== id));
  };

  if (!mounted || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 size={24} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const pieData = stats ? [
    { name: 'Saved',        value: stats.applications.saved        || 0 },
    { name: 'Applied',      value: stats.applications.applied      || 0 },
    { name: 'Interviewing', value: stats.applications.interviewing || 0 },
    { name: 'Offer',        value: stats.applications.offer        || 0 },
    { name: 'Rejected',     value: stats.applications.rejected     || 0 },
  ].filter(d => d.value > 0) : [];

  const overallPct = stats?.overall_progress ?? 0;

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1000px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>Pillar 4</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Progress Dashboard</h1>
      </div>

      {/* ── Overall Progress ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))',
        borderRadius: '20px', border: '1px solid rgba(124,58,237,0.2)',
        padding: '24px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>Overall Career Progress</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Based on your activity</div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.03em' }}>{overallPct}%</div>
        </div>
        <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            width: `${overallPct}%`, height: '100%', borderRadius: '99px',
            background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'CV Uploaded', done: stats?.has_cv },
            { label: `${stats?.applications.applied || 0} Applied` , done: (stats?.applications.applied || 0) > 0 },
            { label: `${stats?.applications.interviewing || 0} Interviews`, done: (stats?.applications.interviewing || 0) > 0 },
            { label: `${stats?.applications.offer || 0} Offers`, done: (stats?.applications.offer || 0) > 0 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <CheckCircle2 size={13} style={{ color: item.done ? '#10b981' : 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: item.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Apps',   value: stats?.applications.total || 0,    color: '#7c3aed', icon: '📤' },
          { label: 'Interviewing', value: stats?.applications.interviewing || 0, color: '#f59e0b', icon: '📅' },
          { label: 'Goals Done',   value: `${stats?.goals.completed || 0}/${stats?.goals.total || 0}`, color: '#10b981', icon: '🎯' },
          { label: 'Tasks Done',   value: `${stats?.todos.done || 0}/${stats?.todos.total || 0}`, color: '#3b82f6', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', marginBottom: '2px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Pie Chart + Goals ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Pie chart */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>Applications by Status</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[i], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'rgba(255,255,255,0.5)' }}>{d.name}</span>
                    <span style={{ color: 'white', fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
              No applications yet
            </div>
          )}
        </div>

        {/* Goals */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>Goals</div>

          {/* Add goal */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
              placeholder="Goal title..."
              style={{
                flex: 1, minWidth: '120px', padding: '8px 12px', borderRadius: '10px', fontSize: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'white', outline: 'none',
              }} />
            <select value={newGoal.goal_type} onChange={e => setNewGoal(p => ({ ...p, goal_type: e.target.value }))}
              style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '12px', background: '#0d1025', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none' }}>
              {GOAL_TYPES.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
            <input type="number" value={newGoal.target_value} min={1}
              onChange={e => setNewGoal(p => ({ ...p, target_value: Number(e.target.value) }))}
              style={{ width: '60px', padding: '8px 10px', borderRadius: '10px', fontSize: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none' }} />
            <button onClick={addGoal} style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: 'white', border: 'none', cursor: 'pointer',
            }}>
              <Plus size={13} /> Add
            </button>
          </div>

          {/* Goal list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
            {goals.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', padding: '12px 0' }}>No goals yet — add one above!</div>
            ) : goals.map(g => {
              const gt = GOAL_TYPES.find(t => t.key === g.goal_type) ?? GOAL_TYPES[3];
              return (
                <div key={g.id} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: g.is_complete ? 'rgba(255,255,255,0.4)' : 'white', textDecoration: g.is_complete ? 'line-through' : 'none' }}>
                        {g.title}
                      </span>
                      <span style={{
                        marginLeft: '8px', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px',
                        background: `${gt.color}15`, color: gt.color,
                      }}>{gt.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: gt.color }}>{g.current_value}/{g.target_value}</span>
                      <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px' }}>
                    <div style={{ width: `${g.progress_pct}%`, height: '100%', borderRadius: '99px', background: g.is_complete ? '#10b981' : gt.color, transition: 'width 0.5s ease' }} />
                  </div>
                  {!g.is_complete && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[-1, +1].map(d => (
                        <button key={d} onClick={() => updateProgress(g.id, Math.max(0, Math.min(g.target_value, g.current_value + d)))}
                          style={{
                            padding: '3px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                          }}>
                          {d > 0 ? '+1' : '-1'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
