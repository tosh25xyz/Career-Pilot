'use client';

import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * MobileHeader
 * ============
 * 860px এর নিচে দেখায়। Hamburger icon → sidebar slide-in overlay।
 * Desktop এ CSS দিয়ে hidden (layout.tsx এর media query দেখো)।
 */
export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-header" style={{
        display: 'none', // overridden by media query below
        alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0d1a', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} style={{ color: 'white' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: 'white' }}>CareerPilot</span>
        </div>

        <button onClick={() => setOpen(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'white', padding: '4px',
        }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Slide-in overlay sidebar */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
        }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            height: '100%', width: '260px', position: 'relative',
            animation: 'slideIn 0.25s ease',
          }}>
            <button onClick={() => setOpen(false)} style={{
              position: 'absolute', top: '16px', right: '-44px',
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} style={{ color: 'white' }} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @media (max-width: 860px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </>
  );
}
