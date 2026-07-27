import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/auth-layout';
import { safeNext } from '@/lib/safe-redirect';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Sanitised here rather than in the form so the client never sees a value it
  // could be tricked into navigating to.
  return (
    <AuthLayout>
      <LoginForm next={safeNext(next)} />
    </AuthLayout>
  );
}
