# Cron Jobs Setup for Notification System

This document explains how to set up and configure automated cron jobs for the notification system in the Zervia e-commerce platform.

## Overview

The notification system includes automated cron jobs for:

1. **Inventory Monitoring** (`/api/cron/inventory-check`)
   - Low stock alerts
   - Out of stock alerts
   - Popular product alerts
   - Inventory update notifications

2. **Product & Wishlist Notifications** (`/api/cron/product-notifications`)
   - Weekly wishlist reminders
   - Back in stock alerts
   - Price drop notifications
   - Product update monitoring

3. **Master Coordinator** (`/api/cron/notifications`)
   - Runs all notification cron jobs
   - Supports parallel or sequential execution
   - Provides comprehensive reporting

## Environment Configuration

Add these environment variables to your `.env.local` file:

```env
# Required for cron job authentication
CRON_SECRET=your-secure-cron-secret-key
CRON_AUTH_TOKEN=your-secure-auth-token

# Required for internal API calls
NEXTAUTH_URL=https://your-domain.com
```

## Cron Job Endpoints

### 1. Inventory Check (`/api/cron/inventory-check`)

**Purpose**: Monitor inventory levels and send alerts to vendors

**Schedule**: Every hour during business hours
```bash
# Every hour from 8 AM to 8 PM
0 8-20 * * * curl -X POST "https://your-domain.com/api/cron/inventory-check" \
  -H "x-cron-secret: your-cron-secret"
```

**Features**:
- Low stock alerts (when inventory ≤ 10)
- Out of stock alerts (when inventory = 0)
- Popular product alerts (≥ 20 orders in 24h)
- Restock notifications

### 2. Product Notifications (`/api/cron/product-notifications`)

**Purpose**: Handle wishlist and product update notifications

**Schedule**: 
- Wishlist reminders: Weekly (Sundays at 10 AM)
- Product updates: Every 30 minutes

```bash
# Weekly wishlist reminders (Sundays at 10 AM)
0 10 * * 0 curl -X POST "https://your-domain.com/api/cron/product-notifications" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-cron-secret" \
  -d '{"type": "wishlist-reminders"}'

# Product update checks (every 30 minutes)
*/30 * * * * curl -X POST "https://your-domain.com/api/cron/product-notifications" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-cron-secret" \
  -d '{"type": "product-updates"}'
```

**Features**:
- Weekly wishlist reminders to customers
- Back in stock notifications for wishlisted products
- Price drop alerts (≥10% or ≥₦1000 drop)
- Product update monitoring

### 3. Master Coordinator (`/api/cron/notifications`)

**Purpose**: Run all notification jobs together

**Schedule**: Every 2 hours
```bash
# Every 2 hours
0 */2 * * * curl -X POST "https://your-domain.com/api/cron/notifications" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-cron-secret" \
  -d '{"jobs": ["inventory-check", "product-notifications"], "parallel": true}'
```

## Deployment Options

### 1. Vercel Cron Jobs

If using Vercel, create a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/inventory-check",
      "schedule": "0 */1 * * *"
    },
    {
      "path": "/api/cron/product-notifications",
      "schedule": "0 10 * * 0"
    }
  ]
}
```

### 2. External Cron Service (EasyCron, cron-job.org)

**URL**: `https://your-domain.com/api/cron/notifications`
**Method**: POST
**Headers**:
```
Content-Type: application/json
x-cron-secret: your-cron-secret
```
**Body**:
```json
{
  "jobs": ["inventory-check", "product-notifications"],
  "parallel": true
}
```

### 3. GitHub Actions

Create `.github/workflows/cron-notifications.yml`:

```yaml
name: Notification Cron Jobs

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours

jobs:
  run-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Run Notification Cron
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/notifications" \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -d '{"jobs": ["inventory-check", "product-notifications"], "parallel": true}'
```

## Health Checks

Each endpoint supports GET requests for health checks:

```bash
# Check inventory cron health
curl "https://your-domain.com/api/cron/inventory-check" \
  -H "x-cron-secret: your-cron-secret"

# Check product notifications health
curl "https://your-domain.com/api/cron/product-notifications" \
  -H "x-cron-secret: your-cron-secret"

# Check master coordinator health
curl "https://your-domain.com/api/cron/notifications" \
  -H "x-cron-secret: your-cron-secret"
```

## Configuration Options

### Inventory Thresholds

Modify thresholds in `lib/notifications/inventoryNotifications.ts`:

```typescript
const INVENTORY_THRESHOLDS = {
  LOW_STOCK: 10,                    // Alert when stock ≤ 10
  OUT_OF_STOCK: 0,                  // Alert when stock = 0
  POPULAR_PRODUCT_ORDER_COUNT: 20,  // Alert when ≥ 20 orders in 24h
  RESTOCK_THRESHOLD: 5              // Alert when restocked above 5
};
```

### Price Drop Settings

Modify settings in `lib/notifications/productNotifications.ts`:

```typescript
const PRICE_DROP_CONFIG = {
  MINIMUM_PERCENTAGE_DROP: 10,  // Minimum 10% drop
  MINIMUM_AMOUNT_DROP: 1000,    // Minimum ₦1000 drop
};
```

## Monitoring and Debugging

### Response Format

All cron endpoints return structured responses:

```json
{
  "success": true,
  "message": "Cron job completed successfully",
  "totalNotificationsSent": 25,
  "jobType": "all",
  "results": {
    "inventory-check": {
      "success": true,
      "totalAlerts": 15
    },
    "product-notifications": {
      "success": true,
      "remindersSent": 10
    }
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Error Handling

- **401 Unauthorized**: Invalid or missing cron secret
- **500 Internal Server Error**: Cron job execution failed
- **207 Multi-Status**: Some jobs succeeded, some failed

### Logging

Monitor cron job execution in your application logs:

```bash
# Search for cron job logs
grep "Cron]" your-app.log

# Monitor specific job types
grep "Inventory Cron]" your-app.log
grep "Product Notifications Cron]" your-app.log
```

## Security Considerations

1. **Authentication**: Always use strong, unique values for `CRON_SECRET` and `CRON_AUTH_TOKEN`
2. **Rate Limiting**: Consider implementing rate limiting for cron endpoints
3. **IP Whitelisting**: Restrict cron endpoints to trusted IPs if possible
4. **Monitoring**: Set up alerts for failed cron jobs
5. **Backup**: Ensure cron job configurations are backed up

## Troubleshooting

### Common Issues

1. **Notifications not sending**:
   - Check Supabase connection and RLS policies
   - Verify notification templates exist
   - Check user preferences in NotificationPreference table

2. **Cron jobs timing out**:
   - Reduce batch sizes
   - Enable parallel execution
   - Optimize database queries

3. **Authentication failures**:
   - Verify CRON_SECRET and CRON_AUTH_TOKEN
   - Check environment variable loading
   - Ensure headers are correctly set

### Testing

Test cron jobs locally:

```bash
# Test inventory check
curl -X POST "http://localhost:3000/api/cron/inventory-check" \
  -H "x-cron-secret: dev-secret"

# Test with specific job type
curl -X POST "http://localhost:3000/api/cron/product-notifications" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: dev-secret" \
  -d '{"type": "wishlist-reminders"}'
```
