import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/session';
import { AuthLayout } from '@/components/auth/auth-layout';
import { SignupFlow } from './signup-flow';

export const metadata: Metadata = { title: 'Create an account' };

/**
 * Signup — port of Treax.dc.html:1119-1256.
 *
 * The step is read from the database, not from client state, so a refresh (or
 * a different device) resumes exactly where the builder stopped.
 */
export default async function SignupPage() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <AuthLayout variant="wide">
        <SignupFlow step={0} initial={null} />
      </AuthLayout>
    );
  }

  const row = await db.user.findUnique({
    where: { id: viewer.id },
    select: { signupStep: true, stage: true, naturalFit: true },
  });

  const step = row?.signupStep ?? 0;
  if (step >= 3) redirect(viewer.onboardingDone ? '/' : '/welcome');

  return (
    <AuthLayout variant="wide">
      <SignupFlow
        step={step === 0 ? 1 : step}
        initial={{ stage: row?.stage ?? null, naturalFit: (row?.naturalFit ?? []) as string[] }}
      />
    </AuthLayout>
  );
}
