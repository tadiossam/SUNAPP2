import { db } from "./db";
import { workOrders, workshops, equipment, employees, garages } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedDashboardSampleData() {
  console.log("🎯 Seeding sample work orders for dashboard reporting...");

  try {
    // Get existing workshops
    const existingWorkshops = await db.select().from(workshops);
    if (existingWorkshops.length === 0) {
      console.log("❌ No workshops found. Please create workshops first.");
      return;
    }

    // Get existing equipment
    const existingEquipment = await db.select().from(equipment).limit(20);
    if (existingEquipment.length === 0) {
      console.log("❌ No equipment found. Please create equipment first.");
      return;
    }

    // Get existing employees
    const existingEmployees = await db.select().from(employees).limit(10);
    
    // Get garages
    const existingGarages = await db.select().from(garages).limit(5);

    console.log(`Found ${existingWorkshops.length} workshops`);
    console.log(`Found ${existingEquipment.length} equipment units`);
    console.log(`Found ${existingEmployees.length} employees`);

    // Helper to generate random date in a specific month/quarter
    const getRandomDate = (year: number, month: number) => {
      const day = Math.floor(Math.random() * 28) + 1;
      return new Date(year, month - 1, day);
    };

    // Generate work orders for 2025 across different months and quarters
    const sampleWorkOrders = [];
    
    // Q1 2025 (January - March)
    for (let i = 0; i < 15; i++) {
      const month = Math.floor(Math.random() * 3) + 1; // Jan, Feb, Mar
      const workshop = existingWorkshops[Math.floor(Math.random() * existingWorkshops.length)];
      const equipmentUnit = existingEquipment[Math.floor(Math.random() * existingEquipment.length)];
      const garage = existingGarages.length > 0 ? existingGarages[Math.floor(Math.random() * existingGarages.length)] : null;
      
      const directCost = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
      const overtimeCost = Math.floor(Math.random() * 15000); // 0-15k
      const outsourceCost = Math.random() > 0.7 ? Math.floor(Math.random() * 30000) : 0; // 30% chance of outsourcing
      const overheadCost = directCost * 0.3; // 30% of direct cost

      const completedDate = getRandomDate(2025, month);
      
      sampleWorkOrders.push({
        workOrderNumber: `WO-2025-Q1-${String(i + 1).padStart(3, '0')}`,
        equipmentId: equipmentUnit.id,
        workshopId: workshop.id,
        garageId: garage?.id || null,
        assignedToIds: existingEmployees.length > 0 ? [existingEmployees[Math.floor(Math.random() * existingEmployees.length)].id] : [],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        workType: ['repair', 'maintenance', 'inspection'][Math.floor(Math.random() * 3)],
        description: `Q1 ${month === 1 ? 'January' : month === 2 ? 'February' : 'March'} maintenance for ${equipmentUnit.make} ${equipmentUnit.model}`,
        status: 'completed',
        estimatedHours: Math.floor(Math.random() * 20) + 5,
        actualHours: Math.floor(Math.random() * 25) + 5,
        directMaintenanceCost: directCost.toString(),
        overtimeCost: overtimeCost.toString(),
        outsourceCost: outsourceCost.toString(),
        overheadCost: overheadCost.toString(),
        actualCost: (directCost + overtimeCost + outsourceCost + overheadCost).toString(),
        isOutsourced: outsourceCost > 0,
        completedAt: completedDate,
        createdAt: new Date(completedDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before completion
      });
    }

    // Q2 2025 (April - June)
    for (let i = 0; i < 18; i++) {
      const month = Math.floor(Math.random() * 3) + 4; // Apr, May, Jun
      const workshop = existingWorkshops[Math.floor(Math.random() * existingWorkshops.length)];
      const equipmentUnit = existingEquipment[Math.floor(Math.random() * existingEquipment.length)];
      const garage = existingGarages.length > 0 ? existingGarages[Math.floor(Math.random() * existingGarages.length)] : null;
      
      const directCost = Math.floor(Math.random() * 55000) + 12000;
      const overtimeCost = Math.floor(Math.random() * 18000);
      const outsourceCost = Math.random() > 0.6 ? Math.floor(Math.random() * 35000) : 0;
      const overheadCost = directCost * 0.3;

      const completedDate = getRandomDate(2025, month);
      
      sampleWorkOrders.push({
        workOrderNumber: `WO-2025-Q2-${String(i + 1).padStart(3, '0')}`,
        equipmentId: equipmentUnit.id,
        workshopId: workshop.id,
        garageId: garage?.id || null,
        assignedToIds: existingEmployees.length > 0 ? [existingEmployees[Math.floor(Math.random() * existingEmployees.length)].id] : [],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        workType: ['repair', 'maintenance', 'inspection', 'wash'][Math.floor(Math.random() * 4)],
        description: `Q2 ${month === 4 ? 'April' : month === 5 ? 'May' : 'June'} service for ${equipmentUnit.make} ${equipmentUnit.model}`,
        status: 'completed',
        estimatedHours: Math.floor(Math.random() * 22) + 6,
        actualHours: Math.floor(Math.random() * 28) + 6,
        directMaintenanceCost: directCost.toString(),
        overtimeCost: overtimeCost.toString(),
        outsourceCost: outsourceCost.toString(),
        overheadCost: overheadCost.toString(),
        actualCost: (directCost + overtimeCost + outsourceCost + overheadCost).toString(),
        isOutsourced: outsourceCost > 0,
        completedAt: completedDate,
        createdAt: new Date(completedDate.getTime() - 10 * 24 * 60 * 60 * 1000),
      });
    }

    // Q3 2025 (July - September)
    for (let i = 0; i < 20; i++) {
      const month = Math.floor(Math.random() * 3) + 7; // Jul, Aug, Sep
      const workshop = existingWorkshops[Math.floor(Math.random() * existingWorkshops.length)];
      const equipmentUnit = existingEquipment[Math.floor(Math.random() * existingEquipment.length)];
      const garage = existingGarages.length > 0 ? existingGarages[Math.floor(Math.random() * existingGarages.length)] : null;
      
      const directCost = Math.floor(Math.random() * 60000) + 15000;
      const overtimeCost = Math.floor(Math.random() * 20000);
      const outsourceCost = Math.random() > 0.65 ? Math.floor(Math.random() * 40000) : 0;
      const overheadCost = directCost * 0.3;

      const completedDate = getRandomDate(2025, month);
      
      sampleWorkOrders.push({
        workOrderNumber: `WO-2025-Q3-${String(i + 1).padStart(3, '0')}`,
        equipmentId: equipmentUnit.id,
        workshopId: workshop.id,
        garageId: garage?.id || null,
        assignedToIds: existingEmployees.length > 0 ? [existingEmployees[Math.floor(Math.random() * existingEmployees.length)].id] : [],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        workType: ['repair', 'maintenance', 'inspection'][Math.floor(Math.random() * 3)],
        description: `Q3 ${month === 7 ? 'July' : month === 8 ? 'August' : 'September'} work for ${equipmentUnit.make} ${equipmentUnit.model}`,
        status: 'completed',
        estimatedHours: Math.floor(Math.random() * 25) + 8,
        actualHours: Math.floor(Math.random() * 30) + 8,
        directMaintenanceCost: directCost.toString(),
        overtimeCost: overtimeCost.toString(),
        outsourceCost: outsourceCost.toString(),
        overheadCost: overheadCost.toString(),
        actualCost: (directCost + overtimeCost + outsourceCost + overheadCost).toString(),
        isOutsourced: outsourceCost > 0,
        completedAt: completedDate,
        createdAt: new Date(completedDate.getTime() - 12 * 24 * 60 * 60 * 1000),
      });
    }

    // Q4 2025 (October only - current month)
    for (let i = 0; i < 12; i++) {
      const workshop = existingWorkshops[Math.floor(Math.random() * existingWorkshops.length)];
      const equipmentUnit = existingEquipment[Math.floor(Math.random() * existingEquipment.length)];
      const garage = existingGarages.length > 0 ? existingGarages[Math.floor(Math.random() * existingGarages.length)] : null;
      
      const directCost = Math.floor(Math.random() * 45000) + 12000;
      const overtimeCost = Math.floor(Math.random() * 16000);
      const outsourceCost = Math.random() > 0.75 ? Math.floor(Math.random() * 25000) : 0;
      const overheadCost = directCost * 0.3;

      const completedDate = getRandomDate(2025, 10); // October
      
      sampleWorkOrders.push({
        workOrderNumber: `WO-2025-Q4-${String(i + 1).padStart(3, '0')}`,
        equipmentId: equipmentUnit.id,
        workshopId: workshop.id,
        garageId: garage?.id || null,
        assignedToIds: existingEmployees.length > 0 ? [existingEmployees[Math.floor(Math.random() * existingEmployees.length)].id] : [],
        priority: ['medium', 'high', 'urgent'][Math.floor(Math.random() * 3)],
        workType: ['repair', 'maintenance'][Math.floor(Math.random() * 2)],
        description: `October maintenance for ${equipmentUnit.make} ${equipmentUnit.model}`,
        status: 'completed',
        estimatedHours: Math.floor(Math.random() * 20) + 6,
        actualHours: Math.floor(Math.random() * 24) + 6,
        directMaintenanceCost: directCost.toString(),
        overtimeCost: overtimeCost.toString(),
        outsourceCost: outsourceCost.toString(),
        overheadCost: overheadCost.toString(),
        actualCost: (directCost + overtimeCost + outsourceCost + overheadCost).toString(),
        isOutsourced: outsourceCost > 0,
        completedAt: completedDate,
        createdAt: new Date(completedDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      });
    }

    // Insert all work orders
    console.log(`Inserting ${sampleWorkOrders.length} sample work orders...`);
    await db.insert(workOrders).values(sampleWorkOrders);

    console.log("✅ Dashboard sample data seeded successfully!");
    console.log(`📊 Created ${sampleWorkOrders.length} completed work orders:`);
    console.log(`   - Q1 2025: 15 work orders`);
    console.log(`   - Q2 2025: 18 work orders`);
    console.log(`   - Q3 2025: 20 work orders`);
    console.log(`   - Q4 2025: 12 work orders (October)`);
    console.log(`\n🎯 Dashboard is now ready to test with real data!`);
    console.log(`   - Filter by time period: Daily, Weekly, Monthly, Q1-Q4, Annual`);
    console.log(`   - Filter by workshop: All 6 workshops have data`);
    console.log(`   - Filter by year: 2025 data available`);
    
  } catch (error) {
    console.error("❌ Error seeding dashboard sample data:", error);
    throw error;
  }
}

seedDashboardSampleData()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
