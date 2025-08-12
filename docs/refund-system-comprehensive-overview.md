# Refund System Comprehensive Overview

## System Overview

The refund system is a comprehensive solution that allows customers to request refunds for purchased products, enables vendors to process these requests, and provides admin oversight to manage refunds and their impact on vendor payouts. The system integrates with the existing order management, payout, and notification systems to provide a seamless experience for all stakeholders.

## Core Architecture

### Key Components
1. **Refund Request Management** - Customer-initiated refund requests
2. **Vendor Refund Processing** - Vendor approval/rejection workflow
3. **Admin Oversight** - Refund monitoring and payout impact management
4. **Financial Integration** - Paystack refund processing and payout calculations
5. **Notification System** - Real-time updates for all stakeholders

### Database Entities
- **Return** (existing) - Core refund request entity
- **Payout** (existing) - Vendor payout management
- **RefundRequest** (new) - Enhanced refund tracking
- **PayoutHold** (new) - Admin payout hold management

## User Flow Overview

### 1. Customer Refund Request Flow

```
Customer → Order History → Select Order → Request Refund → Fill Form → Submit
    ↓
System validates eligibility → Creates refund request → Notifies vendor & admin
    ↓
Customer receives confirmation → Can track refund status
```

**Where it happens:**
- Customer dashboard: `/dashboard/orders/[orderId]`
- Order details page with "Request Refund" button
- Refund request form with reason selection and description

### 2. Vendor Refund Processing Flow

```
Vendor receives notification → Views refund request → Reviews details
    ↓
Vendor decides: Approve/Reject → Provides reason if rejecting
    ↓
If approved: System processes → Updates order status
If rejected: Customer notified with reason → Can appeal to admin
```

**Where it happens:**
- Vendor dashboard: `/vendor/dashboard/refunds`
- Refund management interface with bulk actions
- Individual refund detail view with approve/reject actions

### 3. Admin Oversight Flow

```
Admin dashboard shows pending refunds → Reviews vendor decisions
    ↓
Admin can override vendor decisions → Approve/reject refunds
    ↓
Admin manages payout holds → Reviews vendors with pending refunds
    ↓
Admin can approve/reject payouts based on refund status
```

**Where it happens:**
- Admin dashboard: `/admin/refunds` and `/admin/payouts`
- Refund oversight interface with filtering and bulk actions
- Payout approval interface with refund status indicators

## Sub-Features Breakdown

### 1. Customer Refund Request System

#### 1.1 Refund Eligibility Check
- **Time-based eligibility**: Orders within 7-30 days (configurable)
- **Order status validation**: Only delivered orders eligible
- **Return reason validation**: Valid reasons required

#### 1.2 Refund Request Form
- **Reason selection**: Dropdown with common reasons
- **Description field**: Customer explanation
- **Photo upload**: Evidence of product condition
- **Partial refund option**: For damaged/partial returns

#### 1.3 Refund Tracking
- **Status updates**: Real-time status changes
- **Timeline view**: Complete refund history
- **Communication**: Direct messaging with vendor/admin

### 2. Vendor Refund Management

#### 2.1 Refund Dashboard
- **Pending refunds**: List of refunds requiring action
- **Refund history**: Complete refund record
- **Analytics**: Refund rates and reasons
- **Bulk actions**: Process multiple refunds

#### 2.2 Refund Processing
- **Approve refund**: Proper refund amount calculation and deduction from vendor total earnings and available balance records
- **Reject refund**: Reason required, 
- **Partial refund**: Custom amount processing
- **Condition assessment**: Review customer photos

#### 2.3 Vendor Analytics
- **Refund rate tracking**: Percentage of orders refunded
- **Reason analysis**: Most common refund reasons
- **Financial impact**: Revenue lost to refunds
- **Performance metrics**: Response time to refunds

### 3. Admin Refund Oversight

#### 3.1 Refund Monitoring
- **All refunds view**: Complete system overview
- **Vendor performance**: Refund rates by vendor
- **Dispute resolution**: Override vendor decisions

#### 3.2 Payout Impact Management

#### 3.2.1 Payout Hold System
- **Payout holds**: Vendors with pending refunds
- **Hold amounts**: Calculated based on refund requests
- **Hold duration**: Configurable time periods


#### 3.2.2 Payout Approval Process
- **Refund status check**: Before payout approval
- **Hold amount calculation**: Deduct pending refunds
- **Approval workflow**: Admin decision required
- **Payout adjustment**: Modified amounts based on refunds

#### 3.3 Admin Analytics
- **System-wide metrics**: Overall refund rates
- **Vendor comparison**: Performance benchmarking
- **Financial reporting**: Refund impact on revenue
- **Trend analysis**: Refund patterns over time



#### 4.2 Commission Adjustments
- **Commission reversal**: Remove commission from refunded items
- **Payout recalculation**: Adjust vendor payouts
- **Financial reconciliation**: Accurate accounting




## Implementation Steps

### Phase 1: Database Schema Enhancement

#### 1.1 Create RefundRequest Table
```sql
CREATE TABLE RefundRequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES Return(id),
    customer_id UUID REFERENCES Customer(id),
    vendor_id UUID REFERENCES Vendor(id),
    order_id UUID REFERENCES Order(id),
    order_item_id UUID REFERENCES OrderItem(id),
    reason TEXT NOT NULL,
    description TEXT,
    refund_amount NUMERIC NOT NULL,
    status RefundRequestStatus DEFAULT 'PENDING',
    vendor_response TEXT,
    admin_notes TEXT,
    photos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Create PayoutHold Table
```sql
CREATE TABLE PayoutHold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES Vendor(id),
    payout_id UUID REFERENCES Payout(id),
    hold_amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    refund_request_ids UUID[],
    status PayoutHoldStatus DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    created_by UUID REFERENCES User(id)
);
```

#### 1.3 Update Existing Tables
- Add refund-related fields to Return table
- Enhance Payout table with hold management
- Add refund tracking to OrderItem table

### Phase 2: Backend API Development

#### 2.1 Refund Request APIs
- `POST /api/refunds/request` - Create refund request
- `GET /api/refunds/customer/:customerId` - Customer refund history
- `GET /api/refunds/vendor/:vendorId` - Vendor refund management
- `PUT /api/refunds/:id/approve` - Approve refund
- `PUT /api/refunds/:id/reject` - Reject refund

#### 2.2 Payout Management APIs
- `GET /api/payouts/vendor/:vendorId/holds` - Get payout holds
- `POST /api/payouts/holds` - Create payout hold
- `PUT /api/payouts/holds/:id/release` - Release payout hold
- `GET /api/payouts/refund-impact` - Calculate refund impact

#### 2.3 Admin APIs
- `GET /api/admin/refunds` - All refunds with filtering
- `PUT /api/admin/refunds/:id/override` - Override vendor decision
- `GET /api/admin/payouts/pending-refunds` - Payouts with refund holds
- `POST /api/admin/payouts/:id/approve-with-holds` - Approve payout with holds

### Phase 3: Frontend Development

#### 3.1 Customer Interface
- **Refund request form**: `/customer/orders/[id]/refund`
- **Refund tracking page**: `/dashboard/refunds`
- **Refund history**: Integrated into order details

#### 3.2 Vendor Interface
- **Refund management dashboard**: `/vendor/dashboard/refunds`
- **Refund detail view**: `/vendor/refunds/[id]`
- **Payout hold notifications**: Integrated into vendor dashboard

#### 3.3 Admin Interface
- **Refund oversight**: `/admin/refunds`
- **Payout management**: `/admin/payouts`
- **Analytics dashboard**: `/admin/analytics/refunds`



## Business Rules

### Refund Eligibility
- Orders must be delivered within 7-30 days
- Products must be in original condition
- Valid reason required

### Vendor Responsibilities
- Respond to refund requests within 48 hours
- Provide clear reasons for rejections
- Process approved refunds within 24 hours
- Maintain refund rate below 10%

### Admin Oversight
- Monitor vendors with high refund rates
- Intervene in disputed refunds
- Approve/reject payouts based on refund status
- Maintain system integrity and fairness

### Financial Rules
- Full refunds for valid returns
- Partial refunds for damaged items
- Commission adjustments for refunded items
- Payout holds for pending refunds

## Success Metrics

### Customer Satisfaction
- Refund request completion rate
- Average refund processing time
- Customer satisfaction scores
- Refund appeal rates

### Vendor Performance
- Average response time to refunds
- Refund approval rates
- Vendor refund rate trends
- Payout hold impact

### System Efficiency
- Automated refund processing rate
- Failed refund rate
- Admin intervention rate
- System uptime and performance

This comprehensive refund system provides a robust, scalable solution that balances customer satisfaction, vendor interests, and platform integrity while maintaining clear oversight and control mechanisms. 