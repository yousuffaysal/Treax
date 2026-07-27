'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useToast } from '@/components/providers/toast-provider';
import {
  AuthDivider,
  FieldError,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
  authSecondaryButtonStyle,
} from '@/components/auth/auth-layout';
import { CheckIcon } from '@/components/ui/icons';
import { safeNext } from '@/lib/safe-redirect';
import { requestPasswordReset } from '../actions';

/** Login — port of Treax.dc.html:1094-1113, backed by Auth.js Credentials. */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { flash, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = await signIn('credentials', { email, password, redirect: false });
    if (!result || result.error) {
      // Deliberately vague: distinguishing "no such user" from "wrong password"
      // hands an attacker a user-enumeration oracle.
      setFormError('That email and password do not match an account.');
      return;
    }
    flash('Welcome back to Treax.');
    startTransition(() => {
      router.replace(safeNext(next));
      router.refresh();
    });
  }

  async function onSso() {
    if (!email.trim()) {
      setFormError('Enter your university email first.');
      return;
    }
    const result = await signIn('university-sso', { email, ssoToken: 'campus', redirect: false });
    if (!result || result.error) {
      setFormError('University login is not available for that address yet.');
      return;
    }
    flash('Signed in with university login.');
    startTransition(() => {
      router.replace(safeNext(next));
      router.refresh();
    });
  }

  async function onForgot() {
    if (!email.trim()) {
      setFormError('Enter your university email first.');
      return;
    }
    const result = await requestPasswordReset(email);
    // Always the same message, whether or not the address exists.
    if (result.ok) flash('Reset link sent to your university email.');
    else error(result.error);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 31, letterSpacing: '-.03em', color: 'var(--ink)', margin: 0 }}>
        Welcome back
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--body)', margin: '9px 0 30px' }}>
        Sign in and pick up where you left off.
      </p>

      <label htmlFor="email" style={authLabelStyle}>
        University email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@student.buet.ac.bd"
        style={authInputStyle}
      />

      <label htmlFor="password" style={{ ...authLabelStyle, margin: '18px 0 8px' }}>
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        style={authInputStyle}
      />

      <FieldError message={formError ?? undefined} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setRemember((v) => !v)}
          aria-pressed={remember}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: '500 14px/1 var(--font-inter), Inter, sans-serif',
            color: 'var(--body)',
          }}
        >
          <span
            style={{
              width: 19,
              height: 19,
              borderRadius: 6,
              border: '1.5px solid var(--border-strong)',
              display: 'grid',
              placeItems: 'center',
              background: remember ? 'var(--primary)' : 'transparent',
              color: '#163300',
            }}
          >
            {remember ? <CheckIcon size={12} /> : null}
          </span>
          Keep me signed in
        </button>
        <button
          type="button"
          onClick={onForgot}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: '600 14px/1 var(--font-inter), Inter, sans-serif',
            color: 'var(--ink)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={pending} style={{ ...authPrimaryButtonStyle, marginTop: 24, opacity: pending ? 0.7 : 1 }}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <AuthDivider />

      <button type="button" onClick={onSso} style={authSecondaryButtonStyle}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 10L12 4 2 10l10 6 10-6z" />
          <path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
        </svg>
        Continue with university login
      </button>

      <p style={{ fontSize: 14, color: 'var(--body)', margin: '28px 0 0', textAlign: 'center' }}>
        New to Treax?{' '}
        <Link
          href="/signup"
          style={{ font: '700 14px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
