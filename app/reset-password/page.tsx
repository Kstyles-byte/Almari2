import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Define the props type to include searchParams
interface ResetPasswordPageProps {
  searchParams?: {
    message?: string;
    code?: string; // Supabase might add a code param, though often handled by session
    error?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const message = searchParams?.message;
  const error = searchParams?.error;

  // Add a check here? If the user isn't in the special reset session,
  // they shouldn't really be on this page. However, protecting server pages
  // based on auth state often happens in middleware or layout checks.
  // For now, we just render the form.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      {/* Display message or error from redirects */}
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