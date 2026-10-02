'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { Plus, Check, Trash2, Loader2, Calendar, AlertCircle, Clock } from 'lucide-react';

interface Todo {
  id: string; title: string; is_done: boolean;
  priority: number; due_date: string | null;
}

const PRIORITY_META = {
  1: { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  2: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  3: { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

function getMiniCal(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  return { first, days };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const { getToken } = useAuth();
  const [todos, setTodos]         = useState<Todo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newTitle, setNewTitle]   = useState('');
  const [newDue, setNewDue]       = useState('');
  const [newPriority, setNewPriority] = useState(2);
  const [mounted, setMounted]     = useState(false);

  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const api = async (method: string, url: string, data?: any) => {
    const token = await getToken();
    return axios({ method, url: `${process.env.NEXT_PUBLIC_API_URL}${url}`, data, headers: { Authorization: `Bearer ${token}` } });
  };

  useEffect(() => {
    api('get', '/tracker/todos')
      .then(r => setTodos(r.data.todos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    const r = await api('post', '/tracker/todos', {
      title: newTitle.trim(),
      due_date: newDue || null,
      priority: newPriority,
    });
    setTodos(p => [...p, r.data]);
    setNewTitle(''); setNewDue('');
  };

  const toggleTodo = async (id: string) => {
    const r = await api('patch', `/tracker/todos/${id}/toggle`);
    setTodos(p => p.map(t => t.id === id ? r.data : t));
  };

  const deleteTodo = async (id: string) => {
    await api('delete', `/tracker/todos/${id}`);
    setTodos(p => p.filter(t => t.id !== id));
  };

  // Calendar helpers
  const { first, days } = getMiniCal(calYear, calMonth);
  const todosOnDay = (day: number) => todos.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
  });
  const selectedTodos = selectedDay ? todosOnDay(selectedDay) : [];

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const pending  = todos.filter(t => !t.is_done);
  const done     = todos.filter(t => t.is_done);

  if (!mounted || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 size={24} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1100px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>Pillar 4</div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Calendar & Tasks</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>

        {/* ── Mini Calendar ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const hasTodo = todosOnDay(day).length > 0;
              const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <div key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  style={{
                    textAlign: 'center', fontSize: '12px', padding: '6px 2px', borderRadius: '8px',
                    cursor: 'pointer', position: 'relative', fontWeight: isToday ? 700 : 400,
                    background: isSelected ? 'rgba(124,58,237,0.3)' : isToday ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: isSelected ? '#a78bfa' : isToday ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                    border: isSelected ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                  }}>
                  {day}
                  {hasTodo && (
                    <div style={{
                      position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                      width: '4px', height: '4px', borderRadius: '50%', background: '#7c3aed',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day todos */}
          {selectedDay && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                {MONTHS[calMonth]} {selectedDay}
              </div>
              {selectedTodos.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>No tasks this day</div>
              ) : (
                selectedTodos.map(t => (
                  <div key={t.id} style={{ fontSize: '12px', color: t.is_done ? 'rgba(255,255,255,0.3)' : 'white', marginBottom: '4px', textDecoration: t.is_done ? 'line-through' : 'none' }}>
                    • {t.title}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Todo Panel ── */}
        <div>
          {/* Add todo */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.07)', padding: '18px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Add Task</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                placeholder="Task title..."
                style={{
                  flex: 1, minWidth: '180px', padding: '9px 14px', borderRadius: '10px', fontSize: '13px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white', outline: 'none',
                }}
              />
              <input
                type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: '10px', fontSize: '13px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)', outline: 'none',
                }}
              />
              <select value={newPriority} onChange={e => setNewPriority(Number(e.target.value))}
                style={{
                  padding: '9px 12px', borderRadius: '10px', fontSize: '13px',
                  background: '#0d1025', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white', outline: 'none',
                }}>
                <option value={1}>🔴 High</option>
                <option value={2}>🟡 Medium</option>
                <option value={3}>🟢 Low</option>
              </select>
              <button onClick={addTodo} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white', border: 'none', cursor: 'pointer',
              }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Pending */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.07)', padding: '18px', marginBottom: '14px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              Pending <span style={{ color: '#a78bfa', fontWeight: 800 }}>({pending.length})</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', padding: '8px 0' }}>All done! 🎉</div>
            ) : (
              pending.map(t => {
                const pm = PRIORITY_META[t.priority as 1|2|3] ?? PRIORITY_META[2];
                const isOverdue = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <button onClick={() => toggleTodo(t.id)} style={{
                      width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                      border: `2px solid rgba(255,255,255,0.15)`, background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'white' }}>{t.title}</div>
                      {t.due_date && (
                        <div style={{ fontSize: '11px', color: isOverdue ? '#ef4444' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          {isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {new Date(t.due_date).toLocaleDateString()}
                          {isOverdue && ' (overdue)'}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: pm.bg, color: pm.color }}>{pm.label}</span>
                    <button onClick={() => deleteTodo(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '0' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Done */}
          {done.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                Completed ({done.length})
              </div>
              {done.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <button onClick={() => toggleTodo(t.id)} style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    border: 'none', background: 'rgba(16,185,129,0.2)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} style={{ color: '#10b981' }} />
                  </button>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', flex: 1 }}>{t.title}</span>
                  <button onClick={() => deleteTodo(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
