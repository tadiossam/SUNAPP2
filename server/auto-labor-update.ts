import cron from "node-cron";
import { db } from "./db";
import { workOrders, workOrderLaborEntries, workOrderTimeTracking } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { calculateWorkOrderElapsedTime } from "./work-timer-utils";
import { storage } from "./storage";

let isRunning = false; // Prevent overlapping executions

/**
 * Automatically updates labor entries that were auto-created based on work order elapsed time.
 * This runs every 5 minutes to keep auto-created labor entries in sync with actual work time.
 */
export async function updateAutoLaborEntries() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log("[Auto-Labor] Update already in progress, skipping this run");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("[Auto-Labor] Starting automatic labor entry update...");

    // Get all active work orders
    const activeWorkOrders = await db
      .select()
      .from(workOrders)
      .where(
        inArray(workOrders.status, ["active", "in_progress", "awaiting_parts", "waiting_purchase"])
      );

    if (activeWorkOrders.length === 0) {
      console.log("[Auto-Labor] No active work orders to update");
      return;
    }

    console.log(`[Auto-Labor] Found ${activeWorkOrders.length} active work orders`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const workOrder of activeWorkOrders) {
      try {
        // Get time tracking events for this work order
        const timeEvents = await db
          .select()
          .from(workOrderTimeTracking)
          .where(eq(workOrderTimeTracking.workOrderId, workOrder.id));

        // Calculate elapsed time
        const { elapsedHours } = calculateWorkOrderElapsedTime(
          workOrder.startedAt,
          workOrder.completedAt,
          timeEvents,
          workOrder.status
        );

        if (elapsedHours === 0) {
          continue; // Skip if no time elapsed
        }

        // Get all auto-created labor entries for this work order
        const autoLaborEntries = await db
          .select()
          .from(workOrderLaborEntries)
          .where(
            and(
              eq(workOrderLaborEntries.workOrderId, workOrder.id),
              eq(workOrderLaborEntries.timeSource, "auto")
            )
          );

        if (autoLaborEntries.length === 0) {
          continue; // No auto entries to update
        }

        // Distribute elapsed time evenly among team members
        const hoursPerMember = elapsedHours / autoLaborEntries.length;

        // Update each auto-created labor entry
        for (const entry of autoLaborEntries) {
          const hourlyRate = parseFloat(entry.hourlyRateSnapshot as any);
          const overtimeFactor = parseFloat(entry.overtimeFactor as any);
          const newTotalCost = hoursPerMember * hourlyRate * overtimeFactor;

          await db
            .update(workOrderLaborEntries)
            .set({
              hoursWorked: hoursPerMember.toFixed(2),
              totalCost: newTotalCost.toFixed(2),
            })
            .where(eq(workOrderLaborEntries.id, entry.id));
        }

        // Recalculate work order cost summary to keep summaries synchronized
        await storage.updateWorkOrderCosts(workOrder.id);

        updatedCount += autoLaborEntries.length;
        console.log(
          `[Auto-Labor] ✓ Updated ${autoLaborEntries.length} entries for WO ${workOrder.workOrderNumber} (${elapsedHours.toFixed(2)}h total, ${hoursPerMember.toFixed(2)}h per member)`
        );
      } catch (error) {
        errorCount++;
        console.error(`[Auto-Labor] ✗ Error updating work order ${workOrder.workOrderNumber}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Auto-Labor] Completed in ${duration}ms - Updated ${updatedCount} entries, ${errorCount} errors`
    );
  } catch (error) {
    console.error("[Auto-Labor] Fatal error in auto-labor update:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the automatic labor entry update scheduler using node-cron
 * Runs every 5 minutes (cron: every 5 minutes)
 */
export function startAutoLaborUpdateScheduler() {
  console.log("[Auto-Labor] Starting automatic labor update scheduler (every 5 minutes)");

  // Run immediately on startup
  setTimeout(() => {
    console.log("[Auto-Labor] Running initial update...");
    updateAutoLaborEntries();
  }, 5000); // Wait 5 seconds for server to fully start

  // Schedule to run every 5 minutes using cron syntax
  const cronPattern = "*/5 * * * *";
  cron.schedule(cronPattern, () => {
    updateAutoLaborEntries();
  });

  console.log("[Auto-Labor] Scheduler started successfully");
}
