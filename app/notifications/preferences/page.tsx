import { redirect } from 'next/navigation';

export default function NotificationPreferencesPage() {
  // Redirect to the new settings route for consistency
  redirect('/settings/notifications');
} 