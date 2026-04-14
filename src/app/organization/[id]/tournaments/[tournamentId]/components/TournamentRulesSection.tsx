"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Rule {
  id: string;
  text: string;
}

interface TournamentRulesSectionProps {
  tournament: any;
  fetchTournamentData: () => void;
  onSaveTournament: (updates: any) => Promise<void>;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function parseRulesToList(raw: string): Rule[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
    .map(text => ({ id: generateId(), text }));
}

function serializeRules(rules: Rule[]): string {
  return rules.map((r, i) => `${i + 1}. ${r.text}`).join('\n');
}

// ── Action Button ─────────────────────────────────────────────────────────────
function ActionBtn({
  onClick, color, bg, border, hoverBg, label, icon,
}: {
  onClick: () => void;
  color: string;
  bg: string;
  border: string;
  hoverBg: string;
  label: string;
  icon: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 7,
        border: `1px solid ${border}`,
        background: hov ? hoverBg : bg,
        color: hov ? '#071407' : color,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap' as const,
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Individual Rule Row ───────────────────────────────────────────────────────
function RuleRow({
  rule, index, onEdit, onDelete, onSave,
  isEditing, editingText, setEditingText, isMobile,
}: {
  rule: Rule;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  isEditing: boolean;
  editingText: string;
  setEditingText: (t: string) => void;
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 14,
        padding: isMobile ? '12px 14px' : '12px 16px',
        borderRadius: 11,
        background: isEditing
          ? 'rgba(125,193,66,0.08)'
          : hovered
          ? 'rgba(125,193,66,0.05)'
          : 'transparent',
        border: isEditing
          ? '1px solid rgba(168,216,78,0.3)'
          : '1px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Number badge */}
      <div style={{
        minWidth: 30,
        height: 30,
        borderRadius: 9,
        background: isEditing
          ? 'linear-gradient(135deg,#5aa820,#a8d84e)'
          : 'rgba(125,193,66,0.1)',
        border: '1px solid rgba(125,193,66,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Clash Display, sans-serif',
        fontSize: isMobile ? 10 : 11,
        fontWeight: 800,
        color: isEditing ? '#071407' : '#a8d84e',
        letterSpacing: '0.04em',
        flexShrink: 0,
        transition: 'all 0.18s',
      }}>
        {index + 1}
      </div>

      {/* Text / inline editor */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onEdit('');
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8f5e0',
              fontSize: isMobile ? 13 : 14,
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.5,
              caretColor: '#a8d84e',
            }}
          />
        ) : (
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#dff0c8',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.55,
            wordBreak: 'break-word' as const,
          }}>
            {rule.text}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        flexShrink: 0,
        opacity: (hovered || isEditing) ? 1 : 0,
        transition: 'opacity 0.15s',
        pointerEvents: (hovered || isEditing) ? 'auto' : 'none',
      }}>
        {isEditing ? (
          <>
            <ActionBtn
              onClick={onSave}
              color="#a8d84e" bg="rgba(125,193,66,0.12)"
              border="rgba(125,193,66,0.3)" hoverBg="#a8d84e"
              label="Save" icon="✓"
            />
            <ActionBtn
              onClick={() => onEdit('')}
              color="#8aa070" bg="rgba(125,193,66,0.05)"
              border="rgba(125,193,66,0.12)" hoverBg="#8aa070"
              label="Cancel" icon="✕"
            />
          </>
        ) : (
          <>
            <ActionBtn
              onClick={() => onEdit(rule.id)}
              color="#a8d84e" bg="rgba(125,193,66,0.08)"
              border="rgba(125,193,66,0.2)" hoverBg="#a8d84e"
              label="Edit" icon="✏"
            />
            <ActionBtn
              onClick={() => onDelete(rule.id)}
              color="#f77b7b" bg="rgba(247,123,123,0.07)"
              border="rgba(247,123,123,0.2)" hoverBg="#f77b7b"
              label="Delete" icon="🗑"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TournamentRulesSection({
  tournament,
  fetchTournamentData,
  onSaveTournament,
}: TournamentRulesSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [rules, setRules] = useState<Rule[]>(() =>
    parseRulesToList(tournament?.rules || '')
  );
  const [newRuleText, setNewRuleText] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setRules(parseRulesToList(tournament?.rules || ''));
  }, [tournament?.rules]);

  const flash = (msg: string, isErr = false) => {
    isErr ? (setError(msg), setMessage(null)) : (setMessage(msg), setError(null));
    setTimeout(() => { setMessage(null); setError(null); }, 3000);
  };

  const persist = async (updated: Rule[]) => {
    setSaving(true);
    try {
      await onSaveTournament({ rules: serializeRules(updated) });
      flash('Saved.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to save', true);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    const text = newRuleText.trim();
    if (!text) return;
    const updated = [...rules, { id: generateId(), text }];
    setRules(updated);
    setNewRuleText('');
    persist(updated);
    inputRef.current?.focus();
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    persist(updated);
  };

  const startEdit = (id: string) => {
    if (!id) { setEditingId(''); setEditingText(''); return; }
    const rule = rules.find(r => r.id === id);
    if (rule) { setEditingId(id); setEditingText(rule.text); }
  };

  const saveEdit = () => {
    const text = editingText.trim();
    if (!text) return;
    const updated = rules.map(r => r.id === editingId ? { ...r, text } : r);
    setRules(updated);
    setEditingId('');
    setEditingText('');
    persist(updated);
  };

  const canAdd = newRuleText.trim().length > 0;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 26 }}>
        <div>
          <div style={{
            fontFamily: 'Clash Display, sans-serif', fontSize: isMobile ? 8 : 10, fontWeight: 800,
            letterSpacing: '0.2em', textTransform: 'uppercase' as const,
            color: '#7dc142', marginBottom: 5, opacity: 0.75,
          }}>
            Tournament Management
          </div>
          <h2 style={{
            fontFamily: 'Clash Display, sans-serif', fontSize: isMobile ? 20 : 26, fontWeight: 800,
            color: '#a8d84e', margin: 0, letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            Rules & Regulations
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saving && (
            <span style={{ fontSize: 12, color: '#7dc142', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 10, height: 10, border: '2px solid #7dc142',
                borderTopColor: 'transparent', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.7s linear infinite',
              }} />
              Saving…
            </span>
          )}
          {message && <span style={{ fontSize: 12, color: '#a8d84e', fontWeight: 600 }}>✓ {message}</span>}
          {error   && <span style={{ fontSize: 12, color: '#f77b7b', fontWeight: 600 }}>⚠ {error}</span>}

          <div style={{
            padding: '5px 14px', borderRadius: '100px',
            background: 'rgba(125,193,66,0.1)', border: '1px solid rgba(125,193,66,0.22)',
            fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
            color: '#a8d84e', letterSpacing: '0.04em',
          }}>
            {rules.length} {rules.length === 1 ? 'Rule' : 'Rules'}
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div style={{
        background: 'rgba(12, 26, 12, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(125,193,66,0.13)',
        borderRadius: 20,
        overflow: 'hidden',
      }}>

        {/* Add-rule input bar */}
        <div style={{
          padding: isMobile ? '12px 14px' : '14px 18px',
          borderBottom: '1px solid rgba(125,193,66,0.09)',
          background: 'rgba(0,0,0,0.22)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          {/* Ghost number badge */}
          <div style={{
            minWidth: 30, height: 30, borderRadius: 9,
            background: 'rgba(125,193,66,0.07)',
            border: '1px dashed rgba(125,193,66,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 800,
            color: '#567a30', flexShrink: 0,
          }}>
            {rules.length + 1}
          </div>

          <input
            ref={inputRef}
            value={newRuleText}
            onChange={e => setNewRuleText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="Add a new rule…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#e8f5e0', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              caretColor: '#a8d84e',
            }}
          />

          <button
            onClick={addRule}
            disabled={!canAdd}
            style={{
              padding: '7px 16px',
              background: canAdd
                ? 'linear-gradient(135deg,#5aa820,#a8d84e)'
                : 'rgba(125,193,66,0.07)',
              color: canAdd ? '#071407' : '#3d5c22',
              border: '1px solid rgba(125,193,66,0.22)',
              borderRadius: 8,
              cursor: canAdd ? 'pointer' : 'not-allowed',
              fontSize: 11, fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.07em',
              textTransform: 'uppercase' as const,
              transition: 'all 0.18s',
              whiteSpace: 'nowrap' as const,
              boxShadow: canAdd ? '0 2px 10px rgba(90,168,32,0.22)' : 'none',
            }}
          >
            + Add Rule
          </button>
        </div>

        {/* Rules list */}
        <div style={{ padding: rules.length ? '8px 10px 12px' : '0' }}>
          {rules.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column' as const,
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '48px 20px',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                border: '1px dashed rgba(125,193,66,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, opacity: 0.4,
              }}>📋</div>
              <p style={{
                margin: 0, textAlign: 'center' as const,
                color: '#456630', fontSize: 13,
                lineHeight: 1.6, maxWidth: 240,
              }}>
                No rules yet. Type in the bar above and press Enter to add your first rule.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              {rules.map((rule, index) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  index={index}
                  isEditing={editingId === rule.id}
                  editingText={editingText}
                  setEditingText={setEditingText}
                  onEdit={startEdit}
                  onDelete={deleteRule}
                  onSave={saveEdit}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {rules.length > 0 && (
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(125,193,66,0.07)',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const,
          }}>
            <span style={{ fontSize: 11, color: '#3d5c22' }}>
              Hover any rule to edit or delete ·
            </span>
            {(['Enter', 'Esc'] as const).map(k => (
              <kbd key={k} style={{
                padding: '1px 6px', borderRadius: 4,
                background: 'rgba(125,193,66,0.07)',
                border: '1px solid rgba(125,193,66,0.16)',
                fontSize: 10, color: '#6a9040',
                fontFamily: 'DM Sans, sans-serif',
              }}>{k}</kbd>
            ))}
            <span style={{ fontSize: 11, color: '#3d5c22' }}>to confirm / cancel edit</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}