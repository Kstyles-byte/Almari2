'use client';

import { useState } from 'react';
import { pushNotificationService } from '../../lib/services/pushNotificationService';

interface PushSubscriptionDebugProps {
  userId: string;
}

export function PushSubscriptionDebug({ userId }: PushSubscriptionDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      // Check frontend subscription status
      const subscription = await pushNotificationService.getSubscription();
      const permission = pushNotificationService.getPermissionStatus();
      const browserInfo = pushNotificationService.getBrowserInfo();
      
      // Check backend debug info
      const response = await fetch('/api/debug-push');
      const backendInfo = await response.json();
      
      setDebugInfo({
        frontend: {
          hasSubscription: !!subscription,
          subscription: subscription ? {
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            keys: !!subscription.getKey('p256dh')
          } : null,
          permission,
          browserInfo
        },
        backend: backendInfo
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Debug failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const forceResubscribe = async () => {
    setLoading(true);
    try {
      console.log('[Debug] Forcing resubscription...');
      
      // First unsubscribe
      await pushNotificationService.unsubscribe(userId);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then subscribe again
      const subscription = await pushNotificationService.subscribe(userId);
      
      console.log('[Debug] Resubscription result:', !!subscription);
      
      // Refresh debug info
      await runDebug();
    } catch (error) {
      console.error('[Debug] Resubscription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-medium">Push Notification Debug</h3>
      
      <div className="flex gap-2">
        <button 
          onClick={runDebug} 
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Run Debug Check'}
        </button>
        
        <button 
          onClick={forceResubscribe} 
          disabled={loading}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm disabled:opacity-50"
        >
          Force Resubscribe
        </button>
      </div>
      
      {debugInfo && (
        <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-96 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}

