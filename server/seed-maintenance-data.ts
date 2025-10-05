import { db } from "./db";
import { mechanics, maintenanceRecords, partsUsageHistory, operatingBehaviorReports, equipment, spareParts } from "@shared/schema";

async function seedMaintenanceData() {
  console.log("Seeding maintenance data...");

  // Get existing equipment
  const existingEquipment = await db.select().from(equipment);
  
  if (existingEquipment.length === 0) {
    console.log("No equipment found. Please seed equipment first.");
    return;
  }

  // Create mechanics
  const mechanicsData = [
    {
      fullName: "Ahmed Hassan",
      specialty: "Engine Specialist",
      phoneNumber: "+251-911-234567",
      email: "ahmed.hassan@sunshineconst.com",
      employeeId: "MECH-001",
      isActive: true,
    },
    {
      fullName: "Samuel Tesfaye",
      specialty: "Hydraulic Systems",
      phoneNumber: "+251-911-345678",
      email: "samuel.tesfaye@sunshineconst.com",
      employeeId: "MECH-002",
      isActive: true,
    },
    {
      fullName: "Dawit Bekele",
      specialty: "Electrical Systems",
      phoneNumber: "+251-911-456789",
      email: "dawit.bekele@sunshineconst.com",
      employeeId: "MECH-003",
      isActive: true,
    },
    {
      fullName: "Yohannes Girma",
      specialty: "General Maintenance",
      phoneNumber: "+251-911-567890",
      email: "yohannes.girma@sunshineconst.com",
      employeeId: "MECH-004",
      isActive: true,
    },
    {
      fullName: "Michael Abebe",
      specialty: "Transmission Specialist",
      phoneNumber: "+251-911-678901",
      email: "michael.abebe@sunshineconst.com",
      employeeId: "MECH-005",
      isActive: true,
    },
  ];

  const insertedMechanics = await db.insert(mechanics).values(mechanicsData).returning();
  console.log(`Created ${insertedMechanics.length} mechanics`);

  // Get some spare parts for parts usage records
  const existingParts = await db.select().from(spareParts);

  // Create maintenance records for random equipment
  const maintenanceTypes = ["Routine", "Repair", "Emergency", "Inspection"];
  const maintenanceDescriptions = [
    "Engine oil and filter change",
    "Hydraulic system pressure check and repair",
    "Track tension adjustment and inspection",
    "Electrical system diagnostics and wire repair",
    "Transmission fluid replacement",
    "Cooling system flush and radiator cleaning",
    "Brake system inspection and pad replacement",
    "Fuel system cleaning and filter replacement",
    "Air filter replacement and intake cleaning",
    "General safety inspection and certification",
  ];

  const maintenanceRecordsData = [];
  const partsUsageData = [];

  // Create 3-5 maintenance records for each equipment
  for (const eq of existingEquipment) {
    const numRecords = Math.floor(Math.random() * 3) + 3; // 3-5 records
    
    for (let i = 0; i < numRecords; i++) {
      const daysAgo = Math.floor(Math.random() * 180) + 1; // Random day in last 6 months
      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() - daysAgo);

      const mechanic = insertedMechanics[Math.floor(Math.random() * insertedMechanics.length)];
      const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
      const description = maintenanceDescriptions[Math.floor(Math.random() * maintenanceDescriptions.length)];

      const record = {
        equipmentId: eq.id,
        mechanicId: mechanic.id,
        maintenanceType,
        description,
        operatingHours: Math.floor(Math.random() * 5000) + 1000,
        laborHours: (Math.random() * 8 + 1).toFixed(1),
        cost: (Math.random() * 2000 + 500).toFixed(2),
        status: "completed",
        maintenanceDate,
        completedDate: new Date(maintenanceDate.getTime() + 1000 * 60 * 60 * 24), // Next day
        notes: `Maintenance performed by ${mechanic.fullName}. All systems checked and operational.`,
      };

      maintenanceRecordsData.push(record);
    }
  }

  const insertedRecords = await db.insert(maintenanceRecords).values(maintenanceRecordsData).returning();
  console.log(`Created ${insertedRecords.length} maintenance records`);

  // Add parts usage to some maintenance records (if we have parts)
  if (existingParts.length > 0) {
    for (const record of insertedRecords) {
      // 60% chance to use parts
      if (Math.random() < 0.6) {
        const numParts = Math.floor(Math.random() * 3) + 1; // 1-3 parts per record
        
        for (let i = 0; i < numParts; i++) {
          const part = existingParts[Math.floor(Math.random() * existingParts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitCost = part.price || (Math.random() * 500 + 50).toFixed(2);

          partsUsageData.push({
            maintenanceRecordId: record.id,
            partId: part.id,
            quantity,
            unitCost: unitCost.toString(),
            notes: `Replaced during ${record.maintenanceType.toLowerCase()} maintenance`,
          });
        }
      }
    }

    if (partsUsageData.length > 0) {
      await db.insert(partsUsageHistory).values(partsUsageData);
      console.log(`Created ${partsUsageData.length} parts usage records`);
    }
  }

  // Create operating behavior reports
  const operatingReportsData = [];
  
  for (const eq of existingEquipment) {
    const numReports = Math.floor(Math.random() * 4) + 2; // 2-5 reports
    
    for (let i = 0; i < numReports; i++) {
      const daysAgo = Math.floor(Math.random() * 180) + 1;
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - daysAgo);

      const performanceRating = Math.floor(Math.random() * 2) + 4; // 4-5 rating
      const issues = Math.random() < 0.3 ? "Minor hydraulic leak detected, scheduled for repair" : null;

      operatingReportsData.push({
        equipmentId: eq.id,
        reportDate,
        operatingHours: Math.floor(Math.random() * 5000) + 1000,
        fuelConsumption: (Math.random() * 200 + 50).toFixed(1),
        productivity: `${Math.floor(Math.random() * 500) + 200} cubic meters moved`,
        issuesReported: issues,
        operatorNotes: `Equipment performing ${performanceRating === 5 ? 'excellently' : 'well'}. ${issues ? 'Minor issues noted.' : 'No issues reported.'}`,
        performanceRating,
      });
    }
  }

  const insertedReports = await db.insert(operatingBehaviorReports).values(operatingReportsData).returning();
  console.log(`Created ${insertedReports.length} operating behavior reports`);

  console.log("✅ Maintenance data seeded successfully!");
}

seedMaintenanceData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding maintenance data:", error);
    process.exit(1);
  });
