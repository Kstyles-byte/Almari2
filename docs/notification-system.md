# Notification System Architecture

This document outlines the architecture of the notification system in the Zervia e-commerce platform.

## Overview

The notification system allows users to receive real-time updates about their account activity, orders, returns, and other important events. Notifications are stored in the database and can be accessed via the UI or through API endpoints.

## Components

The notification system consists of the following components:

### 1. Database Schema

Notifications are stored in the `Notification` table in Supabase with the following structure:

```
- id (uuid) - Primary key
- user_id (uuid) - Foreign key to the user receiving the notification
- title (text) - Short notification title
- message (text) - Detailed notification message
- type (enum) - Type of notification (ORDER_STATUS_CHANGE, PICKUP_READY, etc.)
- order_id (uuid, nullable) - Optional reference to an order
- return_id (uuid, nullable) - Optional reference to a return
- reference_url (text, nullable) - Optional URL to navigate to when clicking the notification
- is_read (boolean) - Whether the notification has been read
- created_at (timestamp) - When the notification was created
```

### 2. Server-Side Components

- **Notification Service** (`lib/services/notification.ts`): Core service for creating, retrieving, and managing notifications.
- **Notification Actions** (`actions/notifications.ts`): Server actions that handle authentication and provide client-facing methods for interacting with notifications.
- **API Routes**:
  - `app/api/notifications/route.ts`: Handles GET (list) and POST (create) operations
  - `app/api/notifications/[id]/route.ts`: Handles GET, PATCH, and DELETE operations for individual notifications

### 3. Client-Side Components

- **NotificationCenter** (`components/notifications/notification-center.tsx`): Dropdown component showing recent notifications, accessible from any page.
- **NotificationsList** (`components/notifications/notifications-list.tsx`): Full-page component for viewing and managing all notifications.
- **NotificationsListSkeleton** (`components/notifications/notifications-list-skeleton.tsx`): Loading state for the notifications list.
- **Notification Preferences** (`app/notifications/preferences/page.tsx`): Page for managing notification settings.

## Authentication Flow

1. When a user attempts to access notifications, the system first checks if they are authenticated using Supabase authentication.
2. If authenticated, their user ID is used to fetch their notifications.
3. If not authenticated, an error message is returned asking them to sign in.

## Creating Notifications

Notifications can be created in several ways:

1. **Server-Side Events**: Using the notification service directly in server code.
2. **API Endpoints**: External systems can create notifications via authenticated API calls.
3. **Database Triggers**: Automatic notifications based on database events (e.g., order status changes).

## Notification Types

The system supports the following notification types:

- `ORDER_STATUS_CHANGE`: Updates about order status changes
- `PICKUP_READY`: When an order is ready for pickup
- `ORDER_PICKED_UP`: When an order has been picked up
- `RETURN_REQUESTED`: When a return has been requested
- `RETURN_APPROVED`: When a return request is approved
- `RETURN_REJECTED`: When a return request is rejected
- `REFUND_PROCESSED`: When a refund has been processed

## Example Usage

### Creating a Notification (Server-Side)

```typescript
import { createNotification } from "../lib/services/notification";

// Create a notification for a user
await createNotification({
  userId: "user-uuid",
  title: "Order Confirmed",
  message: "Your order #12345 has been confirmed.",
  type: "ORDER_STATUS_CHANGE",
  orderId: "order-uuid",
  referenceUrl: "/orders/order-uuid"
});
```

### API Webhook Example

```bash
curl -X POST https://example.com/api/notifications \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "ORDER_STATUS_CHANGE",
    "orderId": "order-uuid",
    "status": "PROCESSING"
  }'
```

## Best Practices

1. **Authentication**: Always check user authentication before accessing or modifying notifications.
2. **Concise Messages**: Keep notification titles short and messages clear and concise.
3. **Reference Links**: Include a `referenceUrl` whenever possible to allow users to navigate to relevant content.
4. **Rate Limiting**: Avoid sending too many notifications to users in a short period.
5. **Error Handling**: Always handle notification errors gracefully to prevent disrupting the user experience.

## Troubleshooting

- **Authentication Issues**: If users can't access notifications despite being logged in, check the authentication middleware and Supabase session handling.
- **Missing Notifications**: Check the database directly to verify if notifications are being created properly.
- **Performance Issues**: If notification loading is slow, consider implementing pagination or optimizing database queries.

## Future Improvements

1. **Push Notifications**: Integrate with a push notification service for real-time alerts.
2. **Notification Grouping**: Group similar notifications to reduce clutter.
3. **Email Digests**: Send daily/weekly email digests of important notifications.
4. **Mobile App Integration**: Extend the notification system to mobile apps. 