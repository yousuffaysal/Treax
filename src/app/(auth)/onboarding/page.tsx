import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { OnboardingFlow } from './onboarding-flow';

export const metadata: Metadata = { title: 'Set up your profile' };

/** Onboarding — port of Treax.dc.html:1895-1940. Step is read from the row. */
export default async function OnboardingPage() {
  const viewer = await requireViewer();

  const row = await db.user.findUnique({
    where: { id: viewer.id },
    select: { onboardingStep: true, tags: true, building: true, handle: true, cadence: true },
  });

  return (
    <OnboardingFlow
      initialStep={Math.min(2, row?.onboardingStep ?? 0)}
      initial={{
        skills: row?.tags ?? [],
        building: row?.building ?? '',
        handle: row?.handle ?? '',
        cadence: (row?.cadence ?? 5) as 3 | 5 | 7,
      }}
    />
  );
}
