'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useToast } from '@/components/providers/toast-provider';
import { FieldError, authInputStyle, authLabelStyle } from '@/components/auth/auth-layout';
import { CheckIcon } from '@/components/ui/icons';
import {
  NATURAL_FITS,
  NATURAL_FIT_LABELS,
  SIGNUP_STAGES,
  SIGNUP_STAGE_LABELS,
  type NaturalFit,
  type SignupStage,
} from '@/lib/handle';
import { createAccount, saveNaturalFit, saveSignupStage } from '../actions';

/** Signup steps 0-2 — Treax.dc.html:1143-1252. Copy and layout are unchanged. */

const YEARS = ['1st', '2nd', '3rd', '4th', 'Masters'];

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-manrope), Manrope',
  fontWeight: 800,
  fontSize: 30,
  letterSpacing: '-.03em',
  color: 'var(--ink)',
  margin: 0,
};

const subStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.5, color: 'var(--body)', margin: '9px 0 26px' };

const stepAnim = { animation: 'sl-genie-in .55s cubic-bezier(.2,.85,.25,1) both' } as const;

const cardOption: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: 'var(--card)',
  border: '1.5px solid var(--border)',
  borderRadius: 20,
  padding: '19px 20px',
  cursor: 'pointer',
  transition: 'transform .2s cubic-bezier(.2,.85,.25,1), border-color .2s',
};

const chipOption: React.CSSProperties = {
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  background: 'var(--card)',
  border: '1.5px solid var(--border)',
  borderRadius: 16,
  padding: '15px 16px',
  cursor: 'pointer',
  transition: 'transform .18s cubic-bezier(.2,.85,.25,1), border-color .18s',
};

const STAGE_ICONS: Record<SignupStage, React.ReactNode> = {
  idea: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </>
  ),
  join: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  lost: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M16.2 8.2l-2 6.1-6.1 2 2-6.1z" />
    </>
  ),
  explore: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

const FIT_ICONS: Record<NaturalFit, React.ReactNode> = {
  code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  design: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.6" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  promote: (
    <>
      <path d="M3 11l18-5v12L3 14z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  numbers: <path d="M12 20V10M18 20V4M6 20v-4" />,
  write: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  research: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  lead: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".8" fill="currentColor" />
    </>
  ),
  unsure: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
      <path d="M12 17.5h.01" />
    </>
  ),
};

function StepIcon({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SignupFlow({
  step: initialStep,
  initial,
}: {
  step: number;
  initial: { stage: string | null; naturalFit: string[] } | null;
}) {
  const router = useRouter();
  const { flash, error } = useToast();
  const [step, setStep] = useState(initialStep);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // step 0
  const [form, setForm] = useState({ name: '', university: '', department: '', gradYear: '', email: '', password: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // step 1
  const [stage, setStage] = useState<SignupStage | null>((initial?.stage as SignupStage) ?? null);

  // step 2
  const [fits, setFits] = useState<NaturalFit[]>((initial?.naturalFit ?? []) as NaturalFit[]);
  const toggleFit = (fit: NaturalFit) =>
    setFits((cur) => (cur.includes(fit) ? cur.filter((f) => f !== fit) : [...cur, fit]));

  async function next() {
    setFormError(null);

    if (step === 0) {
      if (!form.name.trim()) return setFormError('Add your name so people know who you are.');
      const result = await createAccount(form);
      if (!result.ok) return setFormError(result.error);
      // Sign in immediately so steps 1-2 persist against the new account.
      const signedIn = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (!signedIn || signedIn.error) return setFormError('Account created, but sign-in failed. Try signing in.');
      setStep(1);
      startTransition(() => router.refresh());
      return;
    }

    if (step === 1) {
      if (!stage) return setFormError('Pick the one that sounds most like you.');
      const result = await saveSignupStage({ stage });
      if (!result.ok) return setFormError(result.error);
      setStep(2);
      return;
    }

    const result = await saveNaturalFit({ naturalFit: fits });
    if (!result.ok) return error(result.error);
    flash('Account ready. Here’s what Treax found for you.');
    startTransition(() => {
      router.replace('/welcome');
      router.refresh();
    });
  }

  const nextLabel = step === 0 ? 'Continue' : step === 1 ? 'Next' : 'Finish setup';

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {/* progress rail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 26 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= step ? 'var(--primary)' : 'var(--border)' }}
          />
        ))}
      </div>

      {step === 0 ? (
        <div style={stepAnim}>
          <h2 style={headingStyle}>Who are you?</h2>
          <p style={subStyle}>The basics, so your future teammates know who they’re building with.</p>

          <label htmlFor="su-name" style={authLabelStyle}>
            Full name
          </label>
          <input id="su-name" value={form.name} onChange={set('name')} placeholder="Yousuf Rahman" style={authInputStyle} autoComplete="name" />

          <div className="sl-grid2" style={{ marginTop: 18 }}>
            <div>
              <label htmlFor="su-uni" style={authLabelStyle}>
                University
              </label>
              <input id="su-uni" value={form.university} onChange={set('university')} placeholder="NSTU" style={authInputStyle} />
            </div>
            <div>
              <label htmlFor="su-dept" style={authLabelStyle}>
                Department
              </label>
              <input id="su-dept" value={form.department} onChange={set('department')} placeholder="CSTE" style={authInputStyle} />
            </div>
          </div>

          <span style={{ ...authLabelStyle, margin: '18px 0 8px' }}>Year of study</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {YEARS.map((y) => {
              const on = form.gradYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gradYear: on ? '' : y }))}
                  aria-pressed={on}
                  style={{
                    background: on ? 'var(--primary-pale)' : 'var(--card)',
                    border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                    borderRadius: 9999,
                    padding: '10px 18px',
                    font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>

          <div className="sl-grid2" style={{ marginTop: 18 }}>
            <div>
              <label htmlFor="su-email" style={authLabelStyle}>
                Email
              </label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@student.nstu.edu.bd"
                style={authInputStyle}
              />
            </div>
            <div>
              <label htmlFor="su-pass" style={authLabelStyle}>
                Password
              </label>
              <input
                id="su-pass"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                style={authInputStyle}
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div style={stepAnim}>
          <h2 style={headingStyle}>Where are you right now?</h2>
          <p style={subStyle}>Pick the one that sounds most like you today. You can change it any time.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SIGNUP_STAGES.map((key) => {
              const on = stage === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStage(key)}
                  aria-pressed={on}
                  style={{ ...cardOption, borderColor: on ? 'var(--ink)' : 'var(--border)' }}
                >
                  <span
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: on ? 'var(--primary-pale)' : 'var(--soft)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      color: 'var(--ink)',
                    }}
                  >
                    <StepIcon>{STAGE_ICONS[key]}</StepIcon>
                  </span>
                  <span style={{ flex: 1, font: '600 16px/1.4 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                    {SIGNUP_STAGE_LABELS[key]}
                  </span>
                  <span style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--ink)' }}>
                    {on ? <CheckIcon size={22} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={stepAnim}>
          <h2 style={{ ...headingStyle, textWrap: 'pretty' }}>What feels natural to you?</h2>
          <p style={subStyle}>When you’re in a group project, what do you naturally end up doing? Pick as many as fit.</p>
          <div className="sl-grid2">
            {NATURAL_FITS.map((fit) => {
              const on = fits.includes(fit);
              return (
                <button
                  key={fit}
                  type="button"
                  onClick={() => toggleFit(fit)}
                  aria-pressed={on}
                  style={{ ...chipOption, borderColor: on ? 'var(--ink)' : 'var(--border)', background: on ? 'var(--primary-pale)' : 'var(--card)' }}
                >
                  <span style={{ color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
                    <StepIcon size={20}>{FIT_ICONS[fit]}</StepIcon>
                  </span>
                  <span style={{ font: '600 14.5px/1.35 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                    {NATURAL_FIT_LABELS[fit]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* the "not sure yet" genie card */}
          {fits.includes('unsure') ? (
            <div
              style={{
                marginTop: 20,
                background: 'var(--ink)',
                color: '#fff',
                borderRadius: 22,
                padding: '26px 28px',
                animation: 'sl-genie-in .6s cubic-bezier(.2,.85,.25,1) both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                </svg>
                <span
                  style={{
                    font: '800 13px/1 var(--font-manrope), Manrope',
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                  }}
                >
                  That’s exactly why Treax exists
                </span>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.62, margin: 0, color: 'rgba(255,255,255,.86)', textWrap: 'pretty' }}>
                Explore ideas. See what excites you. Help someone build something. You’ll find your strength by doing — not by
                thinking about it.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-manrope), Manrope',
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: '-.01em',
                  margin: '16px 0 0',
                  color: '#fff',
                }}
              >
                Welcome. Let’s figure it out together.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <FieldError message={formError ?? undefined} />

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            style={{
              background: 'var(--card)',
              color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 9999,
              padding: '15px 26px',
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
          disabled={pending}
          style={{
            flex: 1,
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 9999,
            padding: 15,
            font: '700 15px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            opacity: pending ? 0.7 : 1,
            transition: 'transform .18s cubic-bezier(.2,.85,.25,1)',
          }}
        >
          {pending ? 'Saving…' : nextLabel}
        </button>
      </div>

      {step === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--body)', margin: '22px 0 0', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{ font: '700 14px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
