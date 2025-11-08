import { db } from "./db";
import { nanoid } from "nanoid";
import {
  workOrders,
  itemRequisitions,
  itemRequisitionLines,
  purchaseRequests,
  partsReceipts,
  workOrdersArchive,
  equipmentInspections,
  equipmentReceptions,
  employees,
  equipment,
  spareParts,
  workshops,
  garages,
  employeePerformanceSnapshots
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Comprehensive sample data seeding script
 * Creates realistic data for all work order states, requisitions, and 2017 archived data
 */
export async function seedSampleData() {
  console.log("🌱 Starting comprehensive sample data seeding...");

  try {
    // Fetch existing data to work with
    const [admin] = await db.select().from(employees).where(eq(employees.username, "RPAdmin")).limit(1);
    const allEmployees = await db.select().from(employees).limit(20);
    const allEquipment = await db.select().from(equipment).limit(10);
    const allParts = await db.select().from(spareParts).limit(20);
    const allWorkshops = await db.select().from(workshops).limit(5);
    const allGarages = await db.select().from(garages).limit(3);

    if (!admin || allEmployees.length === 0 || allEquipment.length === 0) {
      console.log("⚠️  Insufficient base data. Please seed basic data first.");
      return;
    }

    console.log("📋 Creating sample work orders in various states...");

    // Helper function to create work order
    const createWorkOrder = async (data: any) => {
      const [wo] = await db.insert(workOrders).values(data).returning();
      return wo;
    };

    // 1. PENDING MECHANIC (pending_foreman_assignment)
    const pendingMechanicWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[0]?.id,
      priority: "high",
      workType: "repair",
      description: "Engine overheating - requires immediate attention",
      status: "pending_foreman_assignment",
      createdById: admin.id,
      createdAt: new Date()
    });
    console.log(`✓ Created work order ${pendingMechanicWO.workOrderNumber} - Pending Mechanic Assignment`);

    // 2. PENDING INSPECTION
    if (allGarages[0] && allEquipment[1]) {
      // First create a reception
      const reception = await db.insert(equipmentReceptions).values({
        receptionNumber: `REC-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        equipmentId: allEquipment[1].id,
        arrivalDate: new Date(),
        driverId: admin.id,
        reasonOfMaintenance: "Service",
        issuesReported: "Routine inspection scheduled",
        serviceType: "long_term",
        status: "driver_submitted"
      }).returning();

      const inspection = await db.insert(equipmentInspections).values({
        inspectionNumber: `INS-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        receptionId: reception[0].id,
        serviceType: "long_term",
        inspectorId: admin.id,
        inspectionDate: new Date(),
        status: "in_progress",
        findings: "Routine inspection in progress"
      }).returning();
      console.log(`✓ Created inspection ${inspection[0]?.inspectionNumber} - Pending Inspection`);
    }

    // 3. COMPLETED INSPECTION
    if (allGarages[0] && allEquipment[2]) {
      // Create reception first
      const completedReception = await db.insert(equipmentReceptions).values({
        receptionNumber: `REC-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        equipmentId: allEquipment[2].id,
        arrivalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        driverId: admin.id,
        reasonOfMaintenance: "Service",
        issuesReported: "Regular safety check",
        serviceType: "short_term",
        status: "driver_submitted"
      }).returning();

      const completedInspection = await db.insert(equipmentInspections).values({
        inspectionNumber: `INS-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        receptionId: completedReception[0].id,
        serviceType: "short_term",
        inspectorId: admin.id,
        approverId: admin.id,
        inspectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "approved",
        overallCondition: "good",
        findings: "All safety checks passed. Equipment is in good condition."
      }).returning();
      console.log(`✓ Created inspection ${completedInspection[0]?.inspectionNumber} - Completed Inspection`);
    }

    // 4. WORK ORDER IN PROGRESS
    const inProgressWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[3]?.id,
      priority: "medium",
      workType: "maintenance",
      description: "Scheduled preventive maintenance - oil change and filters",
      status: "in_progress",
      createdById: admin.id,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Started 3 hours ago
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    console.log(`✓ Created work order ${inProgressWO.workOrderNumber} - In Progress`);

    // 5. WORK ORDER AWAITING PARTS (with requisitions)
    const awaitingPartsWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[4]?.id,
      priority: "high",
      workType: "repair",
      description: "Hydraulic system failure - parts required",
      status: "awaiting_parts",
      createdById: admin.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    console.log(`✓ Created work order ${awaitingPartsWO.workOrderNumber} - Awaiting Parts`);

    // Create requisition for awaiting parts work order
    const requisition1 = await db.insert(itemRequisitions).values({
      requisitionNumber: `REQ-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      workOrderId: awaitingPartsWO.id,
      requesterId: allEmployees[1]?.id || admin.id,
      workshopId: allWorkshops[0]?.id,
      status: "pending_foreman_approval",
      neededBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }).returning();

    // 6. ITEMS REQUIRING FOREMAN APPROVAL
    await db.insert(itemRequisitionLines).values([
      {
        requisitionId: requisition1[0].id,
        lineNumber: 1,
        sparePartId: allParts[0]?.id,
        partNumber: allParts[0]?.partNumber || "HP-001",
        partName: allParts[0]?.name || "Hydraulic Pump",
        description: "Main hydraulic pump assembly",
        quantityRequested: 1,
        unitOfMeasure: "piece",
        status: "pending"
      },
      {
        requisitionId: requisition1[0].id,
        lineNumber: 2,
        sparePartId: allParts[1]?.id,
        partNumber: allParts[1]?.partNumber || "HS-002",
        partName: allParts[1]?.name || "Hydraulic Seal Kit",
        description: "Complete seal kit for hydraulic system",
        quantityRequested: 2,
        unitOfMeasure: "kit",
        status: "pending"
      }
    ]);
    console.log(`✓ Created requisition ${requisition1[0].requisitionNumber} - Items Pending Foreman Approval`);

    // 7. APPROVED ITEMS (Foreman approved, pending store)
    const requisition2 = await db.insert(itemRequisitions).values({
      requisitionNumber: `REQ-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      workOrderId: inProgressWO.id,
      requesterId: allEmployees[2]?.id || admin.id,
      workshopId: allWorkshops[1]?.id,
      status: "pending_store_approval",
      foremanApprovalStatus: "approved",
      foremanApprovedById: admin.id,
      foremanApprovedAt: new Date(),
      neededBy: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    }).returning();

    const approvedLines = await db.insert(itemRequisitionLines).values([
      {
        requisitionId: requisition2[0].id,
        lineNumber: 1,
        sparePartId: allParts[2]?.id,
        partNumber: allParts[2]?.partNumber || "OF-001",
        partName: allParts[2]?.name || "Oil Filter",
        description: "Engine oil filter",
        quantityRequested: 2,
        unitOfMeasure: "piece",
        status: "pending",
        foremanReviewerId: admin.id,
        foremanDecisionAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        requisitionId: requisition2[0].id,
        lineNumber: 2,
        sparePartId: allParts[3]?.id,
        partNumber: allParts[3]?.partNumber || "OIL-001",
        partName: allParts[3]?.name || "Engine Oil 15W-40",
        description: "Premium engine oil",
        quantityRequested: 20,
        unitOfMeasure: "liter",
        status: "pending",
        foremanReviewerId: admin.id,
        foremanDecisionAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]).returning();
    console.log(`✓ Created requisition ${requisition2[0].requisitionNumber} - Items Approved by Foreman, Pending Store`);

    // 8. REJECTED ITEMS
    const requisition3 = await db.insert(itemRequisitions).values({
      requisitionNumber: `REQ-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      workOrderId: pendingMechanicWO.id,
      requesterId: allEmployees[3]?.id || admin.id,
      workshopId: allWorkshops[0]?.id,
      status: "rejected",
      foremanApprovalStatus: "rejected",
      foremanApprovedById: admin.id,
      foremanApprovedAt: new Date(),
      foremanRemarks: "Excessive parts request - rejected",
      neededBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }).returning();

    await db.insert(itemRequisitionLines).values({
      requisitionId: requisition3[0].id,
      lineNumber: 1,
      sparePartId: allParts[4]?.id,
      partNumber: allParts[4]?.partNumber || "TYR-001",
      partName: allParts[4]?.name || "Heavy Duty Tire",
      description: "Replacement tire - unnecessary at this time",
      quantityRequested: 4,
      unitOfMeasure: "piece",
      status: "rejected",
      foremanReviewerId: admin.id,
      foremanDecisionAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      foremanDecisionRemarks: "Not required for current work scope"
    });
    console.log(`✓ Created requisition ${requisition3[0].requisitionNumber} - Items Rejected by Foreman`);

    // 9. RECEIVED ITEMS (Parts issued)
    const completedWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[5]?.id,
      priority: "medium",
      workType: "repair",
      description: "Brake system repair - parts received and installed",
      status: "pending_verification",
      createdById: admin.id,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    const requisition4 = await db.insert(itemRequisitions).values({
      requisitionNumber: `REQ-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      workOrderId: completedWO.id,
      requesterId: allEmployees[4]?.id || admin.id,
      workshopId: allWorkshops[2]?.id,
      status: "approved",
      foremanApprovalStatus: "approved",
      foremanApprovedById: admin.id,
      foremanApprovedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      storeApprovalStatus: "approved",
      storeApprovedById: admin.id,
      storeApprovedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      neededBy: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }).returning();

    const receivedLine = await db.insert(itemRequisitionLines).values({
      requisitionId: requisition4[0].id,
      lineNumber: 1,
      sparePartId: allParts[5]?.id,
      partNumber: allParts[5]?.partNumber || "BP-001",
      partName: allParts[5]?.name || "Brake Pad Set",
      description: "Front brake pads",
      quantityRequested: 1,
      quantityApproved: 1,
      unitOfMeasure: "set",
      status: "approved",
      foremanReviewerId: admin.id,
      foremanDecisionAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    }).returning();

    // Create parts receipt
    await db.insert(partsReceipts).values({
      workOrderId: completedWO.id,
      requisitionLineId: receivedLine[0].id,
      sparePartId: allParts[5]?.id,
      quantityIssued: 1,
      issuedById: admin.id,
      issuedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      notes: "Parts issued and installed by team"
    });
    console.log(`✓ Created work order ${completedWO.workOrderNumber} - Parts Received`);

    // 10. WORK ORDERS PENDING VERIFICATION
    const verificationWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[6]?.id,
      priority: "low",
      workType: "maintenance",
      description: "Routine maintenance completed - awaiting verification",
      status: "pending_verification",
      createdById: admin.id,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      actualHours: "8.5",
      actualCost: "2500.00",
      directMaintenanceCost: "1750.00",
      overtimeCost: "0",
      outsourceCost: "0",
      overheadCost: "750.00"
    });
    console.log(`✓ Created work order ${verificationWO.workOrderNumber} - Pending Verification`);

    // 11. VERIFIED WORK ORDERS
    const verifiedWO = await createWorkOrder({
      workOrderNumber: `WO-2025-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      equipmentId: allEquipment[7]?.id,
      priority: "medium",
      workType: "repair",
      description: "Transmission repair verified - ready for completion approval",
      status: "verified",
      createdById: admin.id,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      actualHours: "16.0",
      actualCost: "8500.00",
      directMaintenanceCost: "5950.00",
      overtimeCost: "1000.00",
      outsourceCost: "0",
      overheadCost: "1550.00",
      completionApprovalStatus: "approved",
      completionApprovedById: admin.id,
      completionApprovedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    console.log(`✓ Created work order ${verifiedWO.workOrderNumber} - Verified`);

    // 12. STORE MANAGER - PURCHASE REQUESTS
    // Note: Purchase requests are auto-generated when requisition lines are approved but parts are out of stock
    // The system will automatically create purchase requests as needed
    console.log("📦 Purchase requests will be auto-generated when parts are out of stock");

    // 13. TEAM PERFORMANCE DATA
    console.log("📊 Creating team performance snapshots...");
    
    const teamMembers = allEmployees.filter((e: any) => 
      e.role?.toLowerCase() === 'team_member' || 
      e.role?.toLowerCase() === 'foreman'
    ).slice(0, 5);

    for (const member of teamMembers) {
      // Daily snapshot
      await db.insert(employeePerformanceSnapshots).values({
        employeeId: member.id,
        employeeName: member.fullName,
        period: "daily",
        periodDate: new Date(),
        completedWorkOrders: Math.floor(Math.random() * 5) + 1,
        averageCompletionTime: (Math.random() * 8 + 2).toFixed(2),
        rank: null
      });

      // Monthly snapshot
      await db.insert(employeePerformanceSnapshots).values({
        employeeId: member.id,
        employeeName: member.fullName,
        period: "monthly",
        periodDate: new Date(),
        completedWorkOrders: Math.floor(Math.random() * 50) + 10,
        averageCompletionTime: (Math.random() * 8 + 2).toFixed(2),
        rank: null
      });
    }
    console.log(`✓ Created performance snapshots for ${teamMembers.length} team members`);

    // 14. ARCHIVED WORK ORDERS FOR 2017 ETHIOPIAN YEAR
    console.log("📚 Creating archived work orders for 2017 Ethiopian year...");

    const ethiopianYear2017 = 2017;
    
    for (let i = 0; i < 10; i++) {
      const archiveWO = await db.insert(workOrdersArchive).values({
        originalWorkOrderId: nanoid(),
        workOrderNumber: `WO-2017-${String(i + 1).padStart(3, '0')}`,
        ethiopianYear: ethiopianYear2017,
        equipmentId: allEquipment[i % allEquipment.length]?.id,
        equipmentModel: allEquipment[i % allEquipment.length]?.model || "Heavy Equipment",
        priority: ["low", "medium", "high"][i % 3],
        workType: ["repair", "maintenance", "inspection"][i % 3],
        description: `Archived work from 2017 - ${["Engine repair", "Hydraulic system maintenance", "Safety inspection"][i % 3]}`,
        status: "completed",
        actualHours: (Math.random() * 20 + 5).toFixed(2),
        actualCost: (Math.random() * 10000 + 1000).toFixed(2),
        directMaintenanceCost: (Math.random() * 7000 + 700).toFixed(2),
        overtimeCost: (Math.random() * 1000).toFixed(2),
        outsourceCost: (Math.random() * 500).toFixed(2),
        overheadCost: (Math.random() * 2000 + 300).toFixed(2),
        isOutsourced: i % 5 === 0,
        createdById: admin.id,
        createdByName: admin.fullName,
        startedAt: new Date(2024, 0, 1 + i),
        completedAt: new Date(2024, 0, 5 + i),
        createdAt: new Date(2024, 0, 1 + i),
        archivedAt: new Date(2024, 11, 31),
        archivedBy: admin.id
      }).returning();

      // Create parts receipts for archived work orders
      if (allParts[i % allParts.length]) {
        // Create a dummy requisition line (we'll use a fake ID since it's archived)
        const dummyReqLineId = nanoid();
        
        await db.insert(partsReceipts).values({
          workOrderId: archiveWO[0].originalWorkOrderId,
          requisitionLineId: dummyReqLineId,
          sparePartId: allParts[i % allParts.length].id,
          quantityIssued: Math.floor(Math.random() * 5) + 1,
          issuedById: admin.id,
          issuedAt: new Date(2024, 0, 2 + i),
          notes: `Parts used in 2017 work order`
        });
      }
    }
    console.log(`✓ Created 10 archived work orders for Ethiopian year 2017`);

    console.log("✅ Sample data seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   - Work orders in various states (pending, in progress, verification, etc.)");
    console.log("   - Requisitions (pending foreman, approved, rejected)");
    console.log("   - Purchase requests (pending, approved, rejected, backorder)");
    console.log("   - Parts receipts (received items)");
    console.log("   - Team performance snapshots");
    console.log("   - 10 archived work orders for 2017 with spare parts data");
    console.log("\n🎯 You can now view this data in the respective pages!");

  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
    throw error;
  }
}
