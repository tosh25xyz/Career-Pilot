'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  Upload, FileText, CheckCircle2, XCircle,
  Loader2, Trash2, Eye, ChevronRight,
  BookOpen, Briefcase, Code, GraduationCap, Award
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

// ── Section icons ──────────────────────────────────────────────
const SECTION_META: Record<string, { icon: any; color: string; label: string }> = {
  experience:       { icon: Briefcase,   color: '#28abfd', label: 'Experience' },
  education:        { icon: GraduationCap, color: '#34d399', label: 'Education' },
  skills:           { icon: Code,        color: '#f59e0b', label: 'Skills' },
  projects:         { icon: BookOpen,    color: '#a78bfa', label: 'Projects' },
  certifications:   { icon: Award,       color: '#fb7185', label: 'Certifications' },
  summary:          { icon: FileText,    color: '#64748b', label: 'Summary' },
  general:          { icon: FileText,    color: '#64748b', label: 'General' },
};

// ══════════════════════════════════════════════════════════════
export default function CVPage() {
  const { getToken } = useAuth();

  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCv, setLoadingCv] = useState(false);

  // ── Fetch existing CV info ───────────────────────────────────
  const fetchCvInfo = useCallback(async () => {
    setLoadingCv(true);
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/cv/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCvInfo(res.data);
    } catch {
      setCvInfo({ has_cv: false });
    } finally {
      setLoadingCv(false);
    }
  }, [getToken]);

  // ── Upload handler ───────────────────────────────────────────
  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cv/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUploadResult(res.data);
      await fetchCvInfo(); // refresh CV info
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete handler ───────────────────────────────────────────
  const deleteCV = async () => {
    if (!confirm('Are you sure you want to delete your CV?')) return;
    try {
      const token = await getToken();
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/cv/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCvInfo({ has_cv: false });
      setUploadResult(null);
    } catch {
      setError('Failed to delete CV.');
    }
  };

  // ── Dropzone ─────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) uploadFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Pillar 2</p>
        <h1 className="text-3xl font-display font-bold mb-2">My CV</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Upload your CV once — every AI feature is grounded in your actual experience.
        </p>
      </div>

      {/* ── Upload Zone ─────────────────────────────────────── */}
      <div
        {...getRootProps()}
        className="relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 mb-6"
        style={{
          border: `2px dashed ${
            isDragReject ? '#ef4444' :
            isDragActive ? '#28abfd' :
            'rgba(255,255,255,0.1)'
          }`,
          background: isDragActive
            ? 'rgba(40,171,253,0.06)'
            : 'rgba(255,255,255,0.02)',
        }}
      >
        <input {...getInputProps()} />

        {uploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-brand-500/30 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Processing your CV...</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Extracting text → Detecting sections → Generating embeddings
              </div>
            </div>
            {/* Progress steps */}
            <div className="flex items-center gap-2 text-xs font-mono mt-2">
              {['Extract', 'Chunk', 'Embed', 'Store'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span style={{ color: '#28abfd' }}>{step}</span>
                  {i < 3 && <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                </div>
              ))}
            </div>
          </div>
        ) : isDragReject ? (
          /* Rejected */
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-12 h-12 text-red-400" />
            <div className="font-semibold text-red-400">Only PDF or DOCX files allowed</div>
          </div>
        ) : (
          /* Default */
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(40,171,253,0.1)', border: '1px solid rgba(40,171,253,0.2)' }}>
              <Upload className="w-7 h-7 text-brand-400" />
            </div>
            <div>
              <div className="font-semibold text-lg mb-1">
                {isDragActive ? 'Drop it here!' : 'Drop your CV here'}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                or <span style={{ color: '#28abfd' }}>click to browse</span> — PDF or DOCX, max 10MB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* ── Upload Success Result ────────────────────────────── */}
      {uploadResult && (
        <div className="glass p-6 mb-6"
          style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-400">CV Processed Successfully!</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {uploadResult.filename} · {uploadResult.total_chunks} chunks created
              </div>
            </div>
          </div>

          {/* Section breakdown */}
          <div className="section-label mb-3">Sections Detected</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(uploadResult.sections_found).map(([section, count]) => {
              const meta = SECTION_META[section] ?? SECTION_META.general;
              const Icon = meta.icon;
              return (
                <div key={section} className="glass p-3 rounded-xl flex items-center gap-3"
                  style={{ border: `1px solid ${meta.color}20` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${meta.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="text-xs font-mono" style={{ color: meta.color }}>
                      {count} chunk{count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Existing CV Info ─────────────────────────────────── */}
      {cvInfo?.has_cv && !uploadResult && (
        <div className="glass p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(40,171,253,0.1)' }}>
                <FileText className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <div className="font-semibold">{cvInfo.filename}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {cvInfo.total_chunks} chunks · Uploaded {new Date(cvInfo.uploaded_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button onClick={deleteCV} className="btn-ghost text-xs text-red-400 border-red-400/20 hover:border-red-400/40">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          {/* Sections */}
          {cvInfo.sections && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {Object.entries(cvInfo.sections).map(([section, count]) => {
                const meta = SECTION_META[section] ?? SECTION_META.general;
                const Icon = meta.icon;
                return (
                  <div key={section} className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    <span className="text-sm">{meta.label}</span>
                    <span className="ml-auto text-xs font-mono" style={{ color: meta.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview */}
          {cvInfo.preview && (
            <>
              <div className="section-label mb-2">Preview</div>
              <div className="rounded-xl p-4 text-sm leading-relaxed font-mono"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', whiteSpace: 'pre-wrap' }}>
                {cvInfo.preview}
              </div>
            </>
          )}
        </div>
      )}

      {/* Load existing CV button */}
      {!cvInfo && (
        <button onClick={fetchCvInfo} disabled={loadingCv}
          className="btn-ghost w-full justify-center">
          {loadingCv
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            : <><Eye className="w-4 h-4" /> Check existing CV</>
          }
        </button>
      )}

      {/* ── What happens next ───────────────────────────────── */}
      <div className="glass p-5 mt-6"
        style={{ background: 'rgba(40,171,253,0.03)', border: '1px solid rgba(40,171,253,0.1)' }}>
        <div className="section-label mb-3">After Upload, You Can:</div>
        <div className="space-y-2">
          {[
            { icon: Briefcase,   text: 'Search jobs and get fit scores grounded in your CV' },
            { icon: BookOpen,    text: 'Ask the AI assistant — "Am I ready for this role?"' },
            { icon: Code,        text: 'Get a personalized skill gap analysis' },
            { icon: FileText,    text: 'Generate cover letters from your actual experience' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Icon className="w-4 h-4 shrink-0 text-brand-400" />
              {text}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
