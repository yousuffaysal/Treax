'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '@/components/providers/preferences-provider';
import { useToast } from '@/components/providers/toast-provider';
import { AgentIcon, ArrowRightIcon, BrandMark } from '@/components/ui/icons';
import type { Role } from '@/lib/types';
import { runAgentCommand } from './actions';

type Line = { id: string; role: 'you' | 'agent'; text: string; label?: string; refused?: boolean };

const BUILDER_IDEAS = [
  'Open the marketplace',
  'Switch to dark mode',
  'Find me a co-founder',
  'Show me the AI studio',
  'Who is Nusrat Jahan?',
  'Switch to Bangla',
];

const ADMIN_IDEAS = ['Verify Tanvir Alam', 'Pause all campaigns', 'Open the campaigns manager', 'Suspend @sabbirbuilds'];

export function AgentConsole({
  viewer,
  history,
}: {
  viewer: { name: string; initials: string; avatarColor: string; role: Role; handle: string };
  history: Array<{ id: string; input: string; reply: string | null; allowed: boolean; succeeded: boolean }>;
}) {
  const router = useRouter();
  const { error } = useToast();
  const { setTheme, setLocale } = usePreferences();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<Line[]>(() =>
    history.flatMap((h) => [
      { id: `${h.id}-in`, role: 'you' as const, text: h.input },
      { id: `${h.id}-out`, role: 'agent' as const, text: h.reply ?? '', refused: !h.allowed },
    ]),
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, busy]);

  const ideas = viewer.role === 'ADMIN' ? [...BUILDER_IDEAS.slice(0, 3), ...ADMIN_IDEAS] : BUILDER_IDEAS;

  async function run(text: string) {
    const command = text.trim();
    if (!command || busy) return;

    setInput('');
    setBusy(true);
    setLines((cur) => [...cur, { id: `in-${Date.now()}`, role: 'you', text: command }]);

    const result = await runAgentCommand(command);
    setBusy(false);

    if (!result.ok) {
      error(result.error);
      return;
    }

    const { label, reply, effect, allowed } = result.data;
    setLines((cur) => [...cur, { id: `out-${Date.now()}`, role: 'agent', text: reply, label, refused: !allowed }]);

    // Effects are applied client-side so the console stays open.
    if (effect?.kind === 'theme') setTheme(effect.value);
    if (effect?.kind === 'language') setLocale(effect.value);
    if (effect?.kind === 'navigate') setTimeout(() => router.push(effect.href), 550);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page)', display: 'flex', flexDirection: 'column' }}>
      <header
        className="sl-agentbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 26px',
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/"
          aria-label="Back to the feed"
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            border: '1px solid var(--border-strong)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            color: 'var(--ink)',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#163300', flexShrink: 0 }}>
          <BrandMark size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', color: 'var(--ink)' }}>
            Treax Agent
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
            {viewer.role === 'ADMIN' ? 'Full command set' : 'Builder commands'}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="sl-scroll sl-agentscroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 26px 12px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 56, height: 56, borderRadius: 18, background: 'var(--primary-pale)', color: 'var(--ink)' }}>
                <AgentIcon size={26} />
              </span>
              <h1 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: 'var(--ink)', margin: '18px 0 6px' }}>
                Tell me what you need.
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--body)' }}>
                Plain language. I&apos;ll open the right screen or run the action.
              </p>
            </div>
          ) : (
            lines.map((line) =>
              line.role === 'you' ? (
                <div key={line.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '78%',
                      background: 'var(--ink)',
                      color: 'var(--card)',
                      borderRadius: '18px 18px 4px 18px',
                      padding: '12px 16px',
                      fontSize: 15,
                      lineHeight: 1.45,
                    }}
                  >
                    {line.text}
                  </div>
                </div>
              ) : (
                <div key={line.id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      background: line.refused ? 'rgba(208,50,56,.14)' : 'var(--primary)',
                      color: line.refused ? 'var(--negative)' : '#163300',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AgentIcon size={17} />
                  </span>
                  <div
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '18px 18px 18px 4px',
                      padding: '13px 16px',
                      maxWidth: '78%',
                      animation: 'sl-up .22s ease both',
                    }}
                  >
                    {line.label ? (
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                          fontSize: 10.5,
                          letterSpacing: '.12em',
                          textTransform: 'uppercase',
                          color: line.refused ? 'var(--negative)' : 'var(--mute)',
                          marginBottom: 6,
                        }}
                      >
                        {line.label}
                      </div>
                    ) : null}
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>{line.text}</div>
                  </div>
                </div>
              ),
            )
          )}

          {busy ? (
            <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--primary)', color: '#163300', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AgentIcon size={17} />
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d) => (
                  <span key={d} style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--mute)', animation: `sl-pulse 1s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          ) : null}

          {lines.length === 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {ideas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => run(idea)}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 9999,
                    padding: '10px 16px',
                    font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sl-agentinput" style={{ padding: '14px 26px 22px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') run(input);
            }}
            placeholder="Ask for anything — open a page, run an action…"
            aria-label="Command"
            style={{
              flex: 1,
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 9999,
              padding: '14px 20px',
              fontSize: 15,
              color: 'var(--ink)',
            }}
          />
          <button
            onClick={() => run(input)}
            disabled={busy || !input.trim()}
            aria-label="Run command"
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: busy || !input.trim() ? 0.6 : 1,
            }}
          >
            <ArrowRightIcon size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
