'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/providers/toast-provider';
import { BrandMark } from '@/components/ui/icons';
import { normalizeHandle } from '@/lib/handle';
import { checkHandle, finishOnboarding, saveHandleAndProject, saveSkills, skipOnboarding } from './actions';

/** Skill options — Treax.dc.html:3267. */
const SKILL_OPTIONS = [
  'Development',
  'Design',
  'Business / Strategy',
  'Marketing',
  'Finance',
  'Legal',
  'Content',
  'Product',
  'Data / AI',
  'Operations',
];

/** Cadence options — Treax.dc.html:3273. */
const CADENCE_OPTIONS: Array<{ n: 3 | 5 | 7; title: string; sub: string }> = [
  { n: 3, title: 'Casual', sub: '3 updates a week — steady progress.' },
  { n: 5, title: 'Committed', sub: '5 updates a week — the sweet spot.' },
  { n: 7, title: 'Daily', sub: 'Post every day. Maximum momentum.' },
];

const h1Style: React.CSSProperties = {
  fontFamily: 'var(--font-manrope), Manrope',
  fontWeight: 800,
  fontSize: 32,
  lineHeight: 1.1,
  letterSpacing: '-.02em',
  color: 'var(--ink)',
  margin: '0 0 8px',
};

const pStyle: React.CSSProperties = { fontSize: 16, color: 'var(--body)', margin: '0 0 24px' };

const labelStyle: React.CSSProperties = {
  display: 'block',
  font: '600 13px/1 var(--font-inter), Inter, sans-serif',
  color: 'var(--ink)',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 16,
  color: 'var(--ink)',
};

export function OnboardingFlow({
  initialStep,
  initial,
}: {
  initialStep: number;
  initial: { skills: string[]; building: string; handle: string; cadence: 3 | 5 | 7 };
}) {
  const router = useRouter();
  const { update } = useSession();
  const { flash, error } = useToast();
  const [step, setStep] = useState(initialStep);
  const [pending, startTransition] = useTransition();

  const [skills, setSkills] = useState<string[]>(initial.skills.length ? initial.skills : ['Development']);
  const [building, setBuilding] = useState(initial.building);
  const [handle, setHandle] = useState(initial.handle);
  const [cadence, setCadence] = useState<3 | 5 | 7>(initial.cadence);
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle');

  const toggleSkill = (skill: string) =>
    setSkills((cur) => (cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill]));

  // Live handle availability, debounced so typing does not hammer the database.
  useEffect(() => {
    if (step !== 1) return;
    const normalized = normalizeHandle(handle);
    if (!normalized) return setHandleState('idle');
    setHandleState('checking');
    const timer = setTimeout(async () => {
      const result = await checkHandle(normalized);
      setHandleState(result.available ? 'free' : result.normalized.length < 3 ? 'invalid' : 'taken');
    }, 400);
    return () => clearTimeout(timer);
  }, [handle, step]);

  async function next() {
    if (step === 0) {
      if (skills.length === 0) return error('Pick at least one skill.');
      const result = await saveSkills({ skills });
      if (!result.ok) return error(result.error);
      setStep(1);
      return;
    }

    if (step === 1) {
      const result = await saveHandleAndProject({ building, handle });
      if (!result.ok) return error(result.error);
      // The handle lives on the JWT (it builds every profile link) — refresh it.
      await update();
      setStep(2);
      return;
    }

    const result = await finishOnboarding({ cadence });
    if (!result.ok) return error(result.error);
    flash('Welcome to Treax. Now go build.');
    startTransition(() => {
      router.replace('/');
      router.refresh();
    });
  }

  async function skip() {
    const result = await skipOnboarding();
    if (!result.ok) return error(result.error);
    startTransition(() => {
      router.replace('/');
      router.refresh();
    });
  }

  const nextLabel = step === 2 ? 'Start building' : 'Continue';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--page)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--primary)', display: 'grid', placeItems: 'center', color: '#163300' }}>
            <BrandMark size={19} />
          </span>
          <span style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', color: 'var(--ink)' }}>
            Treax
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ flex: 1, height: 5, borderRadius: 9999, background: i <= step ? 'var(--primary)' : 'var(--border)' }} />
          ))}
        </div>

        <div
          className="sl-onbcard"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 28, padding: 36, boxShadow: 'var(--elev)' }}
        >
          {step === 0 ? (
            <>
              <h1 style={h1Style}>What do you bring to the table?</h1>
              <p style={pStyle}>Pick your skills. We&apos;ll match you with builders who need them.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SKILL_OPTIONS.map((skill) => {
                  const on = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      aria-pressed={on}
                      style={{
                        padding: '11px 18px',
                        borderRadius: 9999,
                        font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                        cursor: 'pointer',
                        background: on ? 'var(--primary)' : 'var(--card)',
                        color: on ? '#163300' : 'var(--ink)',
                        border: on ? '1px solid transparent' : '1px solid var(--border-strong)',
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h1 style={h1Style}>Claim your builder handle</h1>
              <p style={pStyle}>This is how the community will know you.</p>

              <label htmlFor="onb-product" style={labelStyle}>
                Your idea or project
              </label>
              <input
                id="onb-product"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g. RidePool — split rides to campus"
                style={{ ...inputStyle, marginBottom: 18 }}
              />

              <label htmlFor="onb-handle" style={labelStyle}>
                Handle
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--card)',
                  border: `1px solid ${handleState === 'taken' || handleState === 'invalid' ? 'var(--negative)' : 'var(--border-strong)'}`,
                  borderRadius: 12,
                  padding: '0 16px',
                }}
              >
                <span style={{ color: 'var(--mute)', fontSize: 16 }}>@</span>
                <input
                  id="onb-handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourhandle"
                  aria-describedby="handle-status"
                  style={{ flex: 1, border: 'none', background: 'none', padding: '14px 6px', fontSize: 16, color: 'var(--ink)' }}
                />
                <span id="handle-status" aria-live="polite" style={{ fontSize: 13, color: handleState === 'free' ? 'var(--positive)' : 'var(--mute)' }}>
                  {handleState === 'checking'
                    ? 'checking…'
                    : handleState === 'free'
                      ? 'available'
                      : handleState === 'taken'
                        ? 'taken'
                        : handleState === 'invalid'
                          ? '3-20 characters'
                          : ''}
                </span>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 style={h1Style}>Set your build-in-public rhythm</h1>
              <p style={pStyle}>Posting your journey regularly is how you get noticed and find your team.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CADENCE_OPTIONS.map((opt) => {
                  const on = cadence === opt.n;
                  return (
                    <button
                      key={opt.n}
                      type="button"
                      onClick={() => setCadence(opt.n)}
                      aria-pressed={on}
                      style={{
                        textAlign: 'left',
                        padding: '18px 20px',
                        borderRadius: 18,
                        cursor: 'pointer',
                        background: on ? 'var(--primary-pale)' : 'var(--card)',
                        border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                        color: 'var(--ink)',
                      }}
                    >
                      <div style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', marginBottom: 5 }}>{opt.title}</div>
                      <div style={{ fontSize: 14, opacity: 0.72 }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                style={{
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 9999,
                  padding: '14px 24px',
                  font: '600 15px/1 var(--font-inter), Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              disabled={pending || (step === 1 && handleState === 'taken')}
              style={{
                flex: 1,
                background: 'var(--primary)',
                color: '#163300',
                border: 'none',
                borderRadius: 9999,
                padding: 14,
                font: '600 15px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? 'Saving…' : nextLabel}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            type="button"
            onClick={skip}
            style={{ background: 'none', border: 'none', color: 'var(--mute)', font: '600 14px/1 var(--font-inter), Inter, sans-serif', cursor: 'pointer' }}
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
