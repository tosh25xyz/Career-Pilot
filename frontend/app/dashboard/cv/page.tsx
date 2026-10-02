'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  Upload, FileText, CheckCircle2, XCircle,
  Loader2, Trash2, RefreshCw,
  Briefcase, GraduationCap, Code2, FolderGit2, Award, FileStack,
  Sparkles, ShieldCheck, Database, Scan, ChevronRight,
  Clock, ArrowRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface CVInfo {
  has_cv: boolean;
  document_id?: string;
  filename?: string;
  uploaded_at?: string;
  total_chunks?: number;
  sections?: Record<string, number>;
  preview?: string;
}
interface UploadResult {
  document_id: string;
  filename: string;
  total_chunks: number;
  sections_found: Record<string, number>;
  status: string;
}

// ── Section metadata ─────────────────────────────────────────────
const SECTION_META: Record<string, { icon: any; color: string; label: string }> = {
  experience:     { icon: Briefcase,     color: '#7c3aed', label: 'Experience' },
  education:      { icon: GraduationCap, color: '#3b82f6', label: 'Education' },
  skills:         { icon: Code2,         color: '#10b981', label: 'Skills' },
  projects:       { icon: FolderGit2,    color: '#f59e0b', label: 'Projects' },
  certifications: { icon: Award,         color: '#ec4899', label: 'Certifications' },
  summary:        { icon: FileText,      color: '#64748b', label: 'Summary' },
  general:        { icon: FileStack,     color: '#64748b', label: 'General' },
};

const PIPELINE_STEPS = [
  { key: 'extract', label: 'Extracting text',     icon: Scan },
  { key: 'chunk',   label: 'Detecting sections',  icon: FileStack },
  { key: 'embed',   label: 'Generating vectors',  icon: Database },
  { key: 'store',   label: 'Indexing for RAG',    icon: ShieldCheck },
];

const CAPABILITIES = [
  { icon: Briefcase,    color: '#7c3aed', text: 'Score your fit against any job description' },
  { icon: Sparkles,     color: '#10b981', text: 'Ask the AI assistant career questions grounded in your real experience' },
  { icon: Code2,        color: '#f59e0b', text: 'Get a personalized skill-gap analysis' },
  { icon: FileText,     color: '#ec4899', text: 'Generate tailored cover letters in seconds' },
];

export default function CVPage() {
  const { getToken } = useAuth();

  const [cvInfo, setCvInfo]           = useState<CVInfo | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [stepIndex, setStepIndex]     = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loadingCv, setLoadingCv]     = useState(true);
  const [mounted, setMounted]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch existing CV ──────────────────────────────────────────
  const fetchCvInfo = useCallback(async () => {
    setLoadingCv(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cv/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCvInfo(res.data);
    } catch {
      setCvInfo({ has_cv: false });
    } finally {
      setLoadingCv(false);
    }
  }, [getToken]);

  useEffect(() => { fetchCvInfo(); }, [fetchCvInfo]);

  // ── Simulated step progress while uploading (purely visual) ────
  useEffect(() => {
    if (!uploading) { setStepIndex(0); return; }
    const timer = setInterval(() => {
      setStepIndex(i => (i < PIPELINE_STEPS.length - 1 ? i + 1 : i));
    }, 900);
    return () => clearInterval(timer);
  }, [uploading]);

  // ── Upload ───────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cv/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setStepIndex(PIPELINE_STEPS.length - 1);
      setTimeout(() => {
        setUploadResult(res.data);
        fetchCvInfo();
      }, 400);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Upload failed. Please try again.');
    } finally {
      setTimeout(() => setUploading(false), 500);
    }
  };

  const deleteCV = async () => {
    try {
      const token = await getToken();
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cv/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCvInfo({ has_cv: false });
      setUploadResult(null);
      setConfirmDelete(false);
    } catch {
      setError('Failed to delete CV.');
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: useCallback((accepted: File[]) => { if (accepted[0]) uploadFile(accepted[0]); }, []),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  if (!mounted) return null;

  const activeCv = uploadResult ? null : cvInfo; // prefer fresh upload result view right after upload
  const sections = uploadResult?.sections_found ?? cvInfo?.sections ?? {};
  const totalChunks = uploadResult?.total_chunks ?? cvInfo?.total_chunks ?? 0;
  const filename = uploadResult?.filename ?? cvInfo?.filename;
  const hasAnyCv = !!uploadResult || !!cvInfo?.has_cv;

  // Completeness score — based on how many expected sections exist
  const expectedSections = ['experience', 'education', 'skills', 'projects'];
  const foundCount = expectedSections.filter(s => sections[s]).length;
  const completeness = hasAnyCv ? Math.round(((foundCount + 1) / (expectedSections.length + 1)) * 100) : 0;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', color: 'white' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.25)} 50%{box-shadow:0 0 0 10px rgba(124,58,237,0)} }
        @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .cv-fade { animation: fadeUp 0.4s ease forwards; }
        .cv-scroll::-webkit-scrollbar { width: 5px; }
        .cv-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.35); border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <FileText size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '2px' }}>
              Pillar 2 · RAG Core
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Resume Intelligence
            </h1>
          </div>
        </div>

        {loadingCv ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={22} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════
                UPLOADING STATE — animated pipeline
               ══════════════════════════════════════════════════ */}
            {uploading && (
              <div className="cv-fade" style={{
                borderRadius: '24px', padding: '40px 32px', textAlign: 'center', marginBottom: '20px',
                background: 'linear-gradient(180deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))',
                border: '1px solid rgba(124,58,237,0.25)',
              }}>
                <div style={{
                  width: '68px', height: '68px', borderRadius: '20px', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pulseGlow 1.8s ease-in-out infinite',
                }}>
                  <Loader2 size={28} style={{ color: 'white', animation: 'spin 1.1s linear infinite' }} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Analyzing your résumé</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                  This usually takes a few seconds
                </div>

                {/* Step pipeline */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0', maxWidth: '520px', margin: '0 auto' }}>
                  {PIPELINE_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
                    return (
                      <div key={step.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: state === 'pending' ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            border: state === 'pending' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            transition: 'all 0.3s ease',
                          }}>
                            {state === 'done'
                              ? <CheckCircle2 size={16} style={{ color: 'white', animation: 'checkPop 0.3s ease' }} />
                              : <Icon size={15} style={{ color: state === 'active' ? 'white' : 'rgba(255,255,255,0.25)' }} />
                            }
                          </div>
                          <span style={{
                            fontSize: '10.5px', fontWeight: 600, textAlign: 'center',
                            color: state === 'pending' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                          }}>{step.label}</span>
                        </div>
                        {i < PIPELINE_STEPS.length - 1 && (
                          <div style={{
                            height: '2px', flex: 0.6, marginBottom: '22px', borderRadius: '2px',
                            background: i < stepIndex ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s ease',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                ERROR
               ══════════════════════════════════════════════════ */}
            {error && !uploading && (
              <div className="cv-fade" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                borderRadius: '14px', marginBottom: '20px',
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                EMPTY STATE — no CV yet → beautiful upload zone
               ══════════════════════════════════════════════════ */}
            {!uploading && !hasAnyCv && (
              <div className="cv-fade">
                <div {...getRootProps()} style={{
                  position: 'relative', borderRadius: '24px', padding: '56px 32px', textAlign: 'center',
                  cursor: 'pointer', overflow: 'hidden', marginBottom: '24px',
                  border: `1.5px dashed ${isDragReject ? '#ef4444' : isDragActive ? '#7c3aed' : 'rgba(255,255,255,0.14)'}`,
                  background: isDragActive
                    ? 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.14), rgba(124,58,237,0.02))'
                    : 'rgba(255,255,255,0.015)',
                  transition: 'all 0.25s ease',
                }}>
                  <input {...getInputProps()} />

                  {/* Decorative glow */}
                  <div style={{
                    position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
                    width: '280px', height: '280px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
                    pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 22px',
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.08))',
                      border: '1px solid rgba(124,58,237,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Upload size={30} style={{ color: '#a78bfa' }} />
                    </div>

                    <div style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px' }}>
                      {isDragActive ? 'Drop to analyze' : 'Upload your résumé'}
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '22px' }}>
                      Drag & drop your PDF or DOCX, or{' '}
                      <span style={{ color: '#a78bfa', fontWeight: 600 }}>browse files</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap' }}>
                      {['PDF', 'DOCX', 'Max 10MB'].map(tag => (
                        <span key={tag} style={{
                          fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                          padding: '4px 12px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)',
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Why upload — capability showcase */}
                <div style={{
                  borderRadius: '20px', padding: '22px 24px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Unlocks across the platform
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {CAPABILITIES.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0, marginTop: '1px',
                          background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <c.icon size={14} style={{ color: c.color }} />
                        </div>
                        <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                SUCCESS STATE — CV exists (fresh upload or returning)
               ══════════════════════════════════════════════════ */}
            {!uploading && hasAnyCv && (
              <div className="cv-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Just-uploaded success banner */}
                {uploadResult && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                    borderRadius: '14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                  }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                      Résumé analyzed and indexed — every AI feature is now grounded in your real experience.
                    </span>
                  </div>
                )}

                {/* ── Summary Card: score ring + file info ── */}
                <div style={{
                  display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap',
                  borderRadius: '22px', padding: '26px 28px',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.04))',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}>
                  {/* Completeness ring */}
                  <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
                    <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                      <circle
                        cx="46" cy="46" r="40" fill="none" stroke="url(#cvGrad)" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - completeness / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                      <defs>
                        <linearGradient id="cvGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '19px', fontWeight: 800, lineHeight: 1 }}>{completeness}%</span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: '2px' }}>complete</span>
                    </div>
                  </div>

                  {/* File info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileText size={15} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: '15px', fontWeight: 700 }}>{filename}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Database size={12} /> {totalChunks} indexed chunks
                      </span>
                      {cvInfo?.uploaded_at && !uploadResult && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} /> {new Date(cvInfo.uploaded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span style={{
                        fontSize: '11px', fontWeight: 700, color: '#10b981', padding: '2px 10px',
                        borderRadius: '99px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                      }}>
                        RAG Active
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                      borderRadius: '11px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                    }}>
                      <RefreshCw size={13} /> Replace
                      <input {...getInputProps()} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => setConfirmDelete(true)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                      borderRadius: '11px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171',
                    }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Confirm delete inline */}
                {confirmDelete && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    padding: '12px 16px', borderRadius: '14px',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)' }}>
                      Delete this résumé? All indexed data will be removed.
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => setConfirmDelete(false)} style={{
                        padding: '6px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                      }}>Cancel</button>
                      <button onClick={deleteCV} style={{
                        padding: '6px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        background: '#ef4444', border: 'none', color: 'white',
                      }}>Delete</button>
                    </div>
                  </div>
                )}

                {/* ── Section breakdown ── */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Detected sections
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {Object.entries(sections).map(([section, count]) => {
                      const meta = SECTION_META[section] ?? SECTION_META.general;
                      const Icon = meta.icon;
                      return (
                        <div key={section} style={{
                          display: 'flex', alignItems: 'center', gap: '11px', padding: '13px 14px',
                          borderRadius: '14px', background: 'rgba(255,255,255,0.025)',
                          border: `1px solid ${meta.color}22`,
                        }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                            background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={15} style={{ color: meta.color }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'white' }}>{meta.label}</div>
                            <div style={{ fontSize: '11px', color: meta.color, fontWeight: 600 }}>
                              {count as number} chunk{(count as number) > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Document preview (styled like paper) ── */}
                {cvInfo?.preview && !uploadResult && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Extracted preview
                    </div>
                    <div className="cv-scroll" style={{
                      borderRadius: '18px', padding: '22px 24px', maxHeight: '220px', overflowY: 'auto',
                      background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 27px, transparent 27px, transparent 28px), #0f1329',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', lineHeight: '28px',
                      color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap',
                    }}>
                      {cvInfo.preview}
                    </div>
                  </div>
                )}

                {/* ── Next steps CTA row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '4px' }}>
                  {[
                    { href: '/dashboard/jobs',      icon: Briefcase, color: '#7c3aed', label: 'Find matching jobs' },
                    { href: '/dashboard/assistant', icon: Sparkles,  color: '#10b981', label: 'Ask the AI assistant' },
                    { href: '/dashboard/tracker',   icon: FileStack, color: '#f59e0b', label: 'View your tracker' },
                  ].map(a => (
                    <a key={a.href} href={a.href} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px',
                      borderRadius: '14px', textDecoration: 'none',
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <a.icon size={15} style={{ color: a.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'white', flex: 1 }}>{a.label}</span>
                      <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
