-- ============================================
-- UPDATE EXISTING WORK ORDER STATUSES
-- This updates old "pending" status to new "pending_allocation"
-- ============================================

-- Update all work orders with old "pending" status to new "pending_allocation"
UPDATE work_orders 
SET status = 'pending_allocation' 
WHERE status = 'pending';

-- Update status history records if they exist
UPDATE work_order_status_history 
SET to_status = 'pending_allocation' 
WHERE to_status = 'pending';

UPDATE work_order_status_history 
SET from_status = 'pending_allocation' 
WHERE from_status = 'pending';

-- Check results
SELECT 
  status, 
  COUNT(*) as count 
FROM work_orders 
GROUP BY status 
ORDER BY status;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Work order statuses updated successfully!';
  RAISE NOTICE 'All "pending" statuses have been changed to "pending_allocation"';
END $$;
