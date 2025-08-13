'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  TestTube, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { pushNotificationService } from '../../lib/services/pushNotificationService';
import { PushNotificationPermission } from './push-notification-permission';

interface Phase2DemoProps {
  userId?: string;
}

export function Phase2Demo({ userId }: Phase2DemoProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    hasMore,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refreshCount,
    subscribe,
    unsubscribe,
    reconnect,
    getNotificationById,
    getUnreadNotifications,
    filterNotificationsByType
  } = useNotificationContext();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)]);
  };

  // Test functions
  const testRealTimeConnection = () => {
    if (isConnected) {
      unsubscribe();
      addTestResult('Real-time connection unsubscribed');
    } else {
      subscribe();
      addTestResult('Real-time connection subscribed');
    }
  };

  const testReconnection = () => {
    reconnect();
    addTestResult('Attempting to reconnect...');
  };

  const testRefreshCount = async () => {
    await refreshCount();
    addTestResult(`Refreshed notification count: ${unreadCount}`);
  };

  const testFetchNotifications = async () => {
    await fetchNotifications();
    addTestResult(`Fetched ${notifications.length} notifications`);
  };

  const testMarkAllAsRead = async () => {
    await markAllAsRead();
    addTestResult('Marked all notifications as read');
  };

  const testPushNotification = async () => {
    try {
      await pushNotificationService.testNotification();
      addTestResult('Test push notification sent');
    } catch (error) {
      addTestResult(`Push notification failed: ${error}`);
    }
  };

  const testFilterNotifications = () => {
    const orderNotifications = filterNotificationsByType('ORDER_STATUS_CHANGE');
    addTestResult(`Found ${orderNotifications.length} order notifications`);
  };

  const testGetUnreadNotifications = () => {
    const unreadNotifications = getUnreadNotifications();
    addTestResult(`Found ${unreadNotifications.length} unread notifications`);
  };

  const testMarkSingleAsRead = async () => {
    const unreadNotifications = getUnreadNotifications();
    if (unreadNotifications.length > 0) {
      await markAsRead(unreadNotifications[0].id);
      addTestResult(`Marked notification "${unreadNotifications[0].title}" as read`);
    } else {
      addTestResult('No unread notifications to mark as read');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Phase 2: Real-time Notification System Demo</h1>
        <p className="text-muted-foreground">
          Testing real-time subscriptions, push notifications, and global state management
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              Real-time Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardContent>
        </Card>

        {/* Notification Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>Total: <Badge variant="secondary">{notifications.length}</Badge></div>
              <div>Unread: <Badge variant="destructive">{unreadCount}</Badge></div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>Loading: <Badge variant={loading ? "default" : "secondary"}>{loading ? "Yes" : "No"}</Badge></div>
              <div>Has More: <Badge variant={hasMore ? "default" : "secondary"}>{hasMore ? "Yes" : "No"}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Push Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Push Notification Settings</CardTitle>
          <CardDescription>
            Test and configure push notifications for your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationPermission 
            userId={userId} 
            showCard={false}
            className="border rounded-lg p-4"
          />
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Real-time & Context Tests
          </CardTitle>
          <CardDescription>
            Test various features of the Phase 2 notification system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <Button 
              onClick={testRealTimeConnection}
              variant={isConnected ? "destructive" : "default"}
              size="sm"
            >
              {isConnected ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isConnected ? "Disconnect" : "Connect"}
            </Button>

            <Button onClick={testReconnection} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reconnect
            </Button>

            <Button onClick={testRefreshCount} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Refresh Count
            </Button>

            <Button onClick={testFetchNotifications} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Fetch All
            </Button>

            <Button onClick={testMarkAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>

            <Button onClick={testMarkSingleAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Mark One Read
            </Button>

            <Button onClick={testFilterNotifications} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Filter Orders
            </Button>

            <Button onClick={testGetUnreadNotifications} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Get Unread
            </Button>

            <Button onClick={testPushNotification} variant="outline" size="sm">
              <TestTube className="h-4 w-4 mr-1" />
              Test Push
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Results</CardTitle>
          <CardDescription>
            Live log of test operations and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No test results yet. Click any test button to see results here.</p>
              </div>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="text-sm p-2 bg-muted rounded font-mono"
                >
                  {result}
                </div>
              ))
            )}
          </div>
          {testResults.length > 0 && (
            <Button 
              onClick={() => setTestResults([])} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Clear Results
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Notifications</CardTitle>
          <CardDescription>
            Live view of notifications from the context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded border ${
                    notification.is_read ? 'bg-muted/50' : 'bg-background border-primary'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase 2 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Real-time Supabase subscriptions with automatic reconnection</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Global notification context with optimistic updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Push notification service with browser support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Service Worker for background notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Permission management and settings UI</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Connection status monitoring and error handling</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
