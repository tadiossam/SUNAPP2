-- Enhanced Database Trigger for Sequential Role-Based Approval Enforcement
-- This ensures approver_role matches both the stage's required_role, the employee's actual role,
-- AND enforces that prior stages are completed before approving the current stage

-- Create function to validate role-based approvals with sequence enforcement
CREATE OR REPLACE FUNCTION validate_approval_role()
RETURNS TRIGGER AS $$
DECLARE
  current_stage_sequence INTEGER;
  prior_incomplete_stages INTEGER;
BEGIN
  -- Check 1: Verify the approver_role matches the stage's required_role
  SELECT sequence INTO current_stage_sequence
  FROM approval_stages
  WHERE id = NEW.stage_id AND required_role = NEW.approver_role;
  
  IF current_stage_sequence IS NULL THEN
    RAISE EXCEPTION 'Approver role (%) does not match the required role for this approval stage', NEW.approver_role;
  END IF;
  
  -- Check 2: Verify the approver's actual employee role matches approver_role
  IF NOT EXISTS (
    SELECT 1 FROM employees
    WHERE id = NEW.approver_id AND role = NEW.approver_role
  ) THEN
    RAISE EXCEPTION 'Approver employee role does not match the specified approver_role (%)  ', NEW.approver_role;
  END IF;
  
  -- Check 3: Enforce sequential approval - all prior stages must be approved first
  -- Count how many prior stages (lower sequence numbers) are not yet approved
  SELECT COUNT(*) INTO prior_incomplete_stages
  FROM approval_stages AS stage
  WHERE stage.sequence < current_stage_sequence
    AND stage.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM work_order_approvals AS approval
      WHERE approval.work_order_id = NEW.work_order_id
        AND approval.stage_id = stage.id
        AND approval.status = 'approved'
    );
  
  IF prior_incomplete_stages > 0 THEN
    RAISE EXCEPTION 'Cannot approve this stage (sequence %) until all prior stages are approved. % prior stage(s) incomplete.', 
      current_stage_sequence, prior_incomplete_stages;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on work_order_approvals table
DROP TRIGGER IF EXISTS enforce_approval_role ON work_order_approvals;

CREATE TRIGGER enforce_approval_role
  BEFORE INSERT OR UPDATE ON work_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION validate_approval_role();

-- Note: This trigger ensures that:
-- 1. The approver_role field matches the required_role from approval_stages
-- 2. The approver's actual role in the employees table matches the approver_role
-- 3. All prior approval stages (based on sequence number) must be completed before current stage
-- 4. This enforces the mandated foreman→store_manager→verifier→supervisor workflow at database level
