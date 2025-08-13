# Comprehensive Notification System Plan for Zervia E-commerce Platform

## Overview

The notification system will provide real-time updates to all user roles (Admins, Vendors, Customers, and Agents) through multiple channels:
- **In-App Notifications**: Real-time notifications within the web application (Primary Focus)
- **Push Notifications**: Browser-based push notifications for immediate alerts
- **Email Notifications**: Automated emails for important events (Future: Self-hosted SMTP after getting business hosting)
- **SMS Notifications**: Critical alerts via SMS (Future: After revenue generation)

## System Architecture

### 1. Core Components

#### Database Schema (Already Implemented)
- `Notification` table with comprehensive notification types
- `NotificationPreference` table for user preferences
- `UserUnreadNotificationCount` materialized view for performance

#### Notification Channels
- **IN_APP**: Real-time notifications in the web interface (Current Implementation)
- **PUSH**: Browser push notifications (Current Implementation)
- **EMAIL**: Automated email notifications (Future Implementation)
- **SMS**: SMS notifications for critical alerts (Future Implementation)

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
  AGENT_LOCATION_NAME_UPDATE
  
  // Admin notifications
  HIGH_VALUE_ORDER_ALERT
  LOW_STOCK_ALERT
  
  // Coupon & Promotion notifications
  COUPON_CREATED
  COUPON_EXPIRED
  COUPON_USAGE_THRESHOLD
  COUPON_APPLIED
  COUPON_FAILED
  
  // Wishlist notifications
  PRODUCT_BACK_IN_STOCK
  PRODUCT_PRICE_DROP
  WISHLIST_REMINDER
  
  // Review & Rating notifications
  NEW_PRODUCT_REVIEW
  REVIEW_RESPONSE
  REVIEW_MILESTONE
  
  // Financial notifications
  COMMISSION_RATE_CHANGED
  PAYOUT_ON_HOLD
  PAYOUT_HOLD_RELEASED
  MINIMUM_PAYOUT_REACHED
  
  // Product notifications
  POPULAR_PRODUCT_ALERT
  
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

#### Coupon & Discount Notifications
- **Coupon Applied**: When coupon is successfully applied to order
- **Coupon Failed**: When coupon application fails with reason
- **Coupon Expired**: When customer tries to use expired coupon

#### Wishlist Notifications
- **Product Back in Stock**: When wishlisted product becomes available again
- **Product Price Drop**: When wishlisted product price is reduced
- **Wishlist Reminder**: Weekly summary of wishlist items

#### Review & Rating Notifications
- **Review Response**: When vendor/admin responds to customer's review
- **Review Milestone**: When customer's review helps product reach milestone

### 2. Vendor Notifications

#### Order Management
- **New Order Received**: When new order is placed
- **High Value Order Alert**: Orders above threshold amount


#### Inventory Management
- **Low Stock Alert**: When product inventory is low
- **Out of Stock Alert**: When product is out of stock


#### Financial Notifications
- **Payout Processed**: When payout is processed
- **Payout Failed**: When payout processing fails
- **Commission Rate Changed**: When admin updates vendor commission rates
- **Payment Received**: When payment is received for order
- **Payout On Hold**: When payout is held due to pending refunds
- **Payout Hold Released**: When payout hold is released
- **Minimum Payout Reached**: When vendor earnings reach minimum payout threshold

#### Refund Management
- **Refund Request**: When customer requests refund
- **Refund Action Required**: When vendor action is needed
- **Refund Completed**: When refund process is completed
- **Admin Override**: When admin overrides refund

#### Account Management
- **Application Status**: Vendor application approval/rejection
- **Account Suspension**: Account suspension notifications
- **Policy Updates**: Platform policy changes

#### Coupon Management
- **Coupon Created**: Confirmation when vendor creates new coupon
- **Coupon Expired**: When vendor's coupon reaches expiry date
- **Coupon Usage Threshold**: When coupon usage limit is nearly reached

#### Product & Review Management
- **New Product Review**: When customer leaves review on vendor's product
- **Review Milestone**: When product reaches review milestones (5, 10, 50 reviews)
- **Popular Product Alert**: When vendor's product becomes trending

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

#### Location Management
- **Agent Location Name Update**: When agent updates their pickup location name



### 4. Admin Notifications

#### User Management
- **New Vendor Application**: New vendor registration

#### Financial Alerts
- **Payment Failures**: Failed payment processing
- **Refund Requests**: Refund requests
- **High Value Order Alert**: Orders above admin threshold

#### System Monitoring
- **Low Stock Alert**: When any product inventory is critically low
- **Popular Product Alert**: When products become trending across platform

## Implementation Plan

### Phase 1: Core In-App Notifications (Current)
- [x] Database schema setup (Notification, NotificationPreference tables)
- [x] Basic in-app notification system
- [x] Notification preferences UI
- [x] Integration with order lifecycle
- [x] Integration with return/refund flow
- [x] Basic pickup and agent notifications

### Phase 2: Extended In-App Notifications (Next)
- [ ] Implement approved new notification types:
  - [ ] Coupon management notifications
  - [ ] Wishlist notifications  
  - [ ] Review and rating notifications
  - [ ] Enhanced financial notifications
  - [ ] Product popularity notifications
  - [ ] Agent location notifications
- [ ] Enhanced notification filtering and search
- [ ] Bulk notification management for admins

### Phase 3: Browser Push Notifications
- [ ] Service worker setup for push notifications
- [ ] Push notification registration and management
- [ ] Push notification delivery system
- [ ] User preference controls for push notifications

### Phase 4: Email Notifications (Future)
- [ ] Self-hosted SMTP server setup
- [ ] Email template system
- [ ] Email notification delivery
- [ ] Email preference management
- [ ] Email notification analytics

### Phase 5: SMS Notifications (Future)
- [ ] SMS service integration (when revenue allows)
- [ ] SMS template system
- [ ] SMS delivery for critical alerts only
- [ ] SMS preference management

## Technical Implementation Notes

### Current Architecture
- **Database**: Supabase with RLS policies
- **Framework**: Next.js with Server Actions
- **Real-time**: Supabase real-time subscriptions
- **UI**: React components with shadcn/ui

### Integration Points
- Order lifecycle events (`actions/orders.ts`)
- Return/refund flow (`actions/returns.ts`, `actions/refunds.ts`)
- Pickup management (`lib/services/agent.ts`)
- Coupon system (`actions/coupon.ts`)
- Wishlist system (`actions/wishlist.ts`)
- Review system (`actions/reviews.ts`)

### Performance Considerations
- Materialized view for unread notification counts
- Efficient database queries with proper indexing
- Batch notification processing for bulk operations
- Rate limiting for notification creation
