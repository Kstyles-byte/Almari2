import { redirect } from 'next/navigation';

export default function AgentNotificationSettingsPage() {
  // Redirect to the general notification settings page
  redirect('/settings/notifications');
}
