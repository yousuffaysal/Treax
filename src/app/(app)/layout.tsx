import { redirect } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { RealtimeProvider } from '@/components/providers/realtime-provider';

/**
 * Everything behind the app chrome. Individual pages compose <AppShell> or
 * <WideShell> themselves, because the reader, admin room and agent console all
 * want the top bar without the three-column grid.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();

  // A half-finished signup resumes where it stopped rather than dropping the
  // builder into an empty feed.
  if (!viewer.onboardingDone) redirect('/onboarding');

  return <RealtimeProvider userId={viewer.id}>{children}</RealtimeProvider>;
}
