'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Volume, VolumeX, Moon, Sun } from 'lucide-react';
import { Database } from '@/types/supabase';
import { updateNotificationPreferenceAction, updateQuietHoursAction } from '@/actions/notification-preferences';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  const notifications = getNotificationsByRole(userRole);

  return (
    <div className="p-6">
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
