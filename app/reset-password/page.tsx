import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawMessage = params.message;
  const rawError = params.error;
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  // Add a check here? If the user isn't in the special reset session,
  // they shouldn't really be on this page. However, protecting server pages
  // based on auth state often happens in middleware or layout checks.
  // For now, we just render the form.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      {/* Display the message or error if present in the URL */}
      {message && (
        <p className="mb-4 rounded-md bg-yellow-100 p-3 text-center text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          {message}
        </p>
      )}
       {error && (
        <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      
      <ResetPasswordForm />
    </div>
  );
} 