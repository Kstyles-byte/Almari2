'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewResponseFormProps {
  reviewId: string;
}

export default function ReviewResponseForm({ reviewId }: ReviewResponseFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // This would be replaced with a server action in a real implementation
      // await submitReviewResponse(reviewId, response);
      
      // For now, simulate an API call
      await new Promise(res => setTimeout(res, 1500));
      
      toast.success('Response submitted successfully');
      
      // Redirect back to the reviews page
      router.push('/vendor/reviews');
      router.refresh();
    } catch (error) {
      console.error('Error submitting review response:', error);
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
            Your Response
          </label>
          <textarea
            id="response"
            name="response"
            rows={6}
            value={response}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            placeholder="Write your response to the customer's review here..."
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push('/vendor/reviews')}
            className="mr-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !response.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 