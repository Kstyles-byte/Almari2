import { redirect } from 'next/navigation';

export default function VendorNotificationSettingsPage() {
  // Redirect to the general notification settings page
  redirect('/settings/notifications');
}
