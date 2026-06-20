'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import {
  Send, Sparkles, Plus, Trash2,
  User, ChevronRight, Loader2,
  FileText, Briefcase, Map, BookOpen,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

// ── Quick prompts ───────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: Briefcase, label: 'Am I ready?',    text: 'Am I ready for a data engineer role at a top tech company?' },
  { icon: FileText,  label: 'Cover letter',   text: 'Draft a cover letter for a Machine Learning Engineer internship.' },
  { icon: Map,       label: '3-month plan',   text: 'Build me a 3-month roadmap to become job-ready as a software engineer.' },
  { icon: BookOpen,  label: 'Skill gaps',     text: 'What skills am I missing for a Google internship?' },
];

// ── Markdown-like renderer ──────────────────────────────────────
function RenderMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { elements.push(<div key={i} style={{ height: '8px' }} />); i++; continue; }

    // Heading ##
    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '12px 0 6px' }}>
          {line.slice(3)}
        </div>
      );
      i++; continue;
    }
    // Heading ###
    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', margin: '10px 0 4px' }}>
          {line.slice(4)}
        </div>
      );
      i++; continue;
    }
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('• '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} style={{ margin: '4px 0', paddingLeft: '0', listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
              <span style={{ color: '#7c3aed', marginTop: '5px', flexShrink: 0 }}>▸</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>') }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\./.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\./.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={i} style={{ margin: '4px 0', paddingLeft: '0', listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '10px', marginBottom: '5px', fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
                fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
              }}>{j + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>') }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph with **bold**
    elements.push(
      <p key={i} style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: '2px 0' }}
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>') }} />
    );
    i++;
  }
  return <div>{elements}</div>;
}

// ══════════════════════════════════════════════════════════════
export default function AssistantPage() {
  const { getToken } = useAuth();

  const [sessions, setSessions]         = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // ── Auto scroll ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load sessions ────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/assistant/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.data.sessions);
    } catch {}
    finally { setLoadingSessions(false); }
  }, [getToken]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Load session messages ────────────────────────────────────
  const loadSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/assistant/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages.map((m: any) => ({ ...m, id: m.id })));
    } catch {}
  };

  // ── New session ──────────────────────────────────────────────
  const newSession = () => {
    setActiveSession(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  // ── Delete session ───────────────────────────────────────────
  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/assistant/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession === sessionId) newSession();
    } catch {}
  };

  // ── Send message ─────────────────────────────────────────────
  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    // Optimistic user message
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: msg }]);

    try {
      const token = await getToken();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/assistant/chat`,
        { message: msg, session_id: activeSession },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { session_id, session_title, reply } = res.data;

      // Update session
      if (!activeSession) {
        setActiveSession(session_id);
        setSessions(prev => [{ id: session_id, title: session_title, created_at: new Date().toISOString() }, ...prev]);
      } else {
        setSessions(prev => prev.map(s => s.id === session_id ? { ...s, title: session_title } : s));
      }

      // Add assistant reply
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Textarea auto-resize + Enter to send ────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmptyChat = messages.length === 0;

  // ── Inline styles ────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    wrap: {
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif", background: '#0d1025',
    },
    // Sidebar
    sidebar: {
      width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#090c1c', borderRight: '1px solid rgba(255,255,255,0.06)',
    },
    sidebarTop: {
      padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    newBtn: {
      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
      padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      border: 'none', color: 'white', fontSize: '13px', fontWeight: 700,
      boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
    },
    sessionLabel: {
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
      color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
      padding: '12px 16px 6px',
    },
    sessionList: { flex: 1, overflowY: 'auto', padding: '4px 8px' },
    sessionItem: (active: boolean): React.CSSProperties => ({
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 10px', borderRadius: '10px', marginBottom: '2px',
      cursor: 'pointer', transition: 'all 0.15s',
      background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
      border: active ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
    }),
    // Main area
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    // Topbar
    topbar: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(13,16,37,0.8)', backdropFilter: 'blur(10px)',
    },
    // Messages
    msgArea: { flex: 1, overflowY: 'auto', padding: '24px' },
    // Input area
    inputArea: {
      padding: '16px 24px 20px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: '#0d1025',
    },
    inputBox: {
      display: 'flex', alignItems: 'flex-end', gap: '10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px', padding: '12px 12px 12px 16px',
      transition: 'all 0.2s',
    },
    textarea: {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color: 'white', fontSize: '14px', resize: 'none', lineHeight: 1.5,
      fontFamily: "'DM Sans', sans-serif", maxHeight: '140px', minHeight: '24px',
    },
    sendBtn: (active: boolean): React.CSSProperties => ({
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: active ? 'pointer' : 'default', border: 'none',
      background: active ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)',
      transition: 'all 0.2s',
    }),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <div style={S.wrap}>

        {/* ── Left Sidebar: Sessions ── */}
        <div style={S.sidebar}>
          <div style={S.sidebarTop}>
            <button style={S.newBtn} onClick={newSession}>
              <Plus size={15} /> New Conversation
            </button>
          </div>

          <div style={S.sessionLabel}>Recent Chats</div>

          <div style={S.sessionList}>
            {loadingSessions ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Loader2 size={16} style={{ color: 'rgba(255,255,255,0.2)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                No conversations yet
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.id} style={S.sessionItem(activeSession === s.id)}
                  onClick={() => loadSession(s.id)}
                  onMouseEnter={e => {
                    if (activeSession !== s.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (activeSession !== s.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}>
                  <Sparkles size={13} style={{ color: activeSession === s.id ? '#a78bfa' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: '12.5px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: activeSession === s.id ? 'white' : 'rgba(255,255,255,0.5)',
                  }}>{s.title}</span>
                  <button
                    onClick={e => deleteSession(e, s.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.4'}>
                    <Trash2 size={12} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Main Chat Area ── */}
        <div style={S.main}>

          {/* Topbar */}
          <div style={S.topbar}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={15} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>AI Assistant</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                RAG-grounded · Powered by Claude
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={S.msgArea}>
            {isEmptyChat ? (
              /* Welcome screen */
              <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '18px', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
                }}>
                  <Sparkles size={26} style={{ color: 'white' }} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  What can I help you with?
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '36px', lineHeight: 1.6 }}>
                  I know your CV inside out. Ask me anything about your career.
                </p>

                {/* Quick prompts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                  {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
                    <button key={label} onClick={() => send(text)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        transition: 'all 0.2s', textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                        background: 'rgba(124,58,237,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} style={{ color: '#a78bfa' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '3px' }}>{label}</div>
                        <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{text.slice(0, 55)}...</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex', gap: '12px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.role === 'user'
                        ? 'rgba(255,255,255,0.08)'
                        : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      boxShadow: msg.role === 'assistant' ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                    }}>
                      {msg.role === 'user'
                        ? <User size={15} style={{ color: 'rgba(255,255,255,0.6)' }} />
                        : <Sparkles size={14} style={{ color: 'white' }} />
                      }
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth: '80%',
                      padding: '14px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: msg.role === 'user'
                        ? 'rgba(124,58,237,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: msg.role === 'user'
                        ? '1px solid rgba(124,58,237,0.25)'
                        : '1px solid rgba(255,255,255,0.07)',
                    }}>
                      {msg.role === 'user' ? (
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                          {msg.content}
                        </p>
                      ) : (
                        <RenderMessage content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                    }}>
                      <Sparkles size={14} style={{ color: 'white' }} />
                    </div>
                    <div style={{
                      padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', gap: '6px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#7c3aed',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={S.inputArea}>
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <div style={S.inputBox}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your career..."
                  rows={1}
                  style={S.textarea}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={S.sendBtn(!!input.trim() && !loading)}>
                  {loading
                    ? <Loader2 size={16} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                    : <Send size={16} style={{ color: input.trim() ? 'white' : 'rgba(255,255,255,0.3)' }} />
                  }
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                Press Enter to send · Shift+Enter for new line · Powered by Claude AI
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
