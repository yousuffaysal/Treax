'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { ArrowRightIcon, CrossIcon } from '@/components/ui/icons';
import { AI_TOOLS, getAiTool, type AiTool } from '@/lib/ai/tools';

/**
 * Tool cards plus the tool modal — Treax.dc.html:311-400 and 2009-2100.
 *
 * Output streams from /api/ai/tool, so the progress the prototype faked with a
 * CSS animation is now the model actually writing.
 */
export function StudioClient({
  initialTool,
  labels,
}: {
  initialTool: string | null;
  labels: { how: string; open: string; demoType: string; demoAi: string };
}) {
  const [openId, setOpenId] = useState<string | null>(initialTool);
  const tool = openId ? getAiTool(openId) : undefined;

  return (
    <>
      {AI_TOOLS.map((m, i) => (
        <section key={m.id} className="ai-sec">
          <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                  fontSize: 32,
                  fontWeight: 500,
                  color: m.accent,
                  letterSpacing: '-.02em',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  background: m.accent,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: '#fff',
                }}
              >
                <m.Icon size={22} />
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                fontSize: 11,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: m.accent,
                marginBottom: 10,
              }}
            >
              {labels.how}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-manrope), Manrope',
                fontWeight: 800,
                fontSize: 34,
                lineHeight: 1.06,
                letterSpacing: '-.03em',
                color: 'var(--ink)',
                margin: '0 0 12px',
              }}
            >
              {m.name}
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', margin: '0 0 22px', maxWidth: '44ch' }}>{m.desc}</p>

            <ol style={{ margin: '0 0 22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {m.steps.map((step, si) => (
                <li key={si} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.5, color: 'var(--body)' }}>
                  <span style={{ color: m.accent, fontWeight: 700, flexShrink: 0 }}>{si + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            <button
              onClick={() => setOpenId(m.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                background: m.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '13px 22px',
                font: '700 14px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              {labels.open}
              <ArrowRightIcon size={15} />
            </button>
          </div>

          {/* browser mock — Treax.dc.html:325-400 */}
          <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
            <div
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                border: '1px solid var(--card-border)',
                background: 'var(--card)',
                boxShadow: '0 22px 54px rgba(14,15,12,.14)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', background: 'var(--soft)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: '#ff5f57' }} />
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: '#febc2e' }} />
                <span style={{ width: 11, height: 11, borderRadius: 9999, background: '#28c840' }} />
                <span
                  style={{
                    marginLeft: 10,
                    flex: 1,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                    fontSize: 11,
                    color: 'var(--mute)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  treax.ai / {m.id}
                </span>
              </div>
              <div style={{ padding: 20, background: 'var(--card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--soft)', borderRadius: 12, padding: '12px 14px', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: m.accent,
                      flexShrink: 0,
                    }}
                  >
                    {labels.demoType}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', animation: 'sl-type 5s ease infinite' }}>
                    {m.demoPrompt}
                  </span>
                  <span style={{ width: 2, height: 16, background: 'var(--ink)', flexShrink: 0, animation: 'sl-caret 5s step-end infinite' }} />
                </div>
                <div style={{ position: 'relative', marginTop: 16, minHeight: 118 }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 10, animation: 'sl-proc 5s ease infinite' }}>
                    {[0, 0.2, 0.4].map((delay) => (
                      <span
                        key={delay}
                        style={{ width: 8, height: 8, borderRadius: 9999, background: m.accent, animation: `sl-pulse 1s ${delay}s infinite` }}
                      />
                    ))}
                    <span style={{ fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', fontSize: 11, color: 'var(--mute)', marginLeft: 4 }}>
                      {labels.demoAi}…
                    </span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, animation: 'sl-res 5s ease infinite' }}>
                    <div style={{ background: 'var(--soft)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ font: '800 15px/1.3 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{m.tagline}</div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: 9999,
                            background: `${m.accent}22`,
                            color: 'var(--ink)',
                            font: '600 12px/1 var(--font-inter), Inter, sans-serif',
                          }}
                        >
                          {m.cta}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {tool ? <ToolModal tool={tool} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

function ToolModal({ tool, onClose }: { tool: AiTool; onClose: () => void }) {
  const { flash, error } = useToast();
  const [input, setInput] = useState(tool.prefill);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  async function run() {
    if (!input.trim() || running) return;
    setRunning(true);
    setOutput('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/tool', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool: tool.id, input }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setRunning(false);
        return error(payload?.error ?? 'The AI could not run that.');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setRunning(false);
        return error('No response from the AI.');
      }

      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((cur) => cur + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') error('The AI stopped early. Try again.');
    } finally {
      setRunning(false);
    }
  }

  function copy() {
    void navigator.clipboard?.writeText(output);
    flash('Copied to clipboard');
  }

  return (
    <div
      onClick={onClose}
      className="sl-modal sl-scroll"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(14,15,12,.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={tool.name}
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--card)',
          borderRadius: 26,
          boxShadow: '0 30px 80px rgba(0,0,0,.46)',
          animation: 'sl-modal-genie .62s cubic-bezier(.2,.85,.25,1) both',
          overflow: 'hidden',
          transformOrigin: 'center bottom',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '22px 24px', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg,${tool.accent}1f,transparent 62%)`, pointerEvents: 'none' }} />
          <span
            style={{
              position: 'relative',
              width: 46,
              height: 46,
              borderRadius: 14,
              background: tool.accent,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              boxShadow: `0 6px 16px ${tool.accent}55`,
              color: '#fff',
            }}
          >
            <tool.Icon size={22} />
          </span>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 19, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
              {tool.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--mute)', margin: '3px 0 0' }}>{tool.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'relative',
              width: 34,
              height: 34,
              borderRadius: 9999,
              border: 'none',
              background: 'var(--soft)',
              color: 'var(--ink)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <CrossIcon size={17} />
          </button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <label htmlFor="ai-input" style={{ display: 'block', font: '600 13px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', marginBottom: 8 }}>
            {tool.label}
          </label>
          <textarea
            id="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={tool.ph}
            style={{
              width: '100%',
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--ink)',
              resize: 'vertical',
            }}
          />

          {running && !output ? (
            <div
              aria-live="polite"
              style={{
                position: 'relative',
                overflow: 'hidden',
                marginTop: 14,
                background: 'var(--soft)',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {[0, 0.2, 0.4].map((d) => (
                <span key={d} style={{ width: 8, height: 8, borderRadius: 9999, background: tool.accent, animation: `sl-pulse 1s ${d}s infinite` }} />
              ))}
              <span style={{ fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace', fontSize: 12, color: 'var(--mute)' }}>writing…</span>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '30%',
                  background: `linear-gradient(${tool.accent},transparent)`,
                  opacity: 0.2,
                  animation: 'sl-scan 1.1s linear infinite',
                }}
              />
            </div>
          ) : null}

          {output ? (
            <div
              ref={outputRef}
              className="sl-scroll"
              style={{
                marginTop: 14,
                background: 'var(--soft)',
                borderRadius: 16,
                padding: '18px 20px',
                maxHeight: 320,
                overflowY: 'auto',
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
                animation: 'sl-up .2s ease both',
              }}
            >
              {output}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>Every result is a first draft — edit it, make it yours.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {output && !running ? (
              <button
                onClick={copy}
                style={{
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 9999,
                  padding: '12px 20px',
                  font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            ) : null}
            <button
              onClick={run}
              disabled={running || !input.trim()}
              style={{
                background: tool.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '12px 24px',
                font: '700 14px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
                opacity: running || !input.trim() ? 0.65 : 1,
              }}
            >
              {running ? 'Running…' : tool.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
