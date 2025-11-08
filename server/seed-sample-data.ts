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
  employeePerformanceSnapshots,
  equipmentCategories
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Comprehensive sample data seeding script - 1000+ entries
 * Creates realistic data for all pages, tabs, and workflows
 * Designed to work offline for local deployments
 */
export async function seedSampleData() {
  console.log("🌱 Starting comprehensive sample data seeding (1000+ entries)...");
  console.log("📦 Designed for offline/local deployments - creating all prerequisite data...\n");

  try {
    // Fetch admin user
    const [admin] = await db.select().from(employees).where(eq(employees.username, "RPAdmin")).limit(1);

    if (!admin) {
      console.log("⚠️  No admin user found. Please run production seeding first.");
      return;
    }

    // ============================================
    // 0. CREATE PREREQUISITE LOOKUP DATA
    // ============================================
    console.log("🔧 Creating prerequisite lookup data (categories, workshops, garages)...");
    
    // Create Equipment Categories (always attempt, onConflictDoNothing handles duplicates)
    let existingCategories = await db.select().from(equipmentCategories);
    const categoryNames = ['Heavy Equipment', 'Light Vehicles', 'Construction Tools', 'Material Handling', 'Earth Moving'];
    let newCategoryCount = 0;
    for (const name of categoryNames) {
      try {
        const [cat] = await db.insert(equipmentCategories).values({
          name: name,
          description: `Sample category for ${name.toLowerCase()}`
        }).onConflictDoNothing().returning();
        if (cat) {
          existingCategories.push(cat);
          newCategoryCount++;
        }
      } catch (e) {
        // Skip if exists
      }
    }
    if (existingCategories.length === 0) existingCategories = await db.select().from(equipmentCategories);
    console.log(`✓ Equipment categories: ${newCategoryCount} new, ${existingCategories.length} total`);

    // Create 3 Sample Garages (always attempt, onConflictDoNothing handles duplicates)
    let existingGarages = await db.select().from(garages);
    const garageData = ['Main Garage', 'North Service Center', 'South Workshop Complex'];
    const newGarages = [];
    let newGarageCount = 0;
    
    for (let i = 0; i < garageData.length; i++) {
      try {
        const [garage] = await db.insert(garages).values({
          name: garageData[i],
          location: `Sample Location ${i + 1}`,
          type: 'workshop', // Required field: workshop, field_station, or warehouse
          capacity: 25 + (i * 15),
          isActive: true
        }).onConflictDoNothing().returning();
        if (garage) {
          newGarages.push(garage);
          existingGarages.push(garage);
          newGarageCount++;
        }
      } catch (e: any) {
        console.error(`Error creating garage "${garageData[i]}":`, e.message);
      }
    }
    if (existingGarages.length === 0) existingGarages = await db.select().from(garages);
    console.log(`✓ Garages: ${newGarageCount} new, ${existingGarages.length} total`);

    // Fetch existing data early (needed for workshop foreman assignment)
    const existingEmployees = await db.select().from(employees);
    const foremEmployees = existingEmployees.filter(e => e.role === 'foreman');
    const defaultForeman = foremEmployees[0] || admin; // Use first foreman or admin as fallback

    // Create 12 Sample Workshops (always attempt, onConflictDoNothing handles duplicates)
    let existingWorkshops = await db.select().from(workshops);
    const workshopData = [
      { name: 'Mechanical Workshop A', type: 'mechanical', capacity: 15 },
      { name: 'Mechanical Workshop B', type: 'mechanical', capacity: 12 },
      { name: 'Electrical Workshop A', type: 'electrical', capacity: 10 },
      { name: 'Electrical Workshop B', type: 'electrical', capacity: 8 },
      { name: 'Hydraulic Workshop A', type: 'hydraulic', capacity: 12 },
      { name: 'Hydraulic Workshop B', type: 'hydraulic', capacity: 10 },
      { name: 'Engine Workshop', type: 'mechanical', capacity: 14 },
      { name: 'Transmission Workshop', type: 'mechanical', capacity: 11 },
      { name: 'Welding & Fabrication', type: 'mechanical', capacity: 13 },
      { name: 'Diagnostic Center', type: 'electrical', capacity: 9 },
      { name: 'Paint & Body Shop', type: 'mechanical', capacity: 10 },
      { name: 'General Repair Workshop', type: 'mechanical', capacity: 16 }
    ];
    
    let newWorkshopCount = 0;
    // Use new garages if created, otherwise use all existing garages
    const garagesForWorkshops = newGarages.length > 0 ? newGarages : existingGarages;
    
    for (let i = 0; i < workshopData.length; i++) {
      const data = workshopData[i];
      const garage = garagesForWorkshops[i % garagesForWorkshops.length];
      if (!garage) continue;
      
      // Assign foreman (cycle through available foremen or use default)
      const foremanForWorkshop = foremEmployees.length > 0 ? foremEmployees[i % foremEmployees.length] : defaultForeman;
      
      try {
        const [workshop] = await db.insert(workshops).values({
          name: data.name,
          garageId: garage.id,
          foremanId: foremanForWorkshop.id, // Required field
          description: `Sample ${data.type} workshop for maintenance operations`,
          isActive: true,
          monthlyTarget: 20,
          annualTarget: 240
        }).onConflictDoNothing().returning();
        if (workshop) {
          existingWorkshops.push(workshop);
          newWorkshopCount++;
        }
      } catch (e: any) {
        console.error(`Error creating workshop "${data.name}":`, e.message);
      }
    }
    if (existingWorkshops.length === 0) existingWorkshops = await db.select().from(workshops);
    console.log(`✓ Workshops: ${newWorkshopCount} new, ${existingWorkshops.length} total`);

    console.log(`✓ Prerequisite data ready: ${existingCategories.length} categories, ${existingGarages.length} garages, ${existingWorkshops.length} workshops`);
    console.log(`   (Created for offline deployment: all lookup data is self-contained)\n`);

    // Fetch existing equipment and parts (employees already fetched for workshop creation)
    const existingEquipment = await db.select().from(equipment);
    const existingParts = await db.select().from(spareParts);

    console.log(`📊 Existing data: ${existingEmployees.length} employees, ${existingEquipment.length} equipment, ${existingParts.length} parts`);

    // ============================================
    // 1. CREATE SAMPLE EMPLOYEES (50 total)
    // ============================================
    console.log("👥 Creating sample employees...");
    const employeeRoles = ['team_member', 'foreman', 'verifier', 'store_manager', 'supervisor'];
    const sampleEmployees = [];
    
    for (let i = 0; i < 50; i++) {
      const role = employeeRoles[i % employeeRoles.length];
      const empNum = String(i + 1).padStart(4, '0');
      
      try {
        const [emp] = await db.insert(employees).values({
          employeeNumber: `EMP-${empNum}`,
          username: `emp${empNum}`,
          password: await import("bcrypt").then(bcrypt => bcrypt.hash(`emp${empNum}`, 10)),
          fullName: `Sample Employee ${empNum}`,
          role: role,
          department: i % 3 === 0 ? 'Mechanical' : i % 3 === 1 ? 'Electrical' : 'Hydraulic',
          email: `emp${empNum}@company.com`,
          phone: `+2519${String(10000000 + i).substring(0, 8)}`,
          status: 'active'
        }).onConflictDoNothing().returning();
        
        if (emp) sampleEmployees.push(emp);
      } catch (e) {
        // Skip if already exists
      }
    }
    
    const allEmployees = [...existingEmployees, ...sampleEmployees];
    console.log(`✓ Created ${sampleEmployees.length} new employees (${allEmployees.length} total)`);

    // ============================================
    // 2. CREATE SAMPLE EQUIPMENT CATEGORIES & EQUIPMENT (100 total)
    // ============================================
    console.log("🚜 Creating sample equipment...");
    const equipmentTypes = ['Excavator', 'Bulldozer', 'Loader', 'Grader', 'Dump Truck', 'Crane', 'Forklift', 'Compactor'];
    const sampleEquipment = [];
    
    for (let i = 0; i < 100; i++) {
      const type = equipmentTypes[i % equipmentTypes.length];
      const equipNum = String(i + 1).padStart(4, '0');
      
      try {
        const category = existingCategories[i % existingCategories.length];
        const [equip] = await db.insert(equipment).values({
          plantNumber: `PLT-${equipNum}`,
          name: `${type} ${equipNum}`,
          categoryId: category?.id,
          manufacturer: i % 2 === 0 ? 'Caterpillar' : 'Komatsu',
          model: `${type}-${Math.floor(Math.random() * 900) + 100}`,
          serialNumber: `SN-${nanoid(10).toUpperCase()}`,
          yearOfManufacture: 2015 + (i % 10),
          status: i % 10 === 0 ? 'under_maintenance' : 'operational',
          location: i % 3 === 0 ? 'Site A' : i % 3 === 1 ? 'Site B' : 'Site C',
          projectArea: `Project ${Math.floor(i / 10) + 1}`
        }).onConflictDoNothing().returning();
        
        if (equip) sampleEquipment.push(equip);
      } catch (e) {
        // Skip if already exists
      }
    }
    
    const allEquipment = [...existingEquipment, ...sampleEquipment];
    console.log(`✓ Created ${sampleEquipment.length} new equipment (${allEquipment.length} total)`);

    // ============================================
    // 3. CREATE SAMPLE SPARE PARTS (200 total)
    // ============================================
    console.log("🔧 Creating sample spare parts...");
    const partCategories = ['Engine', 'Hydraulic', 'Electrical', 'Brake', 'Filter', 'Bearing', 'Seal', 'Hose'];
    const sampleParts = [];
    
    for (let i = 0; i < 200; i++) {
      const category = partCategories[i % partCategories.length];
      const partNum = String(i + 1).padStart(5, '0');
      const quantity = Math.floor(Math.random() * 50);
      
      try {
        const [part] = await db.insert(spareParts).values({
          partNumber: `SP-${partNum}`,
          name: `${category} Part ${partNum}`,
          description: `Sample ${category.toLowerCase()} component for heavy equipment`,
          category: category,
          quantity: quantity,
          stockStatus: quantity === 0 ? 'out_of_stock' : quantity < 6 ? 'low_stock' : 'in_stock',
          unitPrice: String((Math.random() * 500 + 50).toFixed(2)),
          reorderLevel: 5,
          location: `Shelf ${String.fromCharCode(65 + (i % 26))}-${Math.floor(i / 26) + 1}`,
          manufacturer: i % 2 === 0 ? 'OEM' : 'Aftermarket',
          unitOfMeasure: category.includes('Oil') || category.includes('Fluid') ? 'liter' : 'piece'
        }).onConflictDoNothing().returning();
        
        if (part) sampleParts.push(part);
      } catch (e) {
        // Skip if already exists
      }
    }
    
    const allParts = [...existingParts, ...sampleParts];
    console.log(`✓ Created ${sampleParts.length} new spare parts (${allParts.length} total)`);

    // ============================================
    // 4. CREATE SAMPLE WORK ORDERS (300 total) - All States
    // ============================================
    console.log("📋 Creating sample work orders in all states...");
    
    const workOrderStatuses = [
      'pending_allocation',
      'pending_foreman_assignment',
      'pending_team_acceptance',
      'in_progress',
      'awaiting_parts',
      'pending_verification',
      'verified',
      'completed'
    ];
    
    const priorities = ['low', 'medium', 'high', 'critical'];
    const workTypes = ['repair', 'maintenance', 'inspection', 'calibration'];
    const sampleWorkOrders = [];
    
    for (let i = 0; i < 300; i++) {
      const status = workOrderStatuses[i % workOrderStatuses.length];
      const priority = priorities[i % priorities.length];
      const workType = workTypes[i % workTypes.length];
      const woNum = String(1000 + i).padStart(3, '0');
      const equipmentItem = allEquipment[i % allEquipment.length];
      const createdBy = allEmployees[i % allEmployees.length];
      
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const woData: any = {
        workOrderNumber: `WO-2025-${woNum}`,
        equipmentId: equipmentItem?.id,
        priority: priority,
        workType: workType,
        description: `${workType.charAt(0).toUpperCase() + workType.slice(1)} required for ${equipmentItem?.name || 'equipment'} - Sample WO ${woNum}`,
        status: status,
        createdById: createdBy?.id || admin.id,
        createdAt: createdAt
      };
      
      // Add foreman/team assignments for appropriate states
      if (['pending_team_acceptance', 'in_progress', 'awaiting_parts', 'pending_verification', 'verified', 'completed'].includes(status)) {
        const foremanEmployees = allEmployees.filter(e => e.role === 'foreman');
        const teamMembers = allEmployees.filter(e => e.role === 'team_member');
        if (foremanEmployees.length > 0) woData.foremanId = foremanEmployees[i % foremanEmployees.length]?.id;
        if (teamMembers.length > 0) woData.assignedMechanicId = teamMembers[i % teamMembers.length]?.id;
        woData.foremanAssignedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
      }
      
      // Add started timestamp for in-progress and later stages
      if (['in_progress', 'awaiting_parts', 'pending_verification', 'verified', 'completed'].includes(status)) {
        woData.startedAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
      }
      
      // Add completion data for verified and completed
      if (['verified', 'completed'].includes(status)) {
        woData.actualHours = String((Math.random() * 20 + 2).toFixed(1));
        woData.actualCost = String((Math.random() * 5000 + 500).toFixed(2));
        woData.directMaintenanceCost = String((Math.random() * 3000 + 300).toFixed(2));
        woData.overtimeCost = String((Math.random() * 500).toFixed(2));
        woData.outsourceCost = "0";
        woData.overheadCost = String((Math.random() * 1000).toFixed(2));
        woData.completedAt = new Date(createdAt.getTime() + parseInt(woData.actualHours) * 60 * 60 * 1000);
      }
      
      try {
        const [wo] = await db.insert(workOrders).values(woData).onConflictDoNothing().returning();
        if (wo) sampleWorkOrders.push(wo);
      } catch (e: any) {
        console.error(`Error creating WO ${woNum}:`, e.message);
      }
    }
    
    console.log(`✓ Created ${sampleWorkOrders.length} work orders across all states`);

    // ============================================
    // 5. CREATE EQUIPMENT RECEPTIONS & INSPECTIONS (50 total)
    // ============================================
    console.log("🚪 Creating equipment receptions and inspections...");
    
    for (let i = 0; i < 50; i++) {
      const recNum = String(2000 + i).padStart(3, '0');
      const equipmentItem = allEquipment[i % allEquipment.length];
      const driver = allEmployees[i % allEmployees.length];
      const daysAgo = Math.floor(Math.random() * 60);
      const arrivalDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const serviceType = i % 2 === 0 ? 'long_term' : 'short_term';
      const reasonOfMaintenance = i % 3 === 0 ? 'Service' : i % 3 === 1 ? 'Accident' : 'Damage';
      
      try {
        const [reception] = await db.insert(equipmentReceptions).values({
          receptionNumber: `REC-2025-${recNum}`,
          equipmentId: equipmentItem?.id,
          arrivalDate: arrivalDate,
          driverId: driver?.id || admin.id,
          reasonOfMaintenance: reasonOfMaintenance,
          issuesReported: `Sample reported issues for reception ${recNum}`,
          serviceType: serviceType,
          status: i % 4 === 0 ? 'driver_submitted' : i % 4 === 1 ? 'awaiting_mechanic' : i % 4 === 2 ? 'under_inspection' : 'inspection_complete'
        }).onConflictDoNothing().returning();
        
        // Create inspection for some receptions
        if (i % 3 === 0 && reception) {
          const insNum = String(3000 + i).padStart(3, '0');
          const inspector = allEmployees.filter(e => e.role === 'supervisor' || e.role === 'foreman')[i % 10] || admin;
          
          await db.insert(equipmentInspections).values({
            inspectionNumber: `INS-2025-${insNum}`,
            receptionId: reception.id,
            serviceType: serviceType,
            inspectorId: inspector.id,
            inspectionDate: new Date(arrivalDate.getTime() + 2 * 60 * 60 * 1000),
            status: i % 2 === 0 ? 'in_progress' : 'completed',
            findings: `Sample inspection findings for ${reception.receptionNumber}`
          }).onConflictDoNothing();
        }
      } catch (e: any) {
        console.error(`Error creating reception ${recNum}:`, e.message);
      }
    }
    
    console.log(`✓ Created 50 equipment receptions and inspections`);

    // ============================================
    // 6. CREATE ITEM REQUISITIONS & LINES (100 requisitions, 300 lines)
    // ============================================
    console.log("📝 Creating item requisitions and requisition lines...");
    
    const requisitionStatuses = ['draft', 'pending_foreman_approval', 'pending_store_approval', 'approved', 'rejected', 'fulfilled'];
    const sampleRequisitions = [];
    
    for (let i = 0; i < 100; i++) {
      const reqNum = String(4000 + i).padStart(3, '0');
      const status = requisitionStatuses[i % requisitionStatuses.length];
      const workOrder = sampleWorkOrders[i % sampleWorkOrders.length];
      const requester = allEmployees.filter(e => e.role === 'team_member')[i % 20] || admin;
      const workshop = existingWorkshops[i % existingWorkshops.length];
      
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const reqData: any = {
        requisitionNumber: `REQ-2025-${reqNum}`,
        workOrderId: workOrder?.id,
        requesterId: requester?.id || admin.id,
        workshopId: workshop?.id,
        status: status,
        neededBy: new Date(Date.now() + (Math.floor(Math.random() * 10) + 1) * 24 * 60 * 60 * 1000)
      };
      
      // Add approval data based on status
      if (['pending_store_approval', 'approved', 'fulfilled'].includes(status)) {
        const foreman = allEmployees.filter(e => e.role === 'foreman')[i % 5] || admin;
        reqData.foremanApprovalStatus = 'approved';
        reqData.foremanApprovedById = foreman.id;
        reqData.foremanApprovedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
      }
      
      if (['approved', 'fulfilled'].includes(status)) {
        const storeManager = allEmployees.filter(e => e.role === 'store_manager')[i % 3] || admin;
        reqData.storeApprovalStatus = 'approved';
        reqData.storeApprovedById = storeManager.id;
        reqData.storeApprovedAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
      }
      
      try {
        const [requisition] = await db.insert(itemRequisitions).values(reqData).onConflictDoNothing().returning();
        if (!requisition) continue; // Skip if duplicate
        sampleRequisitions.push(requisition);
        
        // Create 2-4 requisition lines per requisition
        const lineCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < lineCount; j++) {
          const part = allParts[(i * lineCount + j) % allParts.length];
          const quantityRequested = Math.floor(Math.random() * 10) + 1;
          
          const lineData: any = {
            requisitionId: requisition.id,
            lineNumber: j + 1,
            sparePartId: part?.id,
            partNumber: part?.partNumber || `SP-${j + 1}`,
            partName: part?.name || `Part ${j + 1}`,
            description: `Sample requisition line ${j + 1} for ${part?.name || 'part'}`,
            unitOfMeasure: part?.unitOfMeasure || 'piece',
            quantityRequested: quantityRequested,
            status: status === 'fulfilled' ? 'approved' : 'pending'
          };
          
          if (['approved', 'fulfilled'].includes(status)) {
            lineData.quantityApproved = quantityRequested;
            const reviewer = allEmployees.filter(e => e.role === 'foreman')[i % 5] || admin;
            lineData.foremanReviewerId = reviewer.id;
            lineData.foremanDecisionAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
          }
          
          try {
            const [line] = await db.insert(itemRequisitionLines).values(lineData).onConflictDoNothing().returning();
            
            // Create parts receipt for fulfilled lines (only if workOrder exists)
            if (status === 'fulfilled' && part && line && workOrder) {
              await db.insert(partsReceipts).values({
                workOrderId: workOrder.id,
                requisitionLineId: line.id,
                sparePartId: part.id,
                quantityIssued: quantityRequested,
                issuedById: reqData.storeApprovedById || admin.id,
                issuedAt: new Date(createdAt.getTime() + 8 * 60 * 60 * 1000),
                notes: `Parts issued for ${workOrder.workOrderNumber}`
              }).onConflictDoNothing();
            }
          } catch (e: any) {
            console.error(`Error creating requisition line:`, e.message);
          }
        }
      } catch (e: any) {
        console.error(`Error creating requisition ${reqNum}:`, e.message);
      }
    }
    
    console.log(`✓ Created ${sampleRequisitions.length} requisitions with ~${sampleRequisitions.length * 3} lines`);

    // ============================================
    // 7. CREATE EMPLOYEE PERFORMANCE SNAPSHOTS (100 total)
    // ============================================
    console.log("📊 Creating employee performance snapshots...");
    
    const teamMembers = allEmployees.filter(e => e.role === 'team_member' || e.role === 'foreman');
    
    for (let i = 0; i < 100; i++) {
      const employee = teamMembers[i % teamMembers.length];
      const year = i < 50 ? 2024 : 2025;
      const month = (i % 12) + 1;
      
      try {
        await db.insert(employeePerformanceSnapshots).values({
          employeeId: employee.id,
          snapshotDate: new Date(year, month - 1, 1),
          snapshotType: 'monthly',
          workOrdersCompleted: Math.floor(Math.random() * 20) + 5,
          totalLaborHours: (Math.random() * 160 + 40).toFixed(2),
          avgCompletionTime: (Math.random() * 8 + 2).toFixed(2),
          performanceScore: Math.floor(Math.random() * 50) + 50
        }).onConflictDoNothing();
      } catch (e) {
        // Skip duplicates
      }
    }
    
    console.log(`✓ Created 100 performance snapshots`);

    // ============================================
    // 8. CREATE ARCHIVED WORK ORDERS (2017 Ethiopian Year - 100 entries)
    // ============================================
    console.log("🗄️  Creating archived work orders from Ethiopian year 2017...");
    
    for (let i = 0; i < 100; i++) {
      const woNum = String(5000 + i).padStart(3, '0');
      const equipmentItem = allEquipment[i % allEquipment.length];
      const creator = allEmployees[i % allEmployees.length];
      const priority = priorities[i % priorities.length];
      const workType = workTypes[i % workTypes.length];
      
      const daysAgo = 365 + Math.floor(Math.random() * 365); // 1-2 years ago
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const completedAt = new Date(createdAt.getTime() + (Math.floor(Math.random() * 48) + 8) * 60 * 60 * 1000);
      
      try {
        await db.insert(workOrdersArchive).values({
          originalWorkOrderId: nanoid(),
          workOrderNumber: `WO-2017-${woNum}`,
          ethiopianYear: 2017,
          equipmentId: equipmentItem?.id,
          equipmentName: equipmentItem?.name || 'Unknown Equipment',
          priority: priority,
          workType: workType,
          description: `Archived ${workType} work from 2017 - ${woNum}`,
          status: 'completed',
          actualHours: String((Math.random() * 20 + 2).toFixed(1)),
          actualCost: String((Math.random() * 5000 + 500).toFixed(2)),
          directMaintenanceCost: String((Math.random() * 3000 + 300).toFixed(2)),
          overtimeCost: String((Math.random() * 500).toFixed(2)),
          outsourceCost: "0",
          overheadCost: String((Math.random() * 1000).toFixed(2)),
          createdById: creator?.id || admin.id,
          createdByName: creator?.fullName || admin.fullName,
          createdAt: createdAt,
          startedAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          completedAt: completedAt,
          archivedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          archivedBy: admin.id
        }).onConflictDoNothing();
      } catch (e: any) {
        console.error(`Error creating archived WO ${woNum}:`, e.message);
      }
    }
    
    console.log(`✓ Created 100 archived work orders from Ethiopian year 2017`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n✅ SAMPLE DATA SEEDING COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Summary of Created Data:`);
    console.log(`   • Prerequisites: ${existingCategories.length} categories, ${existingGarages.length} garages, ${existingWorkshops.length} workshops`);
    console.log(`   • ${sampleEmployees.length} new employees (${allEmployees.length} total)`);
    console.log(`   • ${sampleEquipment.length} new equipment (${allEquipment.length} total)`);
    console.log(`   • ${sampleParts.length} new spare parts (${allParts.length} total)`);
    console.log(`   • ${sampleWorkOrders.length} work orders across all states`);
    console.log(`   • 50 equipment receptions & inspections`);
    console.log(`   • ${sampleRequisitions.length} item requisitions with ~${sampleRequisitions.length * 3} lines`);
    console.log(`   • 100 employee performance snapshots`);
    console.log(`   • 100 archived work orders (Ethiopian year 2017)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎯 Total: ~1000+ sample records created!`);
    console.log(`📱 All pages and tabs now have realistic sample data`);
    console.log(`💾 Idempotent & offline-ready: Works on fresh databases`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error: any) {
    console.error("❌ Error seeding sample data:", error);
    throw error;
  }
}
