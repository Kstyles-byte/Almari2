# Payout System Implementation Overview

Based on my analysis of the codebase and database structure, here's a comprehensive overview for implementing the payout system:

## Current State Analysis

### Existing Infrastructure:
- **Vendor Table**: Has `commission_rate` field (numeric, default 0)
- **Payout Table**: Basic structure exists with status (PENDING, COMPLETED, FAILED)
- **OrderItem Table**: Contains vendor_id, price_at_purchase, quantity
- **Basic Payout UI**: Vendor payout page exists but needs enhancement
- **Admin Dashboard**: Vendor management exists but needs payout features

### Missing Components:
- Commission calculation logic
- Admin payout management interface
- Payout request workflow
- Commission tracking per order
- Payout approval/rejection system

## Requirements for Building the Payout System

### 1. Database Enhancements

**A. Add Commission Tracking to OrderItem**
```sql
ALTER TABLE "OrderItem" ADD COLUMN commission_amount NUMERIC DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN commission_rate NUMERIC DEFAULT 0;
```

**B. Add Payout Request Fields**
```sql
ALTER TABLE "Payout" ADD COLUMN request_amount NUMERIC;
ALTER TABLE "Payout" ADD COLUMN approved_amount NUMERIC;
ALTER TABLE "Payout" ADD COLUMN approved_by UUID REFERENCES "User"(id);
ALTER TABLE "Payout" ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE "Payout" ADD COLUMN rejection_reason TEXT;
ALTER TABLE "Payout" ADD COLUMN bank_details JSONB;
```

**C. Add Payout Settings Table**
```sql
CREATE TABLE "PayoutSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minimum_payout_amount NUMERIC DEFAULT 5000,
  maximum_payout_amount NUMERIC DEFAULT 1000000,
  processing_fee_percentage NUMERIC DEFAULT 0,
  processing_fee_fixed NUMERIC DEFAULT 0,
  payout_schedule TEXT DEFAULT 'WEEKLY', -- DAILY, WEEKLY, MONTHLY
  auto_approval_limit NUMERIC DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Core Features

#### A. Commission Calculation System
- **Automatic Calculation**: Calculate commission when order is delivered
- **Flexible Rates**: Per-vendor commission rates
- **Commission Tracking**: Store commission amount per order item
- **Platform Fee**: Admin's percentage from each transaction

#### B. Payout Request System
- **Vendor Request**: Vendors can request payouts from available balance
- **Minimum/Maximum Limits**: Configurable payout limits
- **Bank Details**: Secure storage of vendor bank information
- **Request Validation**: Check available balance before approval

#### C. Admin Payout Management
- **Payout Queue**: View and manage pending payout requests
- **Approval/Rejection**: Admin can approve or reject with reasons (paystack)
- **Bulk Processing**: Process multiple payouts at once (paystack)
- **Payout History**: Complete audit trail of all payouts

#### D. Financial Tracking
- **Earnings Dashboard**: Real-time earnings calculation
- **Commission Reports**: Detailed commission breakdown
- **Payout Analytics**: Track payout patterns and trends
- **Balance Reconciliation**: Ensure accurate balance calculations

### 3. User Flows

#### **Vendor Flow:**
1. **Dashboard View**
   - View total earnings, commission deducted, net earnings
   - See available balance for payout
   - View payout history and status

2. **Request Payout**
   - Enter payout amount (within limits)
   - Provide/update bank details
   - Submit request with confirmation

3. **Track Payout**
   - View payout status (Pending, Approved, Completed, Failed)
   - Receive notifications on status changes
   - View payout history with details

#### **Admin Flow:**
1. **Payout Management Dashboard**
   - View all pending payout requests
   - See vendor details and payout amounts
   - Filter by date, vendor, amount range

2. **Payout Approval Process**
   - Review payout request details
   - Check vendor's available balance
   - Approve or reject with reason
   - Set payout amount (can be different from requested)

3. **Bulk Operations**
   - Select multiple payouts for batch processing
   - Bulk approve/reject with reason
   - Export payout data for accounting

4. **Financial Overview**
   - View total platform earnings
   - Track commission collected
   - Monitor payout trends
   - Generate financial reports

#### **System Flow:**
1. **Order Completion**
   - When order status changes to "DELIVERED"
   - Calculate commission based on vendor's rate
   - Update vendor's available balance

2. **Payout Processing**
   - Admin approves payout request
   - System deducts from vendor's available balance
   - Update payout status to "COMPLETED"
   - Generate payout reference


### 4. Sub-Features

#### A. Commission Management
- **Per-Vendor Rates**: Set different commission rates per vendor
- **Tiered Commission**: Different rates based on sales volume
- **Commission History**: Track commission changes over time
- **Commission Reports**: Detailed breakdown by period

#### B. Payout Settings
- **Minimum Payout**: Configurable minimum payout amount
- **Processing Fees**: Optional fees for payout processing
- **Payout Schedule**: Set automatic payout schedules
- **Auto-Approval**: Automatic approval for small amounts

#### C. Financial Reports
- **Vendor Earnings Report**: Per-vendor earnings breakdown
- **Platform Revenue Report**: Total platform earnings
- **Payout Summary**: Monthly/quarterly payout summaries
- **Commission Analysis**: Commission trends and patterns



#### E. Security & Compliance
- **Bank Details Encryption**: Secure storage of bank information
- **Audit Trail**: Complete history of all payout actions
- **Fraud Detection**: Monitor for suspicious payout patterns
- **Compliance Reports**: Generate reports for regulatory requirements

### 5. Implementation Steps

#### Phase 1: Database & Backend Foundation
1. Add commission tracking to OrderItem table
2. Enhance Payout table with additional fields
3. Create PayoutSettings table
4. Implement commission calculation logic
5. Create payout request/approval APIs

#### Phase 2: Vendor Interface
1. Enhance vendor dashboard with earnings display
2. Improve payout request form with validation
3. Add payout history and status tracking
4. Implement balance calculation logic

#### Phase 3: Admin Interface
1. Create admin payout management dashboard
2. Build payout approval/rejection interface
3. Implement bulk payout operations
4. Add financial reporting features

#### Phase 4: Advanced Features
1. Implement payout settings management
2. Add comprehensive financial reports
3. Implement security and compliance features


