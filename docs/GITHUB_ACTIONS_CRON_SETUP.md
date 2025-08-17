# GitHub Actions Cron Jobs Setup

This document explains how to set up and configure the GitHub Actions workflow that replaces Vercel's cron jobs for handling automated notifications.

## Overview

We've migrated from Vercel cron jobs (limited to 2 jobs, once daily on hobby plan) to GitHub Actions which provides:
- ✅ Unlimited frequency (can run every minute)
- ✅ Multiple concurrent jobs 
- ✅ 25+ executions per day easily
- ✅ Free for up to 2,000 minutes/month on private repos (unlimited on public)
- ✅ Better monitoring and logging

## Current Job Schedule

| Job | Frequency | Purpose |
|-----|-----------|---------|
| **Inventory Check** | Every hour 8 AM - 8 PM UTC | Monitor stock levels, send low stock alerts |
| **Master Notifications** | Every 2 hours | Coordinate multiple notification jobs |
| **Product Notifications** | Weekly Sundays 10 AM UTC | Wishlist reminders, back-in-stock alerts |
| **Coupon Check** | Daily 9 AM UTC | Monitor coupon expiry and usage thresholds |
| **Review Notifications** | Daily 11 AM UTC | Send review reminder notifications |
| **Health Check** | Twice daily (6 AM, 6 PM UTC) | Verify all endpoints are working |

## Required GitHub Secrets

You need to set up these secrets in your GitHub repository:

### How to Add Secrets:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following:

### Required Secrets:

```
VERCEL_URL
Value: https://your-app-name.vercel.app
Description: Your deployed Vercel app URL
```

```
CRON_SECRET  
Value: your-cron-secret-from-env
Description: The secret token for authenticating cron requests
```

## Manual Testing

You can manually trigger any job for testing:

1. Go to **Actions** tab in your GitHub repository
2. Click **Notification Cron Jobs** workflow
3. Click **Run workflow**
4. Select which job to run from the dropdown
5. Click **Run workflow**

## Monitoring

- **Success/Failure**: Check the Actions tab for workflow run status
- **Logs**: Click on any workflow run to see detailed logs
- **Notifications**: GitHub will email you if workflows fail (configurable)

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check that `CRON_SECRET` matches your environment variable
2. **Workflow not running**: Verify cron syntax and timezone (GitHub uses UTC)
3. **Endpoint timeouts**: Increase timeout if your notification jobs take longer

### Testing Locally:

You can test individual endpoints locally:
```bash
curl -X POST "http://localhost:3000/api/cron/inventory-check" \
  -H "x-cron-secret: your-local-secret"
```

## Migration Benefits

- **Cost**: Free (was hitting Vercel limits)
- **Frequency**: Can run 25+ times per day (was limited to 2 jobs once daily)
- **Reliability**: GitHub's infrastructure is very stable
- **Monitoring**: Better logs and failure notifications
- **Flexibility**: Easy to add new jobs or change schedules

## File Changes Made

1. **Created**: `.github/workflows/cron-jobs.yml` - Main workflow file
2. **Modified**: `vercel.json` - Removed cron section
3. **Kept**: All existing cron API endpoints (no code changes needed)

Your existing cron job API endpoints remain unchanged - they just get called by GitHub Actions instead of Vercel.
