import { redirect } from 'next/navigation';

/**
 * The top bar and left rail both link to /compose. The composer is a modal over
 * the feed rather than its own screen, so this route hands off to the feed with
 * the modal open — which also means the URL is shareable and the back button
 * closes the composer instead of leaving the app.
 */
export default function ComposePage() {
  redirect('/?compose=1');
}
