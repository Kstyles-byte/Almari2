'use client';

import dynamic from 'next/dynamic';

// Lazy load to avoid SSR issues
const MarkReadyButton = dynamic(() => import('./MarkReadyButton'), { 
  ssr: false,
  loading: () => (
    <button 
      disabled 
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
    >
      Loading...
    </button>
  )
});

interface MarkReadyButtonWrapperProps {
  orderId: string;
}

export default function MarkReadyButtonWrapper({ orderId }: MarkReadyButtonWrapperProps) {
  return <MarkReadyButton orderId={orderId} />;
}
