import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Define the props type to include searchParams
interface ForgotPasswordPageProps {
  searchParams?: {
    message?: string;
  };
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const message = searchParams?.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      {/* Display the message if it exists */}
      {message && (
        <p className="mb-4 rounded-md bg-yellow-100 p-3 text-center text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          {message}
        </p>
      )}
      
      {/* Render the forgot password form component */}
      <ForgotPasswordForm />
    </div>
  );
} 