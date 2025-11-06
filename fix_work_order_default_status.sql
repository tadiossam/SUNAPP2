-- ============================================
-- FIX WORK ORDER DEFAULT STATUS
-- Changes database default from "pending" to "pending_allocation"
-- ============================================

-- Step 1: Change the default value for new work orders
ALTER TABLE work_orders 
ALTER COLUMN status SET DEFAULT 'pending_allocation';

-- Step 2: Update ALL existing work orders with "pending" status
UPDATE work_orders 
SET status = 'pending_allocation' 
WHERE status = 'pending';

-- Step 3: Update status history if it exists
UPDATE work_order_status_history 
SET to_status = 'pending_allocation' 
WHERE to_status = 'pending';

UPDATE work_order_status_history 
SET from_status = 'pending_allocation' 
WHERE from_status = 'pending';

-- Step 4: Verify the changes
SELECT 
  'Current Default' as info,
  column_default 
FROM information_schema.columns 
WHERE table_name = 'work_orders' 
AND column_name = 'status';

SELECT 
  'Status Distribution' as info,
  status, 
  COUNT(*) as count 
FROM work_orders 
GROUP BY status 
ORDER BY count DESC;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '===================================================';
  RAISE NOTICE 'Work order default status updated successfully!';
  RAISE NOTICE 'Default changed: "pending" → "pending_allocation"';
  RAISE NOTICE 'All existing work orders updated';
  RAISE NOTICE '===================================================';
END $$;
