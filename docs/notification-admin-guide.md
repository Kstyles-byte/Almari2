# Notification System Admin Guide & Testing Procedures

## Overview

This guide provides comprehensive administrative procedures for managing, monitoring, and testing the Almari notification system. It covers system configuration, bulk operations, monitoring, troubleshooting, and advanced testing scenarios.

## 🔑 Admin Access & Permissions

### Admin Dashboard Access
- **URL**: `/admin`
- **Requirements**: User account with `ADMIN` role
- **Navigation**: Admin menu → Notifications section

### Database Access
- **Supabase Dashboard**: Direct database access for advanced operations
- **Service Role Key**: Required for bypassing RLS in admin operations
- **MCP Tools**: Use Supabase MCP server for database operations

---

## 🏗️ System Configuration

### 1. Notification Type Management

#### Viewing All Notification Types
```sql
-- Check all available notification types
SELECT unnest(enum_range(NULL::NotificationType)) as notification_type;
```

#### Adding New Notification Types
1. Update database enum:
```sql
ALTER TYPE "NotificationType" ADD VALUE 'NEW_NOTIFICATION_TYPE';
```

2. Update TypeScript types in `types/supabase.ts`
3. Add notification templates in notification services
4. Update user preference defaults

#### Disabling Notification Types
```sql
-- Mark notification types as deprecated (don't delete due to foreign keys)
-- Add a metadata table for configuration
CREATE TABLE notification_type_config (
  type NotificationType PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  description TEXT
);
```

---

### 2. Notification Templates

#### Template Management
Location: `lib/notifications/templates/`

**Template Structure:**
```typescript
interface NotificationTemplate {
  title: string;
  message: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  channels: NotificationChannel[];
  variables: string[];
}
```

#### Adding New Templates
1. Create template in appropriate service file
2. Add template variables and validation
3. Test template rendering with sample data
4. Add to template registry

---

### 3. System Thresholds & Settings

#### High-Value Order Threshold
```sql
-- Update in admin settings table or environment variables
UPDATE admin_settings 
SET value = '10000' 
WHERE key = 'high_value_order_threshold';
```

#### Low Stock Alert Threshold
```sql
-- Configure per vendor or globally
UPDATE vendor_settings 
SET low_stock_threshold = 5 
WHERE vendor_id = 'vendor-uuid';
```

#### Payout Settings
```sql
-- Configure minimum payout amounts and schedules
SELECT * FROM "PayoutSettings";
UPDATE "PayoutSettings" 
SET minimum_payout_amount = 5000,
    processing_fee_percentage = 2.5;
```

---

## 📊 Monitoring & Analytics

### 1. Notification Delivery Metrics

#### Daily Notification Stats
```sql
-- Notifications sent today by type
SELECT 
  type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  ROUND(COUNT(*) FILTER (WHERE is_read = true) * 100.0 / COUNT(*), 2) as read_percentage
FROM "Notification"
WHERE created_at >= CURRENT_DATE
GROUP BY type
ORDER BY total_sent DESC;
```

#### User Engagement Metrics
```sql
-- User notification engagement
SELECT 
  u.role,
  COUNT(n.id) as notifications_received,
  COUNT(*) FILTER (WHERE n.is_read = true) as notifications_read,
  AVG(EXTRACT(EPOCH FROM (n.updated_at - n.created_at))/60) as avg_read_time_minutes
FROM "User" u
LEFT JOIN "Notification" n ON u.id = n.user_id
WHERE n.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.role;
```

#### Failed Notifications
```sql
-- Check for notification creation failures
-- (Would need to add error logging table)
SELECT 
  error_type,
  COUNT(*) as failure_count,
  DATE(created_at) as error_date
FROM notification_errors
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY error_type, DATE(created_at)
ORDER BY error_date DESC, failure_count DESC;
```

---

### 2. Real-time Monitoring

#### Supabase Realtime Connections
- **Dashboard**: Supabase → Realtime → Connections
- **Metrics**: Active connections, message volume, error rates
- **Alerts**: Set up alerts for connection drops

#### Push Notification Metrics
```typescript
// Monitor push notification success rates
import { pushNotificationService } from '../lib/services/pushNotificationService';

const monitorPushNotifications = async () => {
  const metrics = {
    totalSent: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    subscriptionCount: 0
  };
  
  // Track metrics in monitoring system
  console.log('Push notification metrics:', metrics);
};
```

---

### 3. Performance Monitoring

#### Database Performance
```sql
-- Slow notification queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%Notification%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### API Response Times
- Monitor `/api/notifications` endpoint performance
- Track notification creation latency
- Set up alerts for response time degradation

---

## 🔧 Bulk Operations

### 1. Mass Notification Sending

#### Send Notifications to All Users of a Role
```typescript
// Example: Send maintenance notice to all users
import { createBatchNotifications } from '../lib/services/notification';

const sendMaintenanceNotice = async () => {
  const users = await supabase
    .from('User')
    .select('id')
    .eq('role', 'CUSTOMER');

  const notifications = users.data?.map(user => ({
    userId: user.id,
    type: 'MAINTENANCE_NOTICE',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight 2-4 AM',
    metadata: {
      referenceUrl: '/maintenance-notice'
    }
  })) || [];

  await createBatchNotifications(notifications);
};
```

#### Bulk Update Notification Preferences
```sql
-- Enable push notifications for all customers by default
INSERT INTO "NotificationPreference" (user_id, type, channel, enabled)
SELECT 
  u.id as user_id,
  'ORDER_STATUS_CHANGE' as type,
  'PUSH' as channel,
  true as enabled
FROM "User" u
WHERE u.role = 'CUSTOMER'
ON CONFLICT (user_id, type, channel) 
DO UPDATE SET enabled = true;
```

---

### 2. Data Cleanup Operations

#### Archive Old Notifications
```sql
-- Archive notifications older than 6 months
WITH archived AS (
  DELETE FROM "Notification"
  WHERE created_at < CURRENT_DATE - INTERVAL '6 months'
  RETURNING *
)
INSERT INTO notification_archive SELECT * FROM archived;
```

#### Clean Up Failed Push Subscriptions
```sql
-- Remove inactive push subscriptions
-- (Would need push subscription table)
DELETE FROM push_subscriptions
WHERE last_used < CURRENT_DATE - INTERVAL '30 days'
AND status = 'INACTIVE';
```

---

## 🧪 Admin Testing Procedures

### Test 1: System-Wide Notification Testing

#### Procedure:
1. **Access Admin Panel**
   - Go to `/admin/notifications/test`
   - Select notification type to test
   - Choose target user roles

2. **Test Matrix**
   ```
   Notification Types × User Roles × Channels
   - ORDER_STATUS_CHANGE × CUSTOMER × (IN_APP, PUSH)
   - NEW_ORDER_VENDOR × VENDOR × (IN_APP, PUSH)
   - NEW_PICKUP_ASSIGNMENT × AGENT × (IN_APP, PUSH)
   - HIGH_VALUE_ORDER_ALERT × ADMIN × (IN_APP, PUSH)
   ```

3. **Verification Steps**
   - Check notification appears in target user accounts
   - Verify notification content accuracy
   - Confirm real-time delivery (< 3 seconds)
   - Test push notification delivery
   - Validate notification preferences are respected

**Expected Results:**
- ✅ 100% delivery to active users
- ✅ Respect user preference settings
- ✅ Correct content and formatting
- ✅ Proper real-time updates

---

### Test 2: High-Volume Load Testing

#### Procedure:
1. **Generate Test Load**
   ```typescript
   // Simulate high notification volume
   const generateTestLoad = async (notificationCount: number) => {
     const testNotifications = Array.from({ length: notificationCount }, (_, i) => ({
       userId: testUserIds[i % testUserIds.length],
       type: 'ORDER_STATUS_CHANGE',
       title: `Test Notification ${i}`,
       message: `Load test notification number ${i}`,
       metadata: { testId: `load-test-${Date.now()}-${i}` }
     }));

     await createBatchNotifications(testNotifications);
   };

   // Test with increasing loads
   await generateTestLoad(100);   // Light load
   await generateTestLoad(1000);  // Medium load
   await generateTestLoad(5000);  // Heavy load
   ```

2. **Monitor Performance**
   - Database query performance
   - API response times
   - Real-time delivery latency
   - Memory usage
   - CPU utilization

3. **Verify Delivery**
   - Check all notifications were created
   - Verify delivery to target users
   - Confirm no duplicate notifications
   - Test system recovery after load

**Expected Results:**
- ✅ Handle 5000+ notifications without degradation
- ✅ Maintain <3 second delivery time
- ✅ No data loss or corruption
- ✅ Graceful degradation under extreme load

---

### Test 3: Failure Scenario Testing

#### Procedure:
1. **Database Connection Failure**
   - Temporarily disable database connection
   - Attempt to create notifications
   - Verify error handling and retry logic

2. **Supabase Realtime Disconnection**
   - Disconnect from Supabase realtime
   - Send notifications during disconnection
   - Verify reconnection and message delivery

3. **Push Notification Service Failure**
   - Mock push notification API failures
   - Verify fallback to in-app notifications
   - Test error logging and monitoring

4. **Invalid User Data**
   - Send notifications to deleted users
   - Use invalid notification types
   - Test with malformed template data

**Expected Results:**
- ✅ Graceful error handling
- ✅ Proper error logging
- ✅ Automatic retry mechanisms
- ✅ User-friendly error messages
- ✅ System stability maintained

---

### Test 4: Cross-Browser & Device Testing

#### Procedure:
1. **Browser Compatibility Matrix**
   - Chrome (latest, -1, -2 versions)
   - Firefox (latest, -1, -2 versions)
   - Safari (latest, -1 versions)
   - Edge (latest, -1 versions)

2. **Device Testing**
   - Desktop (Windows, macOS, Linux)
   - Mobile (iOS Safari, Android Chrome)
   - Tablet (iPad, Android tablets)

3. **Feature Testing Per Platform**
   - In-app notifications
   - Push notifications
   - Real-time updates
   - Notification preferences
   - Offline behavior

**Testing Checklist:**
- [ ] Push notification permissions
- [ ] Service worker registration
- [ ] WebSocket connections
- [ ] Local storage functionality
- [ ] Responsive design
- [ ] Touch interactions (mobile)

---

### Test 5: Security & Permission Testing

#### Procedure:
1. **Role-Based Access Control**
   ```typescript
   // Test unauthorized access
   const testUnauthorizedAccess = async () => {
     // Customer trying to access vendor notifications
     const customerSession = await createTestSession('CUSTOMER');
     const vendorNotifications = await getNotifications(vendorUserId, customerSession);
     // Should return empty/error
   };
   ```

2. **API Security Testing**
   - Test API endpoints without authentication
   - Attempt to access other users' notifications
   - Test API key validation
   - Verify rate limiting

3. **Data Privacy**
   - Ensure notifications don't leak sensitive data
   - Test notification content filtering
   - Verify user data anonymization

**Expected Results:**
- ✅ Proper access control enforcement
- ✅ No data leakage between users
- ✅ Secure API endpoints
- ✅ Rate limiting functional

---

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Issue 1: Notifications Not Delivering
**Symptoms:**
- Users report missing notifications
- Low delivery rates in analytics

**Diagnostic Steps:**
1. Check notification creation logs
2. Verify user preferences
3. Test real-time connection
4. Check database constraints

**Solutions:**
```sql
-- Check for failed notification creation
SELECT 
  type,
  COUNT(*) as attempts,
  COUNT(*) FILTER (WHERE created_at IS NOT NULL) as successful
FROM notification_attempts
WHERE created_at >= CURRENT_DATE
GROUP BY type;

-- Reset user preferences if corrupted
DELETE FROM "NotificationPreference" 
WHERE user_id = 'problematic-user-id';
```

---

#### Issue 2: Performance Degradation
**Symptoms:**
- Slow notification delivery
- High database load
- Timeouts

**Diagnostic Steps:**
1. Check database performance metrics
2. Analyze slow queries
3. Monitor real-time connection count
4. Review server resources

**Solutions:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_notification_user_created 
ON "Notification"(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_notification_type_created 
ON "Notification"(type, created_at DESC);

-- Optimize notification queries
EXPLAIN ANALYZE 
SELECT * FROM "Notification" 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

#### Issue 3: Push Notification Failures
**Symptoms:**
- Push notifications not appearing
- High failure rates

**Diagnostic Steps:**
1. Check VAPID key configuration
2. Verify service worker registration
3. Test browser permissions
4. Check push service status

**Solutions:**
```typescript
// Reset push notification registration
const resetPushNotifications = async (userId: string) => {
  await pushNotificationService.unsubscribe(userId);
  await pushNotificationService.subscribe(userId);
};

// Validate VAPID keys
const validateVAPIDKeys = () => {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key not configured');
  }
  // Additional validation logic
};
```

---

#### Issue 4: Real-time Connection Issues
**Symptoms:**
- Delayed notifications
- Connection drops
- Inconsistent updates

**Diagnostic Steps:**
1. Monitor Supabase realtime dashboard
2. Check WebSocket connection stability
3. Test on different networks
4. Review client-side error logs

**Solutions:**
```typescript
// Implement connection retry logic
const setupRealtimeWithRetry = () => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Notification'
    }, handleNewNotification)
    .subscribe((status) => {
      if (status === 'SUBSCRIPTION_ERROR') {
        setTimeout(setupRealtimeWithRetry, 5000);
      }
    });
};
```

---

## 📈 Performance Optimization

### Database Optimization

#### Index Strategy
```sql
-- Core notification indexes
CREATE INDEX CONCURRENTLY idx_notification_user_unread 
ON "Notification"(user_id, is_read, created_at DESC);

CREATE INDEX CONCURRENTLY idx_notification_type_created 
ON "Notification"(type, created_at DESC);

-- Preference lookup optimization
CREATE INDEX CONCURRENTLY idx_notification_preference_lookup 
ON "NotificationPreference"(user_id, type, channel);
```

#### Query Optimization
```sql
-- Optimized notification query
SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at
FROM "Notification" n
WHERE n.user_id = $1
  AND ($2::boolean IS NULL OR n.is_read = $2)
  AND ($3::text IS NULL OR n.type = $3::NotificationType)
ORDER BY n.created_at DESC
LIMIT $4 OFFSET $5;
```

### Application Optimization

#### Caching Strategy
```typescript
// Cache notification preferences
const getUserPreferencesCache = new Map<string, NotificationPreference[]>();

const getCachedPreferences = async (userId: string) => {
  if (!getUserPreferencesCache.has(userId)) {
    const preferences = await fetchUserPreferences(userId);
    getUserPreferencesCache.set(userId, preferences);
  }
  return getUserPreferencesCache.get(userId);
};

// Cache notification templates
const templateCache = new Map<string, NotificationTemplate>();
```

#### Batch Processing
```typescript
// Batch notification creation
const createNotificationsBatch = async (notifications: NotificationInput[]) => {
  const batches = chunkArray(notifications, 100);
  
  for (const batch of batches) {
    await supabase
      .from('Notification')
      .insert(batch);
    
    // Small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

---

## 🚨 Emergency Procedures

### Critical System Failure

#### Immediate Response
1. **Assess Impact**
   - Check system health dashboard
   - Verify core functionality
   - Identify affected users

2. **Emergency Notification**
   ```typescript
   // Send emergency notification to all admins
   const sendEmergencyAlert = async (message: string) => {
     const admins = await getAdminUsers();
     for (const admin of admins) {
       await sendDirectNotification(admin.id, {
         type: 'SECURITY_ALERT',
         title: 'EMERGENCY: System Alert',
         message: message,
         priority: 'CRITICAL'
       });
     }
   };
   ```

3. **Fallback Communication**
   - Use external communication channels
   - Update status page
   - Notify customer support team

#### Recovery Procedures
1. **Database Recovery**
   ```sql
   -- Check for data corruption
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
   FROM pg_stat_user_tables 
   WHERE tablename IN ('Notification', 'NotificationPreference');
   
   -- Restore from backup if needed
   -- pg_restore backup_file.sql
   ```

2. **Service Recovery**
   ```bash
   # Restart notification services
   pm2 restart notification-worker
   
   # Clear caches
   redis-cli FLUSHALL
   
   # Verify service health
   curl -f http://localhost:3000/api/health/notifications
   ```

---

### Data Breach Response

#### Immediate Actions
1. **Isolate System**
   - Disable external API access
   - Revoke compromised API keys
   - Enable emergency mode

2. **Assess Exposure**
   ```sql
   -- Check for unauthorized access
   SELECT 
     user_id,
     COUNT(*) as notification_count,
     MAX(created_at) as last_notification
   FROM "Notification"
   WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
   GROUP BY user_id
   HAVING COUNT(*) > 1000;  -- Unusual activity
   ```

3. **Notification to Users**
   ```typescript
   const sendSecurityBreach = async () => {
     await sendToAllUsers({
       type: 'SECURITY_ALERT',
       title: 'Security Notice',
       message: 'We are investigating a potential security issue...',
       priority: 'CRITICAL'
     });
   };
   ```

---

## 📋 Maintenance Checklist

### Daily Maintenance
- [ ] Check notification delivery rates
- [ ] Monitor error logs
- [ ] Verify real-time connection health
- [ ] Review performance metrics

### Weekly Maintenance
- [ ] Analyze notification engagement metrics
- [ ] Update notification templates if needed
- [ ] Check database performance
- [ ] Review user feedback

### Monthly Maintenance
- [ ] Archive old notifications
- [ ] Update notification preferences defaults
- [ ] Performance optimization review
- [ ] Security audit

### Quarterly Maintenance
- [ ] Comprehensive system testing
- [ ] Disaster recovery testing
- [ ] Update documentation
- [ ] Review notification effectiveness

---

## 📞 Support Escalation

### Level 1: Basic Issues
- Notification preferences not saving
- Missing individual notifications
- UI display issues

**Resolution:** Customer support team with basic troubleshooting

### Level 2: Technical Issues
- Push notification setup problems
- Real-time connection issues
- Performance degradation

**Resolution:** Technical support team with system access

### Level 3: Critical Issues
- System-wide notification failures
- Security breaches
- Data corruption

**Resolution:** Development team and system administrators

### Emergency Contacts
- **On-call Developer**: [Emergency contact info]
- **System Administrator**: [Emergency contact info]
- **Database Administrator**: [Emergency contact info]

---

## 📚 Reference Materials

### Code Locations
- **Services**: `lib/notifications/`
- **API Routes**: `app/api/notifications/`
- **Database Schema**: Supabase dashboard
- **Admin UI**: `app/admin/notifications/`

### External Dependencies
- **Supabase**: Real-time and database
- **Web Push API**: Browser notifications
- **Service Workers**: Background notifications

### Documentation Links
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

Remember: Always test changes in a staging environment before applying to production!
