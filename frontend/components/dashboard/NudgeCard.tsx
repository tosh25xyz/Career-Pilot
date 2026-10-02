'use client';

import Link from 'next/link';
import {
  Upload, Search, AlertTriangle, Clock,
  Briefcase, Target, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react';

interface Nudge {
  type: 'critical' | 'warning' | 'info' | 'success';
  icon: string;
  title: string;
  message: string;
  action_label: string;
  action_url: string;
  priority: number;
}

const ICON_MAP: Record<string, any> = {
  upload: Upload, search: Search, alert: AlertTriangle,
  clock: Clock, briefcase: Briefcase, target: Target, check: CheckCircle2,
};

const TYPE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.2)'  },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)' },
  info:     { color: '#a78bfa', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.2)' },
  success:  { color: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)' },
};

export default function NudgeCard({ nudge }: { nudge: Nudge }) {
  const Icon = ICON_MAP[nudge.icon] ?? Sparkles;
  const style = TYPE_STYLE[nudge.type] ?? TYPE_STYLE.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 16px', borderRadius: '14px',
      background: style.bg, border: `1px solid ${style.border}`,
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
        background: `${style.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color: style.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>
          {nudge.title}
        </div>
        <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '8px' }}>
          {nudge.message}
        </div>
        <Link href={nudge.action_url} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '12px', fontWeight: 700, color: style.color, textDecoration: 'none',
        }}>
          {nudge.action_label} <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
