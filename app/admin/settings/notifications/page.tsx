import { redirect } from 'next/navigation';

export default function AdminNotificationSettingsPage() {
  // Redirect to the general notification settings page
  redirect('/settings/notifications');
}
