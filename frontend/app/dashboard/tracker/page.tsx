'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  Plus, Trash2, ExternalLink, Loader2,
  Briefcase, Building2, MapPin, X, Check
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface Application {
  id: string; job_title: string; company: string;
  location: string; salary_range: string; job_url: string;
  fit_score: number | null; status: string;
  notes: string; deadline: string | null; created_at: string;
}

const COLUMNS = [
  { key: 'saved',        label: 'Saved',        color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  { key: 'applied',      label: 'Applied',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  { key: 'interviewing', label: 'Interviewing',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  { key: 'offer',        label: 'Offer',         color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  { key: 'rejected',     label: 'Rejected',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
];

// ── Add Application Modal ────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [form, setForm] = useState({ job_title: '', company: '', location: '', salary_range: '', job_url: '', notes: '', status: 'saved' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#0d1025', borderRadius: '20px', padding: '28px',
        border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '480px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'white' }}>Add Application</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { key: 'job_title', label: 'Job Title *', placeholder: 'ML Engineer Intern' },
            { key: 'company',   label: 'Company *',   placeholder: 'Google' },
            { key: 'location',  label: 'Location',    placeholder: 'Dhaka, BD' },
            { key: 'salary_range', label: 'Salary',   placeholder: 'BDT 50,000–80,000' },
            { key: 'job_url',   label: 'Job URL',     placeholder: 'https://...' },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{f.label}</div>
              <input
                value={(form as any)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>Status</div>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                background: '#0d1025', border: '1px solid rgba(255,255,255,0.08)',
                color: 'white', outline: 'none',
              }}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <button
            onClick={() => { if (form.job_title && form.company) { onAdd(form); onClose(); } }}
            style={{
              marginTop: '8px', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white', border: 'none', cursor: 'pointer',
            }}>
            Add Application
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Card ──────────────────────────────────────────────────
function KanbanCard({ app, onDelete, onMove }: { app: Application; onDelete: () => void; onMove: (status: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const nextStatuses = COLUMNS.filter(c => c.key !== app.status);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px',
      border: '1px solid rgba(255,255,255,0.07)', marginBottom: '8px',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.3, flex: 1 }}>
          {app.job_title}
        </div>
        <button onClick={() => setShowMenu(!showMenu)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '0 0 0 8px' }}>
          ···
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <Building2 size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{app.company}</span>
      </div>

      {app.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <MapPin size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{app.location}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
        {app.fit_score ? (
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
            background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)',
          }}>{app.fit_score}% fit</span>
        ) : <span />}
        {app.job_url && (
          <a href={app.job_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
          </a>
        )}
      </div>

      {/* Move menu */}
      {showMenu && (
        <div style={{
          marginTop: '10px', padding: '8px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginBottom: '6px', fontWeight: 600 }}>MOVE TO</div>
          {nextStatuses.map(s => (
            <button key={s.key} onClick={() => { onMove(s.key); setShowMenu(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 8px', borderRadius: '7px', fontSize: '12px',
                background: 'none', border: 'none', cursor: 'pointer', color: s.color,
                marginBottom: '2px',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = s.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
              → {s.label}
            </button>
          ))}
          <button onClick={() => { onDelete(); setShowMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              padding: '6px 8px', borderRadius: '7px', fontSize: '12px',
              background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
              marginTop: '4px',
            }}>
            <Trash2 size={11} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function TrackerPage() {
  const { getToken } = useAuth();
  const [apps, setApps]       = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const api = async (method: string, url: string, data?: any) => {
    const token = await getToken();
    return axios({ method, url: `${process.env.NEXT_PUBLIC_API_URL}${url}`, data, headers: { Authorization: `Bearer ${token}` } });
  };

  useEffect(() => {
    api('get', '/tracker/applications')
      .then(r => setApps(r.data.applications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addApp = async (data: any) => {
    const r = await api('post', '/tracker/applications', data);
    setApps(p => [r.data, ...p]);
  };

  const moveApp = async (id: string, status: string) => {
    await api('patch', `/tracker/applications/${id}/status`, { status });
    setApps(p => p.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = async (id: string) => {
    await api('delete', `/tracker/applications/${id}`);
    setApps(p => p.filter(a => a.id !== id));
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 size={24} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addApp} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>Pillar 4</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '4px' }}>Application Tracker</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{apps.length} applications tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
        }}>
          <Plus size={15} /> Add Application
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
        {COLUMNS.map(col => {
          const colApps = apps.filter(a => a.status === col.key);
          return (
            <div key={col.key} style={{ minWidth: '220px', flex: 1 }}>
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '12px 12px 0 0', marginBottom: '8px',
                background: col.bg, border: `1px solid ${col.color}25`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: col.color }}>{col.label}</span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                  background: `${col.color}20`, color: col.color,
                }}>{colApps.length}</span>
              </div>

              {/* Cards */}
              <div style={{ minHeight: '200px' }}>
                {colApps.map(app => (
                  <KanbanCard
                    key={app.id}
                    app={app}
                    onDelete={() => deleteApp(app.id)}
                    onMove={(status) => moveApp(app.id, status)}
                  />
                ))}
                {colApps.length === 0 && (
                  <div style={{
                    padding: '20px', textAlign: 'center', borderRadius: '12px',
                    border: `1px dashed ${col.color}20`,
                    color: 'rgba(255,255,255,0.15)', fontSize: '12px',
                  }}>
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
