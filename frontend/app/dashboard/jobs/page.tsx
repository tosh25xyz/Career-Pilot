'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  Search, Briefcase, MapPin, Building2,
  ExternalLink, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Loader2, Sparkles,
  TrendingUp, Clock, Zap, AlertTriangle,
} from 'lucide-react';

interface JobCard {
  title: string; company: string; location: string;
  salary: string; description: string; url: string;
  contract: string; posted: string; fit_score: number;
  fit_verdict: string; fit_breakdown: Record<string, number>;
  matched_points: string[]; gap_points: string[]; reasoning: string;
}

interface SearchResult {
  jobs: JobCard[]; total: number;
  has_cv: boolean;
  query_parsed: { keywords: string; location: string };
}

const SUGGESTIONS = [
  'ML internships in Dhaka',
  'Remote Python developer jobs',
  'Backend engineer entry level',
  'Data analyst Dhaka',
  'React developer junior',
  'Software engineer intern',
];

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}
function scoreBg(s: number) {
  if (s >= 80) return 'rgba(16,185,129,0.12)';
  if (s >= 60) return 'rgba(245,158,11,0.12)';
  if (s >= 40) return 'rgba(249,115,22,0.12)';
  return 'rgba(239,68,68,0.12)';
}

function JobCardUI({ job }: { job: JobCard }) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColor(job.fit_score);
  const bg    = scoreBg(job.fit_score);

  return (
    <div style={{
      borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s', marginBottom: '12px',
    }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: scoreBg(job.fit_score),
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 800, color,
        }}>
          {job.company[0]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '5px' }}>
                {job.title}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={11} />{job.company}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} />{job.location}
                </span>
                {job.salary && (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{job.salary}</span>
                )}
                {job.contract && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                    background: 'rgba(124,58,237,0.12)', color: '#a78bfa',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}>{job.contract}</span>
                )}
              </div>
            </div>

            {/* Fit score */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '14px',
                background: bg, border: `2px solid ${color}40`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color, lineHeight: 1 }}>
                  {job.fit_score || '—'}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  {job.fit_score ? 'FIT' : 'N/A'}
                </div>
              </div>
              <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 600, color }}>
                {job.fit_verdict}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {job.reasoning && job.fit_score > 0 && (
        <div style={{
          margin: '0 20px 14px', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)',
          display: 'flex', gap: '8px', alignItems: 'flex-start',
        }}>
          <Sparkles size={13} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            {job.reasoning}
          </span>
        </div>
      )}

      {/* Breakdown bars */}
      {job.fit_score > 0 && Object.keys(job.fit_breakdown).length > 0 && (
        <div style={{ padding: '0 20px 14px', display: 'flex', gap: '10px' }}>
          {Object.entries(job.fit_breakdown).map(([key, val]) => (
            <div key={key} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{key}</span>
                <span style={{ fontSize: '10px', color: scoreColor(val as number), fontWeight: 700 }}>{val}%</span>
              </div>
              <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                  width: `${val}%`, height: '100%', borderRadius: '99px',
                  background: scoreColor(val as number),
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: 'white', textDecoration: 'none',
          }}>
            Apply <ExternalLink size={11} />
          </a>
          <button onClick={() => setExpanded(!expanded)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}>
            {expanded ? <><ChevronUp size={13} />Less</> : <><ChevronDown size={13} />Details</>}
          </button>
        </div>
        {job.posted && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            {new Date(job.posted).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: '6px' }}>
              JOB DESCRIPTION
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
              {job.description}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {job.matched_points.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', marginBottom: '7px' }}>
                  WHAT MATCHES
                </div>
                {job.matched_points.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', marginBottom: '5px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
            {job.gap_points.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', marginBottom: '7px' }}>
                  SKILL GAPS
                </div>
                {job.gap_points.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', marginBottom: '5px', alignItems: 'flex-start' }}>
                    <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function JobsPage() {
  const { getToken } = useAuth();
  const [mounted, setMounted]   = useState(false);
  const [query, setQuery]       = useState('');
  const [result, setResult]     = useState<SearchResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Hydration fix — client এ mount হওয়ার পরে render করো
  useEffect(() => { setMounted(true); }, []);

  const search = async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/search`,
        { query: searchQuery },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null; // Hydration fix

  return (
    <div style={{
      padding: '28px 32px', maxWidth: '900px', margin: '0 auto',
      fontFamily: "'DM Sans', sans-serif", minHeight: '100vh',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
          Pillar 1
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Job Hunter Agent
        </h1>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Search in natural language. Agent fetches real jobs and scores each one against your CV.
        </p>
      </div>

      {/* Search box */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '8px 8px 8px 18px',
      }}>
        <Search size={17} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, alignSelf: 'center' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder='Try: "ML internships in Dhaka" or "Remote Python jobs"'
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'white', fontSize: '14px', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => search()}
          disabled={!query.trim() || loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
            background: query.trim() && !loading ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)',
            color: query.trim() && !loading ? 'white' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: query.trim() && !loading ? 'pointer' : 'default', flexShrink: 0,
          }}>
          {loading
            ? <><Loader2 size={14} className="spin" /> Searching...</>
            : <><Zap size={14} /> Search</>
          }
        </button>
      </div>

      {/* Suggestions */}
      {!result && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { setQuery(s); search(s); }}
              style={{
                padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 500,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <XCircle size={16} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '20px', borderRadius: '16px', marginBottom: '12px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Loader2 size={16} style={{ color: '#a78bfa' }} className="spin" />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Agent is searching and scoring fit...
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Parsing query', 'Fetching jobs', 'Scoring fit', 'Ranking'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: i === 1 ? '#a78bfa' : 'rgba(255,255,255,0.2)' }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.1)' }}>→</span>}
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No CV warning */}
      {result && !result.has_cv && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
              No CV found — showing jobs without fit scores.
            </span>
          </div>
          <a href="/dashboard/cv" style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)', textDecoration: 'none',
          }}>Upload CV →</a>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
              {result.total} jobs found
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px', fontWeight: 400 }}>
                for "{result.query_parsed?.keywords}"
              </span>
            </span>
            {result.has_cv && (
              <span style={{ fontSize: '12px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} /> Sorted by fit score
              </span>
            )}
          </div>
          {result.jobs.map((job, i) => <JobCardUI key={i} job={job} />)}
        </>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={28} style={{ color: '#7c3aed' }} />
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            Search for your next opportunity
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
            Use natural language — the agent fetches real jobs and scores each one against your CV.
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
