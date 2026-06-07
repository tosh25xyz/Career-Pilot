'use client';

import Link from 'next/link';
import { Upload, AlertTriangle } from 'lucide-react';
import { useCVStatus } from '@/lib/hooks/useCVStatus';

/**
 * CVStatusBanner
 * ==============
 * Dashboard এর যেকোনো page এ দেখাও।
 * CV না থাকলে warning দেখাবে, থাকলে কিছুই দেখাবে না।
 */
export default function CVStatusBanner() {
  const { hasCV, loading } = useCVStatus();

  // Loading বা CV আছে → কিছু দেখাবে না
  if (loading || hasCV) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl mb-6"
      style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
      }}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          No CV uploaded yet — AI features won't work without it.
        </span>
      </div>
      <Link href="/dashboard/cv" className="btn-primary text-xs py-2 shrink-0">
        <Upload className="w-3.5 h-3.5" /> Upload CV
      </Link>
    </div>
  );
}
