import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthLayout>
      <LoginForm next={next ?? '/'} />
    </AuthLayout>
  );
}
