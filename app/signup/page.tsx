import { SignUpForm } from '@/components/auth/SignUpForm';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawMessage = params.message;
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      {/* Display the message if provided in the URL */}
      {message && (
        <p className="mb-4 rounded-md bg-yellow-100 p-3 text-center text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          {message}
        </p>
      )}
      
      {/* Render the sign-up form component */}
      <SignUpForm />
    </div>
  );
} 