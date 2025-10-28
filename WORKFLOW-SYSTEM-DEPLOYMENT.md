# Work Order Workflow System - Database Schema & Deployment Guide

## Overview
This document describes the new multi-level approval workflow system for work orders, including database schema changes, role-based enforcement, and deployment procedures.

## Database Schema Changes

### New Tables Created
1. **work_order_garages** - Junction table for multi-garage assignment
2. **work_order_workshops** - Junction table for multi-workshop assignment with foreman tracking
3. **work_order_memberships** - Tracks all participants (foremen, team members, verifier, store_manager)
4. **work_order_status_history** - Complete audit trail of all status changes
5. **approval_stages** - Defines workflow stages with required roles and sequence
6. **work_order_approvals** - Tracks approval decisions at each stage
7. **item_requisitions** - Bilingual parts request form (Amharic/English)
8. **item_requisition_lines** - Individual items with partial approval support
9. **purchase_requests** - Out-of-stock handling with vendor management
10. **employee_performance_snapshots** - Daily/monthly/yearly performance metrics
11. **employee_performance_totals** - Denormalized totals for leaderboard queries

### Schema Modifications
1. **employees table**:
   - Added roles: `verifier`, `store_manager`
   
2. **work_orders table**:
   - Removed deprecated fields: `assignedToIds`, `estimatedHours`, `estimatedCost`, `scheduledDate`, `notes`
   - Updated status enum to include new workflow states

3. **New Columns**:
   - `approval_stages.required_role` - Role required to approve each stage
   - `work_order_approvals.approver_role` - Role of the approver

### Data Integrity Constraints
- **Unique Indexes** (defined in Drizzle schema):
  - `work_order_approvals` on (work_order_id, stage_id) - prevents duplicate approvals
  - `item_requisition_lines` on (requisition_id, line_number) - ensures unique line numbers
  - `employee_performance_snapshots` on (employee_id, snapshot_date, granularity) - prevents duplicate snapshots

## Role-Based Approval Enforcement

### Database Trigger: `enforce_approval_role`

**Location**: `scripts/create-role-enforcement-trigger.sql`

**Purpose**: Enforces the mandated foreman→store_manager→verifier→supervisor workflow at the database level

**Validations**:
1. **Role Matching**: `approver_role` must match the stage's `required_role`
2. **Employee Validation**: Approver's actual `employees.role` must match `approver_role`
3. **Sequential Enforcement**: All prior stages (based on `approval_stages.sequence`) must be approved before current stage

**Error Handling**: Raises PostgreSQL exceptions with descriptive messages if any validation fails

## Deployment Procedure

### Step 1: Apply Schema Changes
```bash
# This syncs the Drizzle schema with the database
npm run db:push --force
```

### Step 2: Apply Role Enforcement Trigger
```bash
# This creates the trigger function and trigger
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f scripts/create-role-enforcement-trigger.sql
```

### Step 3: Verify Trigger Installation
```sql
-- Check trigger exists
SELECT tgname AS trigger_name, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'enforce_approval_role';

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'validate_approval_role';
```

### Step 4: Initialize Approval Stages
```sql
-- Create the standard approval workflow stages
INSERT INTO approval_stages (code, name, required_role, sequence, is_active)
VALUES 
  ('foreman_assignment', 'Foreman Assignment', 'foreman', 1, true),
  ('team_acceptance', 'Team Member Acceptance', 'user', 2, true),
  ('item_foreman_review', 'Foreman Reviews Item Requisition', 'foreman', 3, true),
  ('item_store_review', 'Store Manager Reviews Requisition', 'store_manager', 4, true),
  ('verification', 'Quality Verification', 'verifier', 5, true),
  ('supervisor_signoff', 'Supervisor Final Approval', 'supervisor', 6, true)
ON CONFLICT (code) DO NOTHING;
```

## Work Order Status Flow

```
draft 
  → pending_foreman_assignment 
  → pending_team_acceptance 
  → active 
  → (if parts needed) awaiting_parts 
  → (if out of stock) waiting_purchase 
  → in_progress 
  → pending_verification 
  → pending_supervisor 
  → completed
```

## Approval Workflow

### Stage 1: Foreman Assignment
- **Role**: Foreman
- **Action**: Assign work order to team members
- **Triggers**: Status changes to `pending_team_acceptance`

### Stage 2: Team Acceptance
- **Role**: Team Member
- **Action**: Accept assigned work order
- **Triggers**: Status changes to `active`

### Stage 3: Item Requisition (Foreman Review)
- **Role**: Foreman
- **Action**: Review and approve item requisition from team
- **Triggers**: If approved, moves to store manager review

### Stage 4: Item Requisition (Store Manager Review)
- **Role**: Store Manager
- **Action**: Approve parts request, mark as fulfilled or create purchase request
- **Triggers**: If out of stock, creates purchase request and status becomes `waiting_purchase`

### Stage 5: Verification
- **Role**: Verifier
- **Action**: Quality control check of completed work
- **Triggers**: Status changes to `pending_supervisor`

### Stage 6: Supervisor Sign-off
- **Role**: Supervisor
- **Action**: Final approval
- **Triggers**: Status changes to `completed`

## Item Requisition Form

Based on the official Sunshine Construction PLC requisition form (Amharic):

### Form Fields:
- **Requisition Number**: REQ-YYYY-XXX (auto-generated)
- **Requesting Workshop/Department**: Selected from workshops
- **Line Items**:
  - Description (ዝርዝር መግለጫ)
  - Unit of Measure (መለኪያ)
  - Quantity (መጠን)
  - Remarks (አስተያየት)

### Signature Workflow:
1. **Requester** (Team Member) → Creates requisition
2. **Foreman** → Reviews and approves/rejects
3. **Store Manager** → Final approval and fulfillment

### Partial Approval:
- Each line item has its own status: `pending`, `approved`, `rejected`, `backordered`, `fulfilled`
- Store manager can partially fulfill requisitions

## Employee Performance Tracking

### Metrics Tracked:
- Tasks completed
- Total labor minutes
- Quality score (from verifier feedback)
- Work orders completed
- Item requisitions processed

### Granularity:
- **Daily snapshots**: Updated each day
- **Monthly totals**: Aggregated for Employee of the Month
- **Yearly totals**: Aggregated for Employee of the Year

### Leaderboard Display:
- Top performers shown on login page
- Achievement badges (Employee of the Month/Year)
- Individual performance dashboards

## API Implementation (Next Steps)

### Required API Routes:
1. **Work Orders**:
   - POST `/api/work-orders` - Create with multi-garage/workshop selection
   - PUT `/api/work-orders/:id/assign-team` - Foreman assigns team members
   - PUT `/api/work-orders/:id/status` - Update status with validation

2. **Item Requisitions**:
   - POST `/api/item-requisitions` - Team member creates requisition
   - PUT `/api/item-requisitions/:id/approve` - Foreman/Store approval
   - POST `/api/item-requisitions/:id/lines` - Add line items

3. **Purchase Requests**:
   - POST `/api/purchase-requests` - Auto-created for out-of-stock items
   - PUT `/api/purchase-requests/:id` - Update vendor/status

4. **Approvals**:
   - POST `/api/work-order-approvals` - Create approval record (validated by trigger)
   - GET `/api/work-order-approvals/:workOrderId` - Get approval history

5. **Performance**:
   - POST `/api/employee-performance/snapshot` - Record daily performance
   - GET `/api/employee-performance/leaderboard` - Get top performers
   - GET `/api/employee-performance/:employeeId` - Individual dashboard

## Testing Checklist

### Database Level:
- [ ] Verify trigger blocks approvals with wrong role
- [ ] Verify trigger blocks out-of-sequence approvals
- [ ] Verify unique constraints prevent duplicates

### API Level:
- [ ] Test complete workflow from draft to completed
- [ ] Test role-based access control
- [ ] Test multi-workshop assignment
- [ ] Test item requisition approval chain
- [ ] Test purchase request creation for out-of-stock items

### Frontend Level:
- [ ] Test foreman dashboard
- [ ] Test team member dashboard
- [ ] Test verifier dashboard
- [ ] Test supervisor dashboard
- [ ] Test store manager dashboard
- [ ] Test performance leaderboard
- [ ] Test bilingual item requisition form

## Migration for New Environments

**Important**: The role enforcement trigger must be applied manually for new environments until integrated into a migration system.

### For New Deployments:
1. Run `npm run db:push --force` to create tables
2. Run the trigger SQL script: `psql ... -f scripts/create-role-enforcement-trigger.sql`
3. Initialize approval stages (see Step 4 above)
4. Verify trigger is active

### Future Improvement:
Consider creating a Drizzle custom migration or database seed script that includes the trigger creation for automated deployments.

## Notes

- The trigger provides database-level guarantees for workflow enforcement
- API layer should still validate roles for better error messages
- The system supports multiple workshops per work order for complex repairs
- Employee performance is tracked automatically through workflow completion
- All status changes are audited in work_order_status_history table

## Related Files

- Schema Definition: `shared/schema.ts`
- Trigger SQL: `scripts/create-role-enforcement-trigger.sql`
- Architecture Docs: `replit.md`
- Amharic Form Reference: `attached_assets/item_1761632969776.PNG`
