'use client';

import { useState } from 'react';

export default function DebugPushPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const clearLogs = () => {
    setLogs([]);
    console.clear();
  };

  const runPushTest = async () => {
    setIsRunning(true);
    clearLogs();
    addLog('🚀 Starting Push Notification Debug Test');

    try {
      // Step 1: Environment Check
      addLog('✅ Step 1: Checking environment...');
      const envCheck = {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window
      };
      
      addLog(`Environment: ${JSON.stringify(envCheck)}`);
      
      if (!envCheck.serviceWorker || !envCheck.pushManager || !envCheck.notifications) {
        addLog('❌ Browser does not support push notifications', 'error');
        return;
      }

      // Step 2: Permission Check
      addLog('✅ Step 2: Checking permission...');
      const permission = Notification.permission;
      addLog(`Current permission: ${permission}`);

      if (permission === 'denied') {
        addLog('❌ Notifications are blocked. Please enable in browser settings and refresh.', 'error');
        return;
      }

      // Step 3: Request Permission if needed
      if (permission === 'default') {
        addLog('📝 Step 3: Requesting permission...');
        const newPermission = await Notification.requestPermission();
        addLog(`Permission result: ${newPermission}`);
        
        if (newPermission !== 'granted') {
          addLog('❌ User denied permission request', 'error');
          return;
        }
      }

      // Step 4: Service Worker Registration
      addLog('✅ Step 4: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      addLog('Service worker registered successfully');

      // Step 5: Check Existing Subscription
      addLog('✅ Step 5: Checking existing subscription...');
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        addLog('Found existing subscription - unsubscribing...');
        await existingSubscription.unsubscribe();
        addLog('Unsubscribed from existing subscription');
      } else {
        addLog('No existing subscription found');
      }

      // Step 6: Create New Subscription
      addLog('✅ Step 6: Creating new push subscription...');
      const vapidKey = 'BMCDlWHwmhqqCk3gtfnMzFwNpDbAP3stR0SL5DofnuIf0Lkt6F9uxBz_x1MDKrjwYqdDqJW6R645IXNw2iZUV38';
      
      function urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      addLog('Push subscription created successfully');
      addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`);

      // Step 7: Prepare Subscription Data
      addLog('✅ Step 7: Preparing subscription data...');
      const subscriptionData = {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!)))
          }
        }
      };
      
      addLog(`P256DH Key Length: ${subscriptionData.subscription.keys.p256dh.length}`);
      addLog(`Auth Key Length: ${subscriptionData.subscription.keys.auth.length}`);

      // Step 8: Save to Database
      addLog('✅ Step 8: Saving subscription to database...');
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      const responseText = await response.text();
      addLog(`API Response Status: ${response.status}`);
      addLog(`API Response: ${responseText}`);

      if (response.ok) {
        addLog('🎉 Subscription saved successfully!', 'success');

        // Step 9: Test Push Notification
        addLog('✅ Step 9: Testing push notification...');
        const testResponse = await fetch('/api/test-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Test from debug page' })
        });
        
        const testResponseText = await testResponse.text();
        addLog(`Test Response Status: ${testResponse.status}`);
        addLog(`Test Response: ${testResponseText}`);
        
        if (testResponse.ok) {
          addLog('🎉 Test notification sent successfully!', 'success');
          addLog('🔔 You should see a push notification now!', 'success');
        } else {
          addLog(`❌ Test failed: ${testResponseText}`, 'error');
        }

      } else {
        addLog(`❌ Failed to save subscription: ${responseText}`, 'error');
        
        if (response.status === 401) {
          addLog('❌ Authentication error - please make sure you are logged in', 'error');
        }
      }

    } catch (error: any) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔧 Push Notification Debug</h1>
        <p className="text-gray-600">Test your push notification system end-to-end</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runPushTest}
          disabled={isRunning}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? '⏳ Running Test...' : '🚀 Run Push Test'}
        </button>
        
        <button
          onClick={clearLogs}
          disabled={isRunning}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🗑️ Clear Logs
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click "Run Push Test" to start debugging...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Make sure you are logged in to your account</li>
          <li>Click "Run Push Test" to start the debugging process</li>
          <li>Follow the prompts to allow notifications when asked</li>
          <li>Check the logs below and your browser console for detailed information</li>
          <li>You should receive a test push notification if everything works</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🔍 What This Test Does:</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Checks browser support for push notifications</li>
          <li>Requests notification permission</li>
          <li>Registers the service worker</li>
          <li>Creates a push subscription</li>
          <li>Saves the subscription to your database</li>
          <li>Sends a test push notification</li>
        </ul>
      </div>
    </div>
  );
}
