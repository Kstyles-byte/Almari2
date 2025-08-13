# Notification System User Guide & Testing Instructions

## Overview

This comprehensive guide provides detailed testing instructions for Almari's notification system across all user roles. Follow these step-by-step procedures to verify that notifications are working correctly for Customers, Vendors, Agents, and Admins.

## 🔧 Prerequisites for Testing

### 1. Environment Setup
- Ensure your development environment is running (`npm run dev`)
- Supabase connection is active
- Real-time subscriptions are enabled
- Push notifications are configured (optional but recommended)

### 2. Test User Accounts
Create test accounts for each role:
- **Customer Account**: Regular shopping account
- **Vendor Account**: Approved vendor with products
- **Agent Account**: Active agent with pickup capacity
- **Admin Account**: Administrative access

### 3. Enable Browser Notifications
For push notification testing:
1. Allow notifications when prompted by the browser
2. Test with different browsers (Chrome, Firefox, Safari)
3. Test on mobile devices for full coverage

---

## 🛎️ Notification System Access Points

### Finding Notifications in the UI

1. **Notification Bell** (Top Navigation)
   - Location: Top-right corner of navigation bar
   - Shows unread count as a red badge
   - Click to open notification dropdown

2. **Notification Dropdown**
   - Shows recent notifications
   - Mark individual notifications as read
   - "Mark all as read" button
   - Link to notification preferences

3. **Notification Settings Page**
   - URL: `/settings/notifications`
   - Access via Settings menu or notification dropdown
   - Configure notification preferences per type and channel

4. **Push Notifications**
   - Browser notifications (desktop)
   - Mobile notifications (PWA)
   - Test notification button in settings

---

## 👤 Customer Notification Testing

### Order Lifecycle Notifications

#### Test 1: Order Confirmation
**Actions to Take:**
1. Log in as a customer
2. Add products to cart
3. Complete checkout process
4. Submit order

**Expected Notifications:**
- ✅ **ORDER_STATUS_CHANGE**: "Order Confirmation - Your order #[ID] has been confirmed"
- ✅ In-app notification appears immediately
- ✅ Push notification (if enabled)

**What to Watch For:**
- Notification appears within 2-3 seconds
- Correct order ID in message
- Clickable link to order details
- Unread count increases

---

#### Test 2: Payment Confirmation
**Actions to Take:**
1. Complete payment for an order
2. Wait for payment processing

**Expected Notifications:**
- ✅ **PAYMENT_RECEIVED**: "Payment Confirmed - Payment for order #[ID] has been processed"

**What to Watch For:**
- Appears after successful payment
- Contains payment amount
- Links to order details

---

#### Test 3: Order Status Changes
**Actions to Take:**
1. As admin/vendor, change order status to:
   - PROCESSING
   - SHIPPED
   - READY_FOR_PICKUP
   - DELIVERED

**Expected Notifications for Each Status:**
- ✅ **ORDER_PROCESSING**: "Order Processing - Your order #[ID] is being processed"
- ✅ **ORDER_SHIPPED**: "Order Shipped - Your order #[ID] has been shipped"
- ✅ **PICKUP_READY**: "Ready for Pickup - Your order #[ID] is ready for pickup at [location]"
- ✅ **ORDER_DELIVERED**: "Order Delivered - Your order #[ID] has been delivered"

**What to Watch For:**
- Each status change triggers appropriate notification
- Pickup notifications include pickup code
- Tracking information (if applicable)

---

#### Test 4: Payment Failed
**Actions to Take:**
1. Simulate payment failure (use test payment methods)
2. Or trigger manually through admin panel

**Expected Notifications:**
- ✅ **PAYMENT_FAILED**: "Payment Failed - Payment for order #[ID] could not be processed"

**What to Watch For:**
- Clear failure reason
- Instructions for retry
- Link to payment page

---

### Refund & Return Notifications

#### Test 5: Refund Request Submission
**Actions to Take:**
1. Go to order history
2. Request refund for an item
3. Fill out refund form
4. Submit request

**Expected Notifications:**
- ✅ **REFUND_REQUEST_CONFIRMATION**: "Refund Request Submitted - Your refund request for order #[ID] has been received"

**What to Watch For:**
- Immediate confirmation
- Refund request ID
- Expected processing time

---

#### Test 6: Refund Status Updates
**Actions to Take:**
1. As vendor/admin, process refund requests:
   - Approve refund
   - Reject refund
   - Process refund
   - Complete refund

**Expected Notifications:**
- ✅ **REFUND_APPROVED**: "Refund Approved - Your refund request has been approved"
- ✅ **REFUND_REJECTED**: "Refund Rejected - Your refund request has been rejected"
- ✅ **REFUND_PROCESSING**: "Refund Processing - Your refund is being processed"
- ✅ **REFUND_PROCESSED**: "Refund Complete - Your refund has been processed"

**What to Watch For:**
- Clear status updates
- Refund amount displayed
- Processing timeline
- Reason for rejection (if applicable)

---

### Product & Wishlist Notifications

#### Test 7: Back in Stock Alert
**Actions to Take:**
1. Add out-of-stock product to wishlist
2. As vendor/admin, update product inventory
3. Make product available again

**Expected Notifications:**
- ✅ **PRODUCT_BACK_IN_STOCK**: "Back in Stock - [Product Name] is now available!"

**What to Watch For:**
- Notification for each wishlisted product
- Direct link to product page
- Current price displayed

---

#### Test 8: Price Drop Alert
**Actions to Take:**
1. Add product to wishlist
2. As vendor, reduce product price
3. Wait for price tracking system to detect change

**Expected Notifications:**
- ✅ **PRODUCT_PRICE_DROP**: "Price Drop - [Product Name] price reduced to $[New Price]"

**What to Watch For:**
- Shows old vs new price
- Discount percentage
- Link to product page

---

#### Test 9: Wishlist Reminder
**Actions to Take:**
1. Add products to wishlist
2. Wait for weekly reminder (or trigger manually)

**Expected Notifications:**
- ✅ **WISHLIST_REMINDER**: "Wishlist Reminder - You have [X] items in your wishlist"

**What to Watch For:**
- Weekly timing
- Count of wishlist items
- Link to wishlist page

---

### Coupon Notifications

#### Test 10: Coupon Application
**Actions to Take:**
1. Apply valid coupon during checkout
2. Apply invalid/expired coupon

**Expected Notifications:**
- ✅ **COUPON_APPLIED**: "Coupon Applied - You saved $[Amount] with coupon [CODE]"
- ✅ **COUPON_FAILED**: "Coupon Invalid - Coupon [CODE] could not be applied"

**What to Watch For:**
- Success message shows savings
- Failure message explains reason
- Updated order total

---

### Review Notifications

#### Test 11: Review Response
**Actions to Take:**
1. Leave a product review
2. As vendor, respond to the review

**Expected Notifications:**
- ✅ **REVIEW_RESPONSE**: "Review Response - [Vendor] responded to your review"

**What to Watch For:**
- Vendor name included
- Link to review
- Response text preview

---

## 🏪 Vendor Notification Testing

### Order Management Notifications

#### Test 12: New Order Alert
**Actions to Take:**
1. As customer, place order with vendor's products
2. Check vendor notification

**Expected Notifications:**
- ✅ **NEW_ORDER_VENDOR**: "New Order - You have a new order #[ID] worth $[Amount]"

**What to Watch For:**
- Immediate notification
- Order value displayed
- Customer information
- Link to order management

---

#### Test 13: Payment Received
**Actions to Take:**
1. Customer completes payment for vendor's products

**Expected Notifications:**
- ✅ **PAYMENT_RECEIVED**: "Payment Received - $[Amount] payment received for order #[ID]"

**What to Watch For:**
- Payment amount
- Commission deduction info
- Expected payout date

---

### Inventory Notifications

#### Test 14: Low Stock Alert
**Actions to Take:**
1. As vendor, reduce product inventory to low levels (≤5 items)
2. Or set up automated inventory tracking

**Expected Notifications:**
- ✅ **LOW_STOCK_ALERT**: "Low Stock - [Product Name] has only [X] items remaining"

**What to Watch For:**
- Triggers at correct threshold
- Product name and current stock
- Link to inventory management

---

#### Test 15: Popular Product Alert
**Actions to Take:**
1. Generate high sales volume for a product
2. Or trigger manually via admin panel

**Expected Notifications:**
- ✅ **POPULAR_PRODUCT_ALERT**: "Trending Product - [Product Name] is performing well!"

**What to Watch For:**
- Sales metrics included
- Suggested actions (restock, promote)
- Performance comparison

---

### Payout Notifications

#### Test 16: Payout Processing
**Actions to Take:**
1. As admin, process vendor payouts
2. Test different payout scenarios:
   - Successful payout
   - Failed payout
   - Payout on hold

**Expected Notifications:**
- ✅ **PAYOUT_PROCESSED**: "Payout Processed - $[Amount] has been sent to your account"
- ✅ **PAYOUT_FAILED**: "Payout Failed - Payout of $[Amount] could not be processed"
- ✅ **PAYOUT_ON_HOLD**: "Payout On Hold - Your payout is temporarily on hold"
- ✅ **PAYOUT_HOLD_RELEASED**: "Payout Hold Released - Your held payout has been released"

**What to Watch For:**
- Accurate amounts
- Bank account details (last 4 digits)
- Reason for holds/failures
- Next payout date

---

#### Test 17: Minimum Payout Reached
**Actions to Take:**
1. Accumulate earnings to minimum payout threshold
2. System should auto-detect threshold

**Expected Notifications:**
- ✅ **MINIMUM_PAYOUT_REACHED**: "Payout Available - You've reached the minimum payout amount"

**What to Watch For:**
- Correct threshold amount
- Instructions for requesting payout
- Link to payout section

---

#### Test 18: Commission Rate Changes
**Actions to Take:**
1. As admin, update vendor commission rates

**Expected Notifications:**
- ✅ **COMMISSION_RATE_CHANGED**: "Commission Updated - Your commission rate has changed to [X]%"

**What to Watch For:**
- Old vs new commission rate
- Effective date
- Impact on future earnings

---

### Coupon Management Notifications

#### Test 19: Coupon Lifecycle
**Actions to Take:**
1. Create new coupon
2. Monitor coupon usage
3. Let coupon expire or reach usage limit

**Expected Notifications:**
- ✅ **COUPON_CREATED**: "Coupon Created - Your coupon [CODE] is now active"
- ✅ **COUPON_USAGE_THRESHOLD**: "Coupon Alert - [CODE] is nearing usage limit"
- ✅ **COUPON_EXPIRED**: "Coupon Expired - Coupon [CODE] has expired"

**What to Watch For:**
- Coupon code and details
- Usage statistics
- Performance metrics

---

### Review Management Notifications

#### Test 20: New Product Reviews
**Actions to Take:**
1. As customer, leave reviews on vendor products
2. Monitor review milestones

**Expected Notifications:**
- ✅ **NEW_PRODUCT_REVIEW**: "New Review - [Product Name] received a [X]-star review"
- ✅ **REVIEW_MILESTONE**: "Review Milestone - [Product Name] reached [X] reviews!"

**What to Watch For:**
- Review rating and content
- Customer information (anonymized)
- Link to respond to review
- Milestone celebrations

---

### Return Management Notifications

#### Test 21: Return Requests
**Actions to Take:**
1. As customer, request returns for vendor products
2. As vendor, process return requests

**Expected Notifications:**
- ✅ **RETURN_VENDOR_ACTION_REQUIRED**: "Return Request - Action required for return #[ID]"
- ✅ **RETURN_VENDOR_COMPLETED**: "Return Completed - Return #[ID] has been processed"

**What to Watch For:**
- Return reason and details
- Customer photos/documentation
- Processing deadlines
- Refund implications

---

## 🚚 Agent Notification Testing

### Pickup Assignment Notifications

#### Test 22: New Pickup Assignment
**Actions to Take:**
1. As admin/system, assign pickup to agent
2. Customer order reaches "READY_FOR_PICKUP" status

**Expected Notifications:**
- ✅ **NEW_PICKUP_ASSIGNMENT**: "New Pickup - Pickup assigned for order #[ID] at [Location]"

**What to Watch For:**
- Pickup location and address
- Customer contact information
- Pickup time window
- Special instructions

---

#### Test 23: Return Pickup Assignment
**Actions to Take:**
1. Process return request requiring pickup
2. Assign agent to return pickup

**Expected Notifications:**
- ✅ **RETURN_PICKUP_ASSIGNMENT**: "Return Pickup - Pickup assigned for return #[ID]"

**What to Watch For:**
- Return details and reason
- Customer address
- Items to collect
- Vendor requirements

---

#### Test 24: Agent Location Updates
**Actions to Take:**
1. As agent, update location/address in profile
2. Admin updates agent location

**Expected Notifications:**
- ✅ **AGENT_LOCATION_NAME_UPDATE**: "Location Updated - Your service location has been updated"

**What to Watch For:**
- New location details
- Service area changes
- Contact information updates

---

## 👨‍💼 Admin Notification Testing

### System Alerts

#### Test 25: High Value Orders
**Actions to Take:**
1. Process orders above high-value threshold
2. Set threshold in admin settings

**Expected Notifications:**
- ✅ **HIGH_VALUE_ORDER_ALERT**: "High Value Order - Order #[ID] worth $[Amount] requires attention"

**What to Watch For:**
- Order value and threshold
- Customer information
- Payment verification status
- Risk assessment flags

---

#### Test 26: New Vendor Applications
**Actions to Take:**
1. Submit new vendor application
2. Monitor admin notifications

**Expected Notifications:**
- ✅ **NEW_VENDOR_APPLICATION**: "New Vendor - [Vendor Name] submitted an application"

**What to Watch For:**
- Vendor details and documentation
- Application completeness
- Link to review application
- Approval workflow

---

## 🔧 Notification Settings Testing

### Test 27: Notification Preferences
**Actions to Take:**
1. Go to `/settings/notifications`
2. Test different preference combinations:
   - Enable/disable different notification types
   - Switch between IN_APP and PUSH channels
   - Test critical notifications (cannot be disabled)

**Expected Behavior:**
- ✅ Preferences save correctly
- ✅ Disabled notifications don't appear
- ✅ Critical notifications always show
- ✅ Channel preferences respected

**What to Watch For:**
- Real-time preference updates
- Visual feedback on changes
- Proper role-based notification types
- Critical notification warnings

---

### Test 28: Real-time Updates
**Actions to Take:**
1. Open notification dropdown
2. Trigger notifications from another browser/device
3. Monitor real-time updates

**Expected Behavior:**
- ✅ New notifications appear instantly
- ✅ Unread count updates
- ✅ Read status syncs across devices
- ✅ No page refresh required

**What to Watch For:**
- Supabase realtime connection status
- WebSocket stability
- Browser compatibility
- Mobile responsiveness

---

## 🔄 Push Notification Testing

### Test 29: Push Notification Setup
**Actions to Take:**
1. Enable push notifications in browser
2. Test on different browsers and devices
3. Test notification permission flow

**Expected Behavior:**
- ✅ Permission request appears
- ✅ Registration success/failure handling
- ✅ Service worker registration
- ✅ Test notification works

**What to Watch For:**
- Browser compatibility
- Permission states (granted/denied/default)
- Service worker installation
- VAPID key configuration

---

### Test 30: Background Notifications
**Actions to Take:**
1. Close browser tab/window
2. Trigger notifications from admin panel
3. Test notification clicks

**Expected Behavior:**
- ✅ Notifications appear when app is closed
- ✅ Clicking opens relevant page
- ✅ Notification actions work
- ✅ Sound/vibration (if enabled)

**What to Watch For:**
- Background sync functionality
- Click event handling
- URL routing on click
- Mobile device behavior

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: Notifications Not Appearing
**Symptoms:**
- No in-app notifications
- Missing notification bell badge

**Check:**
- [ ] User is logged in
- [ ] Supabase connection active
- [ ] Real-time subscriptions enabled
- [ ] Browser console for JavaScript errors
- [ ] Network tab for API calls

**Common Fixes:**
- Refresh page to reconnect websockets
- Check notification preferences
- Verify user permissions
- Clear browser cache

---

### Issue 2: Push Notifications Not Working
**Symptoms:**
- No browser notifications
- Permission denied

**Check:**
- [ ] Browser notification permissions
- [ ] VAPID keys configured
- [ ] Service worker registered
- [ ] HTTPS connection (required for push)

**Common Fixes:**
- Reset notification permissions
- Re-register service worker
- Check VAPID key validity
- Test on different browser

---

### Issue 3: Delayed Notifications
**Symptoms:**
- Notifications appear late
- Inconsistent timing

**Check:**
- [ ] Network connectivity
- [ ] Supabase performance
- [ ] Database indexes
- [ ] Real-time subscription limits

**Common Fixes:**
- Optimize database queries
- Check Supabase quota limits
- Monitor real-time connections
- Implement client-side retry logic

---

### Issue 4: Wrong Notification Content
**Symptoms:**
- Incorrect messages
- Missing data
- Wrong user targeting

**Check:**
- [ ] Notification templates
- [ ] User role permissions
- [ ] Data validation
- [ ] Template variable substitution

**Common Fixes:**
- Review notification service code
- Validate input data
- Test template rendering
- Check user role mapping

---

## 📊 Testing Checklist

### Pre-Testing Setup
- [ ] Development environment running
- [ ] Test accounts created for all roles
- [ ] Supabase connection verified
- [ ] Push notifications configured
- [ ] Browser notifications enabled

### Customer Tests
- [ ] Order confirmation notifications
- [ ] Payment status notifications
- [ ] Order status change notifications
- [ ] Refund/return notifications
- [ ] Wishlist notifications (back in stock, price drop)
- [ ] Coupon notifications
- [ ] Review response notifications

### Vendor Tests
- [ ] New order notifications
- [ ] Payment received notifications
- [ ] Inventory alerts (low stock, popular products)
- [ ] Payout notifications
- [ ] Commission rate changes
- [ ] Coupon management notifications
- [ ] Review notifications
- [ ] Return management notifications

### Agent Tests
- [ ] Pickup assignment notifications
- [ ] Return pickup notifications
- [ ] Location update notifications

### Admin Tests
- [ ] High-value order alerts
- [ ] New vendor application notifications
- [ ] System monitoring alerts

### System Tests
- [ ] Real-time updates working
- [ ] Push notifications functional
- [ ] Notification preferences saving
- [ ] Cross-device synchronization
- [ ] Performance under load

### Edge Cases
- [ ] Network interruption recovery
- [ ] Browser tab/window closure
- [ ] Multiple concurrent users
- [ ] Large notification volumes
- [ ] Error handling and fallbacks

---

## 🎯 Success Criteria

A fully functional notification system should:

1. **Deliver notifications reliably** (>99% success rate)
2. **Update in real-time** (<3 second latency)
3. **Respect user preferences** (disabled types don't appear)
4. **Work across devices** (mobile, desktop, different browsers)
5. **Handle errors gracefully** (retry logic, fallbacks)
6. **Provide clear content** (actionable, informative messages)
7. **Link to relevant pages** (order details, product pages, etc.)
8. **Scale with user growth** (performance under load)

---

## 📞 Support & Resources

### Documentation
- API Documentation: `docs/notification-api.md`
- Admin Guide: `docs/notification-admin-guide.md`
- Database Schema: Check Supabase dashboard

### Code Locations
- **Notification Services**: `lib/notifications/`
- **API Routes**: `app/api/notifications/`
- **Components**: `components/notifications/`
- **Context**: `contexts/NotificationContext.tsx`
- **Hooks**: `hooks/useNotifications.ts`

### Environment Variables
- Check `.env` file for Supabase keys
- Verify VAPID keys for push notifications
- Confirm API keys are configured

### Performance Monitoring
- Monitor Supabase realtime usage
- Check API response times
- Track notification delivery rates
- Monitor user engagement metrics

Remember to test thoroughly across different browsers, devices, and network conditions to ensure a consistent user experience!
