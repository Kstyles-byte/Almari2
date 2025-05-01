'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, AlertCircle } from 'lucide-react';
import { useFormStatus, useFormState } from 'react-dom';
import { deleteHeroBannerAction } from '@/actions/content'; // Assuming this action exists

// Simple Submit Button for Delete Form
function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="destructive"
      size="sm"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="bg-red-600 hover:bg-red-700 text-white mt-2"
    >
      {pending ? (
        <>
          <div className="h-4 w-4 animate-spin mr-2 border-2 border-white/30 border-t-white rounded-full" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" /> Delete This Banner
        </>
      )}
    </Button>
  );
}

// Component for the Delete Button Form
interface DeleteBannerFormProps {
  bannerId: string;
}

interface DeleteFormState {
  success: boolean;
  message: string;
  error: string | null;
}

export function DeleteBannerForm({ bannerId }: DeleteBannerFormProps) {
  const deleteActionWithId = deleteHeroBannerAction.bind(null, bannerId);

  // Define a type-safe wrapper function for return type matching useFormState expectation
  const formAction = async (prevState: DeleteFormState | undefined, formData: FormData): Promise<DeleteFormState> => {
      try {
          // The bound action likely only uses the bannerId and doesn't need other args
          await deleteActionWithId(); // Call the bound action without arguments
          // Adjust success message based on actual action result if available
          return { success: true, message: 'Banner deleted successfully.', error: null };
      } catch (e: any) {
          return { success: false, message: '', error: e.message || 'Failed to delete banner.' };
      }
  };

  // Ensure initial state matches the expected type
  const initialState: DeleteFormState = { success: false, message: '', error: null };
  const [state, dispatch] = useFormState<DeleteFormState, FormData>(formAction, initialState);

  return (
    <Card className="border-red-100 bg-red-50 mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-700 text-lg font-heading flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-red-600">
          This action cannot be undone. Please be certain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-3">
          Deleting this banner will remove it permanently from your site. Any associated images will also be deleted from storage.
        </p>
        <form action={dispatch}>
          <DeleteSubmitButton />
          {state?.error && (
            <div className="mt-3 text-sm text-red-700 bg-red-100 p-2 rounded border border-red-200">
              Error: {state.error}
            </div>
          )}
          {state?.success && (
            <div className="mt-3 text-sm text-green-700 bg-green-100 p-2 rounded border border-green-200">
              {state.message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 