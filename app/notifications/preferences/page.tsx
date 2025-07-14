import { Suspense } from 'react';
import { getUserPreferencesAction } from '../../../actions/notification-preferences';
import PreferenceForm from '../../../components/notifications/PreferenceForm';

export default async function NotificationPreferencesPage() {
  const preferences = await getUserPreferencesAction();
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Notification Preferences</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <PreferenceForm initialData={preferences} />
      </Suspense>
    </div>
  );
} 