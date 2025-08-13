# Comprehensive Notification System Plan for Zervia E-commerce Platform

## Overview

The notification system will provide real-time updates to all user roles (Admins, Vendors, Customers, and Agents) through multiple channels:
- **In-App Notifications**: Real-time notifications within the web application
- **Email Notifications**: Automated emails for important events
- **Push Notifications**: Browser-based push notifications for immediate alerts
- **SMS Notifications**: Critical alerts via SMS (optional, for high-value orders)

## System Architecture

### 1. Core Components

#### Database Schema (Already Implemented)
- `Notification` table with comprehensive notification types
- `NotificationPreference` table for user preferences
- `UserUnreadNotificationCount` materialized view for performance

#### Notification Channels
- **IN_APP**: Real-time notifications in the web interface
- **EMAIL**: Automated email notifications
- **SMS**: SMS notifications for critical alerts
- **PUSH**: Browser push notifications

#### Notification Types (Current + Extended)
```typescript
enum NotificationType {
  // Order-related notifications
  ORDER_STATUS_CHANGE
  ORDER_SHIPPED
  ORDER_DELIVERED
  PICKUP_READY
  ORDER_PICKED_UP
  PAYMENT_FAILED
  
  // Return/Refund notifications
  RETURN_REQUESTED
  RETURN_APPROVED
  RETURN_REJECTED
  RETURN_VENDOR_ACTION_REQUIRED
  RETURN_VENDOR_COMPLETED
  REFUND_PROCESSED
  
  // Vendor notifications
  NEW_ORDER_VENDOR
  PAYOUT_PROCESSED
  NEW_VENDOR_APPLICATION
  
  // Agent notifications
  NEW_PICKUP_ASSIGNMENT
  RETURN_PICKUP_ASSIGNMENT
  
  // Admin notifications
  HIGH_VALUE_ORDER_ALERT
  LOW_STOCK_ALERT
  
  // System notifications
  ACCOUNT_VERIFICATION
  PASSWORD_RESET
  SECURITY_ALERT
  MAINTENANCE_NOTICE
}
```

## User Role-Specific Notification Requirements

### 1. Customer Notifications

#### Order Lifecycle Notifications
- **Order Confirmation**: When order is placed successfully
- **Payment Confirmation**: When payment is processed
- **Order Processing**: When order status changes to "Processing"
- **Order Shipped**: When order is shipped with tracking info
- **Order Delivered**: When order is delivered
- **Pickup Ready**: When order is ready for pickup
- **Order Picked Up**: Confirmation when order is picked up
- **Payment Failed**: When payment processing fails

#### Return/Refund Notifications
- **Return Request Confirmation**: When return request is submitted
- **Return Approved**: When return request is approved
- **Return Rejected**: When return request is rejected
- **Return Pickup Scheduled**: When return pickup is scheduled
- **Refund Processed**: When refund is processed
- **Return Completed**: When return process is completed

#### Account Notifications
- **Account Verification**: Email verification required
- **Password Reset**: Password reset confirmation
- **Security Alert**: Unusual login activity
- **Profile Update**: Profile changes confirmation

### 2. Vendor Notifications

#### Order Management
- **New Order Received**: When new order is placed
- **Order Status Update**: When customer updates order status
- **High Value Order Alert**: Orders above threshold amount
- **Order Cancellation**: When order is cancelled

#### Inventory Management
- **Low Stock Alert**: When product inventory is low
- **Out of Stock Alert**: When product is out of stock
- **Inventory Update**: When inventory is updated

#### Financial Notifications
- **Payout Processed**: When payout is processed
- **Payout Failed**: When payout processing fails
- **Commission Update**: When commission rates change
- **Payment Received**: When payment is received for order

#### Return Management
- **Return Request**: When customer requests return
- **Return Action Required**: When vendor action is needed
- **Return Completed**: When return process is completed

#### Account Management
- **Application Status**: Vendor application approval/rejection
- **Account Suspension**: Account suspension notifications
- **Policy Updates**: Platform policy changes

### 3. Agent Notifications

#### Pickup Assignments
- **New Pickup Assignment**: When assigned to pick up order
- **Pickup Reminder**: Reminder for scheduled pickups
- **Pickup Completed**: Confirmation when pickup is completed
- **Pickup Failed**: When pickup cannot be completed

#### Return Assignments
- **Return Pickup Assignment**: When assigned to return pickup
- **Return Pickup Reminder**: Reminder for return pickups
- **Return Pickup Completed**: When return pickup is completed

#### Performance Notifications
- **Performance Review**: Monthly performance summary
- **Target Achievement**: When performance targets are met
- **Area Assignment**: New area assignments

#### System Notifications
- **Schedule Updates**: Changes to operating hours
- **Training Notifications**: New training requirements
- **Equipment Updates**: Equipment maintenance notifications

### 4. Admin Notifications

#### System Alerts
- **High Value Order Alert**: Orders above admin threshold
- **System Error**: Critical system errors
- **Security Breach**: Security-related alerts
- **Performance Issues**: System performance problems

#### User Management
- **New Vendor Application**: New vendor registration
- **User Suspension**: User account suspensions
- **Dispute Reports**: Customer/vendor disputes
- **Fraud Alerts**: Suspicious activity detection

#### Financial Alerts
- **Payment Failures**: Failed payment processing
- **Refund Requests**: High-value refund requests
- **Commission Issues**: Commission calculation problems
- **Payout Failures**: Failed vendor payouts

#### Platform Management
- **Maintenance Notices**: Scheduled maintenance
- **Policy Updates**: Platform policy changes
- **Feature Updates**: New feature releases
- **Compliance Alerts**: Regulatory compliance issues

## Implementation Plan

### Phase 1: Email Service Integration (Free Solutions)

#### Option 1: Resend (Recommended)
- **Free Tier**: 3,000 emails/month
- **Features**: Transactional emails, templates, analytics
- **Integration**: Simple API integration
- **Templates**: Pre-built email templates for all notification types

#### Option 2: Supabase Edge Functions with SMTP
- **Free**: Use existing Supabase edge functions
- **SMTP Provider**: Gmail SMTP (free) or other free SMTP services
- **Custom Implementation**: Full control over email sending

#### Option 3: EmailJS (Client-side)
- **Free Tier**: 200 emails/month
- **Client-side**: Sends emails directly from browser
- **Limitations**: Rate limits and security considerations

### Phase 2: Push Notification Service

#### Browser Push Notifications
- **Service Worker**: Implement service worker for push notifications
- **Web Push API**: Use browser's native push notification API
- **Free**: No external service costs
- **Features**: Real-time notifications, click actions, rich content

#### Implementation Steps:
1. Create service worker for push notifications
2. Implement push notification subscription
3. Create notification templates
4. Integrate with notification service

### Phase 3: SMS Notifications (Optional)

#### Free SMS Services:
- **Twilio Trial**: Free trial with limited credits
- **Vonage**: Free trial available
- **MessageBird**: Free tier with limited messages

#### Use Cases:
- High-value order alerts
- Critical system notifications
- Security alerts
- Payment failure notifications

## Technical Implementation

### 1. Email Service Setup

#### Resend Integration
```typescript
// lib/services/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification({
  to,
  subject,
  template,
  data
}: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: 'Zervia <notifications@zervia.com>',
      to: [to],
      subject,
      react: getEmailTemplate(template, data),
    });

    if (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
```

### 2. Push Notification Setup

#### Service Worker
```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Zervia Notification', options)
  );
});
```

### 3. Notification Dispatcher

#### Multi-Channel Notification Service
```typescript
// lib/services/notification-dispatcher.ts
export async function dispatchNotification({
  userId,
  type,
  title,
  message,
  data,
  channels = ['IN_APP', 'EMAIL', 'PUSH']
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels?: NotificationChannel[];
}) {
  const user = await getUserById(userId);
  const preferences = await getUserNotificationPreferences(userId, type);
  
  const results = [];
  
  // In-app notification (always sent)
  if (channels.includes('IN_APP')) {
    const inAppResult = await createTypedNotification({
      userId,
      title,
      message,
      type,
      orderId: data?.orderId,
      returnId: data?.returnId,
      referenceUrl: data?.referenceUrl
    });
    results.push({ channel: 'IN_APP', success: inAppResult.success });
  }
  
  // Email notification
  if (channels.includes('EMAIL') && preferences.EMAIL?.enabled) {
    const emailResult = await sendEmailNotification({
      to: user.email,
      subject: title,
      template: getEmailTemplateForType(type),
      data
    });
    results.push({ channel: 'EMAIL', success: emailResult.success });
  }
  
  // Push notification
  if (channels.includes('PUSH') && preferences.PUSH?.enabled) {
    const pushResult = await sendPushNotification({
      userId,
      title,
      body: message,
      data
    });
    results.push({ channel: 'PUSH', success: pushResult.success });
  }
  
  // SMS notification (for critical alerts)
  if (channels.includes('SMS') && preferences.SMS?.enabled && isCriticalNotification(type)) {
    const smsResult = await sendSMSNotification({
      to: user.phoneNumber,
      message: `${title}: ${message}`
    });
    results.push({ channel: 'SMS', success: smsResult.success });
  }
  
  return results;
}
```

## Notification Triggers

### 1. Order Lifecycle Triggers
```typescript
// actions/orders.ts
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  // Update order status
  const order = await updateOrder(orderId, { status: newStatus });
  
  // Send notifications based on status
  switch (newStatus) {
    case 'PROCESSING':
      await dispatchNotification({
        userId: order.customerId,
        type: 'ORDER_STATUS_CHANGE',
        title: 'Order Processing',
        message: `Your order #${order.shortId} is now being processed.`,
        data: { orderId: order.id, shortId: order.shortId },
        channels: ['IN_APP', 'EMAIL']
      });
      break;
      
    case 'SHIPPED':
      await dispatchNotification({
        userId: order.customerId,
        type: 'ORDER_SHIPPED',
        title: 'Order Shipped',
        message: `Your order #${order.shortId} has been shipped!`,
        data: { orderId: order.id, shortId: order.shortId },
        channels: ['IN_APP', 'EMAIL', 'PUSH']
      });
      break;
      
    case 'READY_FOR_PICKUP':
      await dispatchNotification({
        userId: order.customerId,
        type: 'PICKUP_READY',
        title: 'Order Ready for Pickup',
        message: `Your order #${order.shortId} is ready for pickup!`,
        data: { orderId: order.id, shortId: order.shortId },
        channels: ['IN_APP', 'EMAIL', 'PUSH', 'SMS']
      });
      break;
  }
}
```

## Deployment Plan

### Phase 1: Core Implementation (Week 1-2)
1. Set up email service (Resend)
2. Implement notification dispatcher
3. Create email templates
4. Add notification triggers to existing actions

### Phase 2: Push Notifications (Week 3)
1. Implement service worker
2. Add push notification subscription
3. Create push notification API
4. Test push notification delivery

### Phase 3: UI Components (Week 4)
1. Build notification center component
2. Create notification preferences page
3. Add real-time updates
4. Implement notification badges

### Phase 4: Testing & Optimization (Week 5)
1. Comprehensive testing
2. Performance optimization
3. Error handling improvements
4. Documentation updates

## Cost Analysis

### Free Tier Services
- **Resend**: 3,000 emails/month (free)
- **Push Notifications**: Browser API (free)
- **SMS**: Twilio trial credits (free initially)

### Scaling Considerations
- Email costs: ~$0.10 per 1,000 emails after free tier
- SMS costs: ~$0.0075 per SMS
- Push notifications: Free (browser API)

### Budget Recommendations
- Start with free tiers
- Monitor usage patterns
- Scale based on actual needs
- Implement cost controls and limits

## Success Metrics

### 1. User Engagement
- Notification open rates
- User preference adoption
- Notification center usage
- Mobile notification opt-ins

### 2. Business Impact
- Reduced support tickets
- Improved order tracking
- Faster issue resolution
- Increased user satisfaction

### 3. Technical Performance
- Notification delivery success rate
- System response times
- Error rates
- User feedback scores

This comprehensive notification system will provide a robust, scalable, and user-friendly notification experience for all user roles while maintaining cost-effectiveness through free tier services and smart implementation strategies. 