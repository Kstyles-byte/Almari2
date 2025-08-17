'use client';

import { useState, useTransition, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Volume, VolumeX, Moon, Sun, AlertTriangle, CheckCircle } from 'lucide-react';
import { Database } from '@/types/supabase';
import { updateNotificationPreferenceAction, updateQuietHoursAction } from '@/actions/notification-preferences';
import { useToast } from '@/components/ui/use-toast';
import { pushNotificationService } from '@/lib/services/pushNotificationService';

type NotificationType = Database['public']['Enums']['NotificationType'];
type NotificationChannel = Database['public']['Enums']['NotificationChannel'];
type UserRole = Database['public']['Enums']['UserRole'];

interface NotificationPreference {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface QuietHours {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface Props {
  initialPreferences: NotificationPreference[];
  userRole: UserRole;
  userId: string;
}

// Define notification categories by user role
const getNotificationsByRole = (role: UserRole): Array<{
  category: string;
  description: string;
  types: Array<{ type: NotificationType; label: string; description: string; critical?: boolean }>
}> => {
  const baseNotifications = [
    {
      category: 'Account & Security',
      description: 'Important account and security related notifications',
      types: [
        { type: 'ACCOUNT_VERIFICATION' as NotificationType, label: 'Account Verification', description: 'Account verification updates', critical: true },
        { type: 'PASSWORD_RESET' as NotificationType, label: 'Password Reset', description: 'Password reset confirmations', critical: true },
        { type: 'SECURITY_ALERT' as NotificationType, label: 'Security Alerts', description: 'Important security notifications', critical: true },
      ]
    },
    {
      category: 'System',
      description: 'Platform maintenance and system notifications',
      types: [
        { type: 'MAINTENANCE_NOTICE' as NotificationType, label: 'Maintenance Notice', description: 'Scheduled maintenance notifications' },
      ]
    }
  ];

  const roleSpecificNotifications: Record<UserRole, any[]> = {
    CUSTOMER: [
      {
        category: 'Orders',
        description: 'Updates about your orders and deliveries',
        types: [
          { type: 'ORDER_STATUS_CHANGE', label: 'Order Status Updates', description: 'When your order status changes' },
          { type: 'ORDER_SHIPPED', label: 'Order Shipped', description: 'When your order is shipped' },
          { type: 'ORDER_DELIVERED', label: 'Order Delivered', description: 'When your order is delivered' },
          { type: 'PICKUP_READY', label: 'Pickup Ready', description: 'When your order is ready for pickup' },
          { type: 'ORDER_PICKED_UP', label: 'Order Picked Up', description: 'Confirmation when order is picked up' },
        ]
      },
      {
        category: 'Payments & Refunds',
        description: 'Payment and refund related notifications',
        types: [
          { type: 'PAYMENT_FAILED', label: 'Payment Failed', description: 'When payment processing fails', critical: true },
          { type: 'RETURN_REQUESTED', label: 'Return Requested', description: 'Return request confirmations' },
          { type: 'RETURN_APPROVED', label: 'Return Approved', description: 'When return is approved' },
          { type: 'RETURN_REJECTED', label: 'Return Rejected', description: 'When return is rejected' },
          { type: 'REFUND_PROCESSED', label: 'Refund Processed', description: 'When refund is processed' },
        ]
      },
      {
        category: 'Products & Wishlist',
        description: 'Product availability and price notifications',
        types: [
          { type: 'PRODUCT_BACK_IN_STOCK', label: 'Back in Stock', description: 'Wishlisted products back in stock' },
          { type: 'PRODUCT_PRICE_DROP', label: 'Price Drop', description: 'When wishlisted product price drops' },
          { type: 'WISHLIST_REMINDER', label: 'Wishlist Reminder', description: 'Weekly wishlist summary' },
        ]
      },
      {
        category: 'Coupons & Reviews',
        description: 'Coupon updates and review responses',
        types: [
          { type: 'COUPON_APPLIED', label: 'Coupon Applied', description: 'Successful coupon applications' },
          { type: 'COUPON_FAILED', label: 'Coupon Failed', description: 'Failed coupon applications' },
          { type: 'REVIEW_RESPONSE', label: 'Review Response', description: 'Responses to your reviews' },
        ]
      }
    ],
    VENDOR: [
      {
        category: 'Orders',
        description: 'New orders and order management',
        types: [
          { type: 'NEW_ORDER_VENDOR', label: 'New Orders', description: 'When you receive new orders', critical: true },
          { type: 'PAYMENT_RECEIVED', label: 'Payment Received', description: 'When payment is received for orders' },
        ]
      },
      {
        category: 'Inventory',
        description: 'Stock and inventory alerts',
        types: [
          { type: 'LOW_STOCK_ALERT', label: 'Low Stock Alert', description: 'When products are running low' },
          { type: 'POPULAR_PRODUCT_ALERT', label: 'Popular Products', description: 'When products become trending' },
        ]
      },
      {
        category: 'Financial',
        description: 'Payouts and financial notifications',
        types: [
          { type: 'PAYOUT_PROCESSED', label: 'Payout Processed', description: 'When payouts are processed' },
          { type: 'PAYOUT_ON_HOLD', label: 'Payout On Hold', description: 'When payouts are on hold' },
          { type: 'PAYOUT_HOLD_RELEASED', label: 'Payout Hold Released', description: 'When payout holds are released' },
          { type: 'MINIMUM_PAYOUT_REACHED', label: 'Minimum Payout Reached', description: 'When you reach minimum payout threshold' },
          { type: 'COMMISSION_RATE_CHANGED', label: 'Commission Changes', description: 'When commission rates change' },
        ]
      },
      {
        category: 'Returns & Reviews',
        description: 'Return management and customer reviews',
        types: [
          { type: 'RETURN_VENDOR_ACTION_REQUIRED', label: 'Return Action Required', description: 'When vendor action is needed for returns' },
          { type: 'RETURN_VENDOR_COMPLETED', label: 'Return Completed', description: 'When return process is completed' },
          { type: 'NEW_PRODUCT_REVIEW', label: 'New Reviews', description: 'New reviews on your products' },
          { type: 'REVIEW_MILESTONE', label: 'Review Milestones', description: 'When products reach review milestones' },
        ]
      },
      {
        category: 'Coupons',
        description: 'Coupon management notifications',
        types: [
          { type: 'COUPON_CREATED', label: 'Coupon Created', description: 'Coupon creation confirmations' },
          { type: 'COUPON_EXPIRED', label: 'Coupon Expired', description: 'Coupon expiration warnings' },
          { type: 'COUPON_USAGE_THRESHOLD', label: 'Coupon Usage Threshold', description: 'Coupon usage limit alerts' },
        ]
      }
    ],
    AGENT: [
      {
        category: 'Assignments',
        description: 'Pickup and delivery assignments',
        types: [
          { type: 'NEW_PICKUP_ASSIGNMENT', label: 'New Pickup Assignment', description: 'When assigned to pick up orders', critical: true },
          { type: 'RETURN_PICKUP_ASSIGNMENT', label: 'Return Pickup Assignment', description: 'When assigned to pickup returns' },
          { type: 'AGENT_LOCATION_NAME_UPDATE', label: 'Location Updates', description: 'Location and address updates' },
        ]
      }
    ],
    ADMIN: [
      {
        category: 'System Alerts',
        description: 'High-level system and business alerts',
        types: [
          { type: 'HIGH_VALUE_ORDER_ALERT', label: 'High Value Orders', description: 'Orders above threshold amount', critical: true },
          { type: 'NEW_VENDOR_APPLICATION', label: 'New Vendor Applications', description: 'New vendor registration requests', critical: true },
        ]
      }
    ]
  };

  return [...baseNotifications, ...(roleSpecificNotifications[role] || [])];
};

const SUPPORTED_CHANNELS: Array<{ value: NotificationChannel; label: string; description: string; icon: any }> = [
  { value: 'IN_APP', label: 'In-App', description: 'Notifications within the application', icon: Bell },
  { value: 'PUSH', label: 'Push', description: 'Browser push notifications', icon: Volume },
];

export default function NotificationPreferences({ initialPreferences, userRole, userId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    start_time: '22:00',
    end_time: '08:00'
  });
  const [pushStatus, setPushStatus] = useState<{
    permission: NotificationPermission;
    isSubscribed: boolean;
    browserInfo: any;
  }>({
    permission: 'default',
    isSubscribed: false,
    browserInfo: null
  });
  const { toast } = useToast();

  // Check push notification status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      const permission = pushNotificationService.getPermissionStatus();
      const subscription = await pushNotificationService.getSubscription();
      const browserInfo = pushNotificationService.getBrowserInfo();
      
      setPushStatus({
        permission,
        isSubscribed: !!subscription,
        browserInfo
      });
    };
    
    checkPushStatus();
  }, []);

  // Create preference map for quick lookup
  const preferenceMap = new Map<string, boolean>();
  initialPreferences.forEach(pref => {
    preferenceMap.set(`${pref.type}_${pref.channel}`, pref.enabled);
  });

  const handlePreferenceChange = async (type: NotificationType, channel: NotificationChannel, enabled: boolean) => {
    startTransition(async () => {
      try {
        const result = await updateNotificationPreferenceAction({
          userId,
          type,
          channel,
          enabled
        });
        
        if (result.success) {
          // Update local state
          preferenceMap.set(`${type}_${channel}`, enabled);
          toast({
            title: 'Preference Updated',
            description: `${type.replace(/_/g, ' ')} notifications ${enabled ? 'enabled' : 'disabled'} for ${channel}`,
          });
        }
      } catch (error) {
        console.error('Error updating preference:', error);
        toast({
          title: 'Error',
          description: 'Failed to update notification preference',
          variant: 'destructive',
        });
      }
    });
  };

  const handleQuietHoursChange = async (hours: Partial<QuietHours>) => {
    const newQuietHours = { ...quietHours, ...hours };
    setQuietHours(newQuietHours);
    
    startTransition(async () => {
      try {
        const result = await updateQuietHoursAction({
          userId,
          ...newQuietHours
        });
        
        if (result.success) {
          toast({
            title: 'Quiet Hours Updated',
            description: 'Your quiet hours preferences have been saved',
          });
        }
      } catch (error) {
        console.error('Error updating quiet hours:', error);
        toast({
          title: 'Error',
          description: 'Failed to update quiet hours',
          variant: 'destructive',
        });
      }
    });
  };

  const handleManualPushSetup = async () => {
    startTransition(async () => {
      try {
        const permission = await pushNotificationService.requestPermission();
        
        if (permission === 'granted') {
          // Use fallback method for browsers that might have issues
          const subscription = pushStatus.browserInfo?.name === 'brave' 
            ? await pushNotificationService.subscribeWithFallback(userId)
            : await pushNotificationService.subscribe(userId);
          
          if (subscription) {
            setPushStatus(prev => ({
              ...prev,
              permission,
              isSubscribed: true
            }));
            
            toast({
              title: 'Push Notifications Enabled',
              description: 'You will now receive push notifications from this browser',
            });
          } else {
            let errorMessage = 'Failed to complete push notification setup.';
            
            if (pushStatus.browserInfo?.name === 'brave') {
              errorMessage += ' Try disabling Brave Shields for this site.';
            } else if (pushStatus.browserInfo?.name === 'edge') {
              errorMessage += ' Make sure to interact with the page first.';
            }
            
            toast({
              title: 'Setup Failed',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        } else if (permission === 'denied') {
          toast({
            title: 'Permission Denied',
            description: 'Push notifications were blocked. You can enable them in your browser settings.',
            variant: 'destructive',
          });
        }
        
        // Update status regardless
        setPushStatus(prev => ({
          ...prev,
          permission
        }));
      } catch (error) {
        console.error('Error setting up push notifications:', error);
        toast({
          title: 'Setup Error',
          description: 'An error occurred while setting up push notifications',
          variant: 'destructive',
        });
      }
    });
  };

  const notifications = getNotificationsByRole(userRole);

  return (
    <div className="p-6">
      {/* Debug Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="font-medium text-sm">Debug Info</h4>
          <div className="text-xs mt-1 space-y-1">
            <div>User Role: {userRole}</div>
            <div>User ID: {userId}</div>
            <div>Push Permission: {pushStatus.permission}</div>
            <div>Push Subscribed: {pushStatus.isSubscribed.toString()}</div>
            <div>Browser: {pushStatus.browserInfo?.name || 'unknown'}</div>
            <div>Preferences loaded: {initialPreferences.length}</div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Notification Types</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="timing">Timing & Quiet Hours</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preferences" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose which types of notifications you want to receive. Critical notifications cannot be disabled.
            </p>
          </div>
          
          {notifications.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-base">{category.category}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.types.map((notif) => (
                  <div key={notif.type} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{notif.label}</h4>
                          {notif.critical && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{notif.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4">
                      {SUPPORTED_CHANNELS.map((channel) => {
                        const preferenceKey = `${notif.type}_${channel.value}`;
                        const isEnabled = preferenceMap.get(preferenceKey) ?? true;
                        const isDisabled = notif.critical && !isEnabled;
                        
                        return (
                          <div key={channel.value} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <channel.icon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{channel.label}</span>
                            </div>
                            <Switch
                              checked={isEnabled}
                              disabled={isPending || (notif.critical && isEnabled)}
                              onCheckedChange={(checked) => 
                                handlePreferenceChange(notif.type, channel.value, checked)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="channels" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Notification Channels</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure how you want to receive notifications.
            </p>
          </div>
          
          <div className="grid gap-4">
            {SUPPORTED_CHANNELS.map((channel) => (
              <Card key={channel.value}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <channel.icon className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{channel.label} Notifications</CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {channel.value === 'PUSH' ? (
                      <>
                        {/* Browser Compatibility Info */}
                        {pushStatus.browserInfo && (
                          <div className={`p-3 rounded-md text-sm ${
                            pushStatus.browserInfo.isSupported ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {pushStatus.browserInfo.isSupported ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {pushStatus.browserInfo.name.charAt(0).toUpperCase() + pushStatus.browserInfo.name.slice(1)} Browser
                              </span>
                            </div>
                            <p className="text-xs">{pushStatus.browserInfo.message}</p>
                          </div>
                        )}
                        
                        {/* Push Notification Status */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Push notification status</span>
                            <Badge variant={
                              pushStatus.permission === 'granted' ? 'default' : 
                              pushStatus.permission === 'denied' ? 'destructive' : 'secondary'
                            }>
                              {pushStatus.permission === 'granted' ? 'Enabled' :
                               pushStatus.permission === 'denied' ? 'Blocked' : 'Not Set'}
                            </Badge>
                          </div>
                          
                          {pushStatus.permission === 'granted' && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Subscription status</span>
                              <Badge variant={pushStatus.isSubscribed ? 'default' : 'secondary'}>
                                {pushStatus.isSubscribed ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Manual Setup Button */}
                        {(pushStatus.permission === 'default' || !pushStatus.isSubscribed) && (
                          <Button
                            onClick={handleManualPushSetup}
                            disabled={isPending}
                            className="w-full"
                            variant={pushStatus.permission === 'default' ? 'default' : 'outline'}
                          >
                            {pushStatus.permission === 'default' ? 'Enable Push Notifications' : 'Retry Setup'}
                          </Button>
                        )}

                        {/* Test Push Notification Button */}
                        {pushStatus.permission === 'granted' && pushStatus.isSubscribed && (
                          <Button
                            onClick={async () => {
                              try {
                                await pushNotificationService.testNotification();
                                toast({
                                  title: 'Test Sent',
                                  description: 'A test push notification has been sent',
                                });
                              } catch (error) {
                                toast({
                                  title: 'Test Failed',
                                  description: 'Failed to send test notification',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            disabled={isPending}
                            className="w-full"
                            variant="outline"
                          >
                            Send Test Notification
                          </Button>
                        )}
                        
                        {/* Browser-specific help */}
                        {pushStatus.permission === 'denied' && (
                          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                            <p className="font-medium mb-1">Push notifications are blocked</p>
                            <p className="text-xs">
                              {pushStatus.browserInfo?.name === 'brave' && 
                                'In Brave, go to Settings → Shields → Global Shield Settings and allow notifications.'
                              }
                              {pushStatus.browserInfo?.name === 'edge' && 
                                'In Edge, click the notification icon in the address bar and select "Allow".'
                              }
                              {(!pushStatus.browserInfo?.name || ['chrome', 'firefox'].includes(pushStatus.browserInfo.name)) && 
                                'Click the notification icon in your browser\'s address bar and select "Allow".'
                              }
                            </p>
                          </div>
                        )}

                        {/* Debug Info for Development */}
                        {process.env.NODE_ENV === 'development' && pushStatus.browserInfo && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify({
                                browser: pushStatus.browserInfo.name,
                                permission: pushStatus.permission,
                                isSubscribed: pushStatus.isSubscribed,
                                supported: pushStatus.browserInfo.isSupported,
                                needsInteraction: pushStatus.browserInfo.needsUserInteraction
                              }, null, 2)}
                            </pre>
                          </details>
                        )}
                      </>
                    ) : (
                      /* In-App Channel */
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable {channel.label} notifications</span>
                        <Switch
                          checked={true} // Global channel toggle would go here
                          disabled={isPending}
                          onCheckedChange={() => {
                            // Handle global channel toggle
                            toast({
                              title: 'Feature Coming Soon',
                              description: 'Global channel toggles will be available soon',
                            });
                          }}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      This will affect all notification types for this channel.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="timing" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Timing & Quiet Hours</h3>
            <p className="text-sm text-gray-600 mb-6">
              Set quiet hours when you don't want to receive non-critical notifications.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Quiet Hours</CardTitle>
                  <CardDescription>
                    During quiet hours, only critical notifications will be delivered
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable quiet hours</span>
                <Switch
                  checked={quietHours.enabled}
                  disabled={isPending}
                  onCheckedChange={(enabled) => handleQuietHoursChange({ enabled })}
                />
              </div>
              
              {quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Start Time</label>
                    <input
                      type="time"
                      value={quietHours.start_time}
                      onChange={(e) => handleQuietHoursChange({ start_time: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time</label>
                    <input
                      type="time"
                      value={quietHours.end_time}
                      onChange={(e) => handleQuietHoursChange({ end_time: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <strong>Note:</strong> Critical notifications (security alerts, payment failures, high-priority orders) 
                will still be delivered during quiet hours to ensure you don't miss important updates.
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Frequency Settings</CardTitle>
                  <CardDescription>
                    Control how often you receive certain types of notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Batch similar notifications</span>
                    <p className="text-xs text-gray-500">Group similar notifications together</p>
                  </div>
                  <Switch
                    checked={true}
                    disabled={isPending}
                    onCheckedChange={() => {
                      toast({
                        title: 'Feature Coming Soon',
                        description: 'Notification batching will be available soon',
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Weekly summary</span>
                    <p className="text-xs text-gray-500">Receive a weekly summary of activities</p>
                  </div>
                  <Switch
                    checked={false}
                    disabled={isPending}
                    onCheckedChange={() => {
                      toast({
                        title: 'Feature Coming Soon',
                        description: 'Weekly summaries will be available soon',
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Changes are saved automatically
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isPending}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
