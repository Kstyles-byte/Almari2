# Notification System API Documentation

## Overview

The Almari notification system provides real-time notifications across all user roles (Customers, Vendors, Agents, and Admins) through in-app and push notification channels. This documentation covers the API endpoints, data models, and integration patterns.

## Architecture

### Core Components
- **Database**: Supabase with `Notification` and `NotificationPreference` tables
- **Real-time**: Supabase realtime subscriptions for live updates
- **Push Notifications**: Browser-based push notifications with service worker
- **API Layer**: RESTful endpoints for CRUD operations
- **Services**: Modular notification services for each business domain

### Notification Types

```typescript
enum NotificationType {
  // Customer Notifications
  ORDER_STATUS_CHANGE = "ORDER_STATUS_CHANGE",
  PICKUP_READY = "PICKUP_READY",
  ORDER_PICKED_UP = "ORDER_PICKED_UP",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  ORDER_SHIPPED = "ORDER_SHIPPED",
  ORDER_DELIVERED = "ORDER_DELIVERED",
  REFUND_PROCESSED = "REFUND_PROCESSED",
  COUPON_APPLIED = "COUPON_APPLIED",
  COUPON_FAILED = "COUPON_FAILED",
  PRODUCT_BACK_IN_STOCK = "PRODUCT_BACK_IN_STOCK",
  PRODUCT_PRICE_DROP = "PRODUCT_PRICE_DROP",
  WISHLIST_REMINDER = "WISHLIST_REMINDER",
  REVIEW_RESPONSE = "REVIEW_RESPONSE",

  // Vendor Notifications
  NEW_ORDER_VENDOR = "NEW_ORDER_VENDOR",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYOUT_PROCESSED = "PAYOUT_PROCESSED",
  PAYOUT_ON_HOLD = "PAYOUT_ON_HOLD",
  PAYOUT_HOLD_RELEASED = "PAYOUT_HOLD_RELEASED",
  MINIMUM_PAYOUT_REACHED = "MINIMUM_PAYOUT_REACHED",
  COMMISSION_RATE_CHANGED = "COMMISSION_RATE_CHANGED",
  LOW_STOCK_ALERT = "LOW_STOCK_ALERT",
  POPULAR_PRODUCT_ALERT = "POPULAR_PRODUCT_ALERT",
  NEW_PRODUCT_REVIEW = "NEW_PRODUCT_REVIEW",
  REVIEW_MILESTONE = "REVIEW_MILESTONE",
  COUPON_CREATED = "COUPON_CREATED",
  COUPON_EXPIRED = "COUPON_EXPIRED",
  COUPON_USAGE_THRESHOLD = "COUPON_USAGE_THRESHOLD",
  RETURN_VENDOR_ACTION_REQUIRED = "RETURN_VENDOR_ACTION_REQUIRED",
  RETURN_VENDOR_COMPLETED = "RETURN_VENDOR_COMPLETED",

  // Agent Notifications
  NEW_PICKUP_ASSIGNMENT = "NEW_PICKUP_ASSIGNMENT",
  RETURN_PICKUP_ASSIGNMENT = "RETURN_PICKUP_ASSIGNMENT",
  AGENT_LOCATION_NAME_UPDATE = "AGENT_LOCATION_NAME_UPDATE",

  // Admin Notifications
  NEW_VENDOR_APPLICATION = "NEW_VENDOR_APPLICATION",
  HIGH_VALUE_ORDER_ALERT = "HIGH_VALUE_ORDER_ALERT",

  // System Notifications
  ACCOUNT_VERIFICATION = "ACCOUNT_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  SECURITY_ALERT = "SECURITY_ALERT",
  MAINTENANCE_NOTICE = "MAINTENANCE_NOTICE"
}
```

### Notification Channels

```typescript
enum NotificationChannel {
  IN_APP = "IN_APP",     // Real-time in-app notifications
  PUSH = "PUSH"          // Browser push notifications
}
```

## API Endpoints

### Base URL
All notification endpoints are prefixed with `/api/notifications`

### Authentication
- Most endpoints require user authentication via Supabase session
- System endpoints require API key in `x-api-key` header

---

## 1. Get User Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Retrieve paginated notifications for the authenticated user with filtering options.

**Authentication:** Required (User session)

**Query Parameters:**
- `page` (integer, default: 1) - Page number for pagination
- `limit` (integer, default: 10, max: 100) - Number of notifications per page
- `unreadOnly` (boolean, default: false) - Filter to show only unread notifications
- `type` (string, optional) - Filter by notification type
- `orderBy` (string, default: "created_at") - Sort field
- `order` (string, default: "desc") - Sort order (asc/desc)

**Special Actions:**
- `action=count` - Get unread notification count only
- `action=mark-all-read` - Mark all notifications as read

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Order Confirmation",
      "message": "Your order #ABC123 has been confirmed",
      "type": "ORDER_STATUS_CHANGE",
      "reference_url": "/customer/orders/uuid",
      "order_id": "uuid",
      "return_id": null,
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasMore": true
  },
  "unreadCount": 5
}
```

**Response (Count Action):**
```json
{
  "count": 5,
  "userId": "uuid"
}
```

---

## 2. Create Notification (System)

**Endpoint:** `POST /api/notifications`

**Description:** Create notifications (for system/internal use).

**Authentication:** Required (API Key)

**Headers:**
```
x-api-key: your-api-key
Content-Type: application/json
```

**Request Body (Single Notification):**
```json
{
  "type": "ORDER_STATUS_CHANGE",
  "userId": "uuid",
  "templateData": {
    "customerName": "John Doe",
    "orderId": "ABC123",
    "status": "SHIPPED"
  },
  "metadata": {
    "orderId": "uuid",
    "referenceUrl": "/customer/orders/uuid"
  }
}
```

**Request Body (Batch Notifications):**
```json
{
  "batch": true,
  "notifications": [
    {
      "type": "NEW_ORDER_VENDOR",
      "userId": "vendor-uuid",
      "title": "New Order Received",
      "message": "You have a new order #ABC123",
      "metadata": {
        "orderId": "uuid",
        "referenceUrl": "/vendor/orders/uuid"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Batch):**
```json
{
  "success": true,
  "created": 5,
  "failed": 0
}
```

---

## 3. Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/[id]`

**Description:** Mark a specific notification as read.

**Authentication:** Required (API Key)

**Request Body:**
```json
{
  "operation": "mark_as_read"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 4. Mark Notification as Read (User)

**Endpoint:** `POST /api/notifications/[id]/read`

**Description:** Mark a specific notification as read (user-facing endpoint).

**Authentication:** Required (User session)

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2024-01-15T10:35:00Z"
  }
}
```

---

## 5. Mark All Notifications as Read

**Endpoint:** `POST /api/notifications/mark-all-read`

**Description:** Mark all notifications as read for the authenticated user.

**Authentication:** Required (User session)

**Response:**
```json
{
  "success": true,
  "updated": 15
}
```

---

## 6. Bulk Operations

**Endpoint:** `PUT /api/notifications`

**Description:** Perform bulk operations on notifications.

**Authentication:** Required (User session)

**Request Body (Mark All Read):**
```json
{
  "action": "mark-all-read"
}
```

**Request Body (Mark Selected Read):**
```json
{
  "action": "mark-selected-read",
  "notificationIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3
}
```

---

## 7. Delete Notification

**Endpoint:** `DELETE /api/notifications/[id]`

**Description:** Delete a specific notification.

**Authentication:** Required (API Key)

**Response:**
```json
{
  "success": true
}
```

---

## Notification Preferences API

### Get User Preferences

**Endpoint:** `GET /api/notification-preferences`

**Authentication:** Required (User session)

**Response:**
```json
{
  "preferences": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "ORDER_STATUS_CHANGE",
      "channel": "IN_APP",
      "enabled": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Update User Preferences

**Endpoint:** `PUT /api/notification-preferences`

**Authentication:** Required (User session)

**Request Body:**
```json
{
  "preferences": [
    {
      "type": "ORDER_STATUS_CHANGE",
      "channel": "IN_APP",
      "enabled": true
    },
    {
      "type": "ORDER_STATUS_CHANGE", 
      "channel": "PUSH",
      "enabled": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 2
}
```

---

## Real-time Integration

### Supabase Realtime Subscription

```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(url, key)

// Subscribe to notifications for current user
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'Notification',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
      // Update UI with new notification
    }
  )
  .subscribe()
```

### Push Notification Registration

```typescript
import { pushNotificationService } from './lib/services/pushNotificationService'

// Request permission and register
const subscription = await pushNotificationService.subscribe(userId)

// Test notification
await pushNotificationService.testNotification()
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid request payload",
  "details": "Missing required field: type"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "Invalid API key or session"
}
```

**404 Not Found:**
```json
{
  "error": "Notification not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "An unexpected error occurred",
  "details": "Database connection failed"
}
```

---

## Rate Limiting

- **User Endpoints:** 100 requests per minute per user
- **System Endpoints:** 1000 requests per minute per API key
- **Bulk Operations:** 10 requests per minute per user

---

## Usage Examples

### Create Order Notification

```typescript
import { handleOrderLifecycleNotification } from './lib/notifications/orderNotifications'

// Send order confirmation
await handleOrderLifecycleNotification(
  orderId,
  'order_confirmed'
)

// Send status change notification
await handleOrderLifecycleNotification(
  orderId,
  'status_changed',
  { newStatus: 'SHIPPED' }
)
```

### Create Refund Notification

```typescript
import { handleRefundNotification } from './lib/notifications/refundNotifications'

// Send refund request confirmation
await handleRefundNotification(
  refundRequestId,
  'request_submitted'
)

// Send approval notification
await handleRefundNotification(
  refundRequestId,
  'approved'
)
```

### Create Agent Notification

```typescript
import { handleAgentNotification } from './lib/notifications/agentNotifications'

// Assign pickup to agent
await handleAgentNotification(
  'pickup_assigned',
  {
    orderId: 'order-uuid',
    agentId: 'agent-uuid'
  }
)
```

---

## Security Considerations

1. **Authentication**: All user endpoints require valid Supabase session
2. **Authorization**: Users can only access their own notifications
3. **API Keys**: System endpoints require secure API key
4. **RLS**: Database-level Row Level Security enforced
5. **Input Validation**: All inputs validated and sanitized
6. **Rate Limiting**: Prevents abuse and ensures fair usage

---

## Database Schema

### Notification Table

```sql
CREATE TABLE "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type "NotificationType" NOT NULL,
  reference_url TEXT,
  order_id UUID REFERENCES "Order"(id),
  return_id UUID REFERENCES "Return"(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

### NotificationPreference Table

```sql
CREATE TABLE "NotificationPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  type "NotificationType" NOT NULL,
  channel "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Performance Considerations

1. **Pagination**: Always paginate notification lists
2. **Indexing**: Database indexes on user_id, created_at, is_read
3. **Real-time**: Efficient Supabase realtime subscriptions
4. **Caching**: Client-side caching for notification preferences
5. **Cleanup**: Regular cleanup of old notifications (>6 months)

---

## Monitoring and Analytics

### Key Metrics
- Notification delivery rate
- Read/unread ratios by type
- User engagement with notifications
- Push notification subscription rates
- API response times and error rates

### Logging
- All notification creations logged
- Failed deliveries tracked
- User preference changes recorded
- Performance metrics captured

---

## Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Notification API
NOTIFICATIONS_API_KEY=your-secure-api-key

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@domain.com
```
