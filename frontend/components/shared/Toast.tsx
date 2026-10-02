'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const STYLES: Record<ToastType, { color: string; bg: string; icon: any }> = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircle },
  info:    { color: '#a78bfa', bg: 'rgba(124,58,237,0.1)', icon: Info },
};

/**
 * ToastProvider
 * =============
 * App root (dashboard layout) এ wrap করো।
 * যেকোনো component থেকে: const { showToast } = useToast(); showToast('error', 'Upload failed');
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px',
      }}>
        {toasts.map(t => {
          const s = STYLES[t.type];
          const Icon = s.icon;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '12px',
              background: '#0d1025', border: `1px solid ${s.color}30`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              animation: 'toastIn 0.25s ease',
            }}>
              <Icon size={16} style={{ color: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'white', flex: 1 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
