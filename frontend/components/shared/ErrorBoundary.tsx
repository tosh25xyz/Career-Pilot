'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary
 * =============
 * কোনো page crash করলে পুরো সাদা screen দেখানোর বদলে
 * একটা friendly error card দেখায় + "Try again" button দেয়।
 *
 * Usage: <ErrorBoundary><YourPageContent /></ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '400px', padding: '40px', textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', marginBottom: '20px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', maxWidth: '360px' }}>
            This part of the page ran into an error. Your data is safe — try reloading this section.
          </div>
          <button onClick={this.handleReset} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: 'white', border: 'none', cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
