'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { pushNotificationService } from '../../lib/services/pushNotificationService';

interface PushNotificationPermissionProps {
  userId?: string;
  onPermissionChange?: (granted: boolean) => void;
  showCard?: boolean;
  className?: string;
}

export function PushNotificationPermission({ 
  userId, 
  onPermissionChange,
  showCard = true,
  className = ''
}: PushNotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check initial state
  useEffect(() => {
    checkPermissionStatus();
    checkSubscriptionStatus();
  }, [userId]);

  // Check permission status
  const checkPermissionStatus = () => {
    const currentPermission = pushNotificationService.getPermissionStatus();
    setPermission(currentPermission);
    
    // Show prompt if permission is default and we haven't asked before
    const hasAskedBefore = localStorage.getItem('push_permission_asked') === 'true';
    if (currentPermission === 'default' && !hasAskedBefore) {
      setShowPrompt(true);
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  // Request permission
  const requestPermission = async () => {
    if (!userId) {
      setError('User ID is required for notifications');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      
      // Mark that we've asked for permission
      localStorage.setItem('push_permission_asked', 'true');
      setShowPrompt(false);

      if (newPermission === 'granted') {
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribe(userId);
        setIsSubscribed(!!subscription);
        
        if (subscription) {
          onPermissionChange?.(true);
        }
      } else {
        onPermissionChange?.(false);
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from notifications
  const unsubscribe = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.unsubscribe(userId);
      if (success) {
        setIsSubscribed(false);
        onPermissionChange?.(false);
      } else {
        setError('Failed to disable notifications. Please try again.');
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setError('Failed to disable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Test notification
  const testNotification = async () => {
    try {
      await pushNotificationService.testNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setError('Failed to send test notification');
    }
  };

  // Dismiss prompt
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('push_permission_asked', 'true');
  };

  // Get status info
  const getStatusInfo = () => {
    if (permission === 'denied') {
      return {
        icon: BellOff,
        color: 'destructive' as const,
        text: 'Blocked',
        description: 'Notifications are blocked. Enable them in your browser settings.'
      };
    }
    
    if (permission === 'granted' && isSubscribed) {
      return {
        icon: Bell,
        color: 'default' as const,
        text: 'Enabled',
        description: 'You will receive push notifications for important updates.'
      };
    }
    
    return {
      icon: BellOff,
      color: 'secondary' as const,
      text: 'Disabled',
      description: 'Enable notifications to stay updated on important events.'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Permission prompt
  if (showPrompt && permission === 'default') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Bell className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Stay updated with notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified about order updates, new messages, and important events.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              size="sm" 
              onClick={requestPermission}
              disabled={loading}
            >
              {loading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={dismissPrompt}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Card view
  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Push Notifications
            <Badge variant={statusInfo.color}>{statusInfo.text}</Badge>
          </CardTitle>
          <CardDescription>
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Browser Notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive notifications even when the app is closed
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {permission === 'granted' && isSubscribed && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={testNotification}
                >
                  Test
                </Button>
              )}
              
              {permission === 'granted' ? (
                <Button
                  size="sm"
                  variant={isSubscribed ? "destructive" : "default"}
                  onClick={isSubscribed ? unsubscribe : () => requestPermission()}
                  disabled={loading}
                >
                  {loading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
                </Button>
              ) : permission === 'denied' ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open('https://support.google.com/chrome/answer/3220216', '_blank')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={requestPermission}
                  disabled={loading}
                >
                  {loading ? 'Requesting...' : 'Enable'}
                </Button>
              )}
            </div>
          </div>
          
          {permission === 'denied' && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">To enable notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Change notifications from "Block" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Inline toggle view
  return (
    <div className={`flex items-center justify-between p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <StatusIcon className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
        </div>
        <Badge variant={statusInfo.color}>{statusInfo.text}</Badge>
      </div>
      
      {permission === 'granted' ? (
        <Button
          size="sm"
          variant={isSubscribed ? "destructive" : "default"}
          onClick={isSubscribed ? unsubscribe : () => requestPermission()}
          disabled={loading}
        >
          {loading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
        </Button>
      ) : permission === 'denied' ? (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.open('https://support.google.com/chrome/answer/3220216', '_blank')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={requestPermission}
          disabled={loading}
        >
          {loading ? 'Requesting...' : 'Enable'}
        </Button>
      )}
    </div>
  );
}
