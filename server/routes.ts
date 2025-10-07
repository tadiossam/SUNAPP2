import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEquipmentSchema, 
  insertSparePartSchema,
  insertMechanicSchema,
  insertMaintenanceRecordSchema,
  insertPartsUsageHistorySchema,
  insertOperatingBehaviorReportSchema,
  insertGarageSchema,
  insertRepairBaySchema,
  insertEmployeeSchema,
  insertWorkOrderSchema,
  insertStandardOperatingProcedureSchema,
  insertPartsStorageLocationSchema,
  insertEquipmentLocationSchema,
} from "@shared/schema";
import multer from "multer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { isCEO, isCEOOrAdmin, verifyCredentials, generateToken } from "./auth";
import { sendCEONotification, createNotification } from "./email-service";

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Configure multer for 3D model files
const upload3DModel = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for 3D models
  fileFilter: (_req, file, cb) => {
    // Accept 3D model formats
    const allowedMimeTypes = [
      'model/gltf-binary', // GLB
      'model/gltf+json',   // GLTF
      'model/obj',         // OBJ
      'application/octet-stream', // Fallback for GLB files
    ];
    const allowedExtensions = ['.glb', '.gltf', '.obj'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only 3D model files (GLB, GLTF, OBJ) are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, language } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await verifyCredentials(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user language preference if provided
      if (language && (language === 'en' || language === 'am')) {
        await storage.updateUserLanguage(user.id, language);
        user.language = language;
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json({ user: userWithoutPassword });
    } else {
      res.json({ user: null });
    }
  });

  // User language preference update
  app.post("/api/user/language", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { language } = req.body;
      
      if (!language || (language !== 'en' && language !== 'am')) {
        return res.status(400).json({ message: "Invalid language. Must be 'en' or 'am'" });
      }

      await storage.updateUserLanguage(req.user.id, language);
      
      res.json({ message: "Language preference updated successfully" });
    } catch (error) {
      console.error("Error updating language preference:", error);
      res.status(500).json({ message: "Failed to update language preference" });
    }
  });

  // Equipment endpoints with server-side search
  app.get("/api/equipment", async (req, res) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const equipmentType = req.query.equipmentType as string | undefined;
      const make = req.query.make as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await storage.searchEquipment({
        searchTerm,
        equipmentType: equipmentType !== "all" ? equipmentType : undefined,
        make: make !== "all" ? make : undefined,
        limit,
        offset,
      });

      res.json(result.items);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.get("/api/equipment/:id", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Protected: Only CEO/Admin can create equipment
  app.post("/api/equipment", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(validatedData);
      
      // Send email notification if user is admin (CEO gets notified about admin actions)
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created',
          'equipment',
          equipment.id,
          req.user.username,
          validatedData
        ));
      }
      
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  // Spare parts endpoints with server-side search
  app.get("/api/parts", async (req, res) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const stockStatus = req.query.stockStatus as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await storage.searchParts({
        searchTerm,
        category: category !== "all" ? category : undefined,
        stockStatus: stockStatus !== "all" ? stockStatus : undefined,
        limit,
        offset,
      });

      res.json(result.items);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ error: "Failed to fetch parts" });
    }
  });

  app.get("/api/parts/:id", async (req, res) => {
    try {
      const part = await storage.getPartById(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      res.json(part);
    } catch (error) {
      console.error("Error fetching part:", error);
      res.status(500).json({ error: "Failed to fetch part" });
    }
  });

  app.post("/api/parts", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.parse(req.body);
      const part = await storage.createPart(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'spare_part', part.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(400).json({ error: "Invalid part data" });
    }
  });

  app.put("/api/parts/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.partial().parse(req.body);
      const part = await storage.updatePart(req.params.id, validatedData);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, validatedData
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(400).json({ error: "Invalid part data" });
    }
  });

  // Upload 3D model file to object storage
  app.post("/api/parts/:id/upload-model", isCEOOrAdmin, upload3DModel.single('modelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const partId = req.params.id;
      const part = await storage.getPartById(partId);
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      // Generate unique filename with part number
      const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
      const fileName = `${part.partNumber}-${nanoid(8)}${fileExtension}`;
      
      // Get the public object storage path
      const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
      if (!publicPath) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Create models directory if it doesn't exist
      await mkdir(join(publicPath, 'models'), { recursive: true });

      // Write file to object storage
      const filePath = join(publicPath, 'models', fileName);
      await writeFile(filePath, req.file.buffer);

      // Update part with publicly accessible URL path
      const publicUrl = `/public/models/${fileName}`;
      const updatedPart = await storage.updatePartModel(partId, publicUrl);

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, { action: '3D model uploaded', fileName }
        ));
      }

      res.json({ 
        message: "3D model uploaded successfully",
        part: updatedPart,
        modelPath: publicUrl
      });
    } catch (error) {
      console.error("Error uploading 3D model:", error);
      res.status(500).json({ error: "Failed to upload 3D model" });
    }
  });

  app.put("/api/parts/:id/model", isCEOOrAdmin, async (req, res) => {
    try {
      const { model3dPath } = req.body;
      if (!model3dPath) {
        return res.status(400).json({ error: "model3dPath is required" });
      }
      const part = await storage.updatePartModel(req.params.id, model3dPath);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, { model3dPath }
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating part model:", error);
      res.status(500).json({ error: "Failed to update part model" });
    }
  });

  // Maintenance information update endpoint
  app.put("/api/parts/:id/maintenance", isCEOOrAdmin, async (req, res) => {
    try {
      const { locationInstructions, requiredTools, installTimeEstimates } = req.body;
      const part = await storage.updatePartMaintenance(req.params.id, {
        locationInstructions,
        requiredTools,
        installTimeEstimates,
      });
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, 
          { locationInstructions, requiredTools, installTimeEstimates }
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating maintenance info:", error);
      res.status(500).json({ error: "Failed to update maintenance information" });
    }
  });

  // Tutorial video upload endpoint
  app.post("/api/parts/:id/tutorial", upload.single('video'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      // Get the public object storage path
      const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
      if (!publicPath) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Save video to object storage
      await mkdir(join(publicPath, 'tutorials'), { recursive: true });
      const ext = file.originalname.split('.').pop();
      const filename = `${nanoid()}.${ext}`;
      const filePath = join(publicPath, 'tutorials', filename);
      
      await writeFile(filePath, file.buffer);
      const videoUrl = `/public/tutorials/${filename}`;

      // Update part with tutorial video URL
      const part = await storage.updatePartMaintenance(req.params.id, {
        tutorialVideoUrl: videoUrl,
      });
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      res.json(part);
    } catch (error) {
      console.error("Error uploading tutorial video:", error);
      res.status(500).json({ error: "Failed to upload tutorial video" });
    }
  });

  // Image upload endpoint for parts
  app.post("/api/parts/:id/images", upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Get the public object storage path
      const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
      if (!publicPath) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Save files to object storage
      const imageUrls: string[] = [];
      await mkdir(join(publicPath, 'parts'), { recursive: true });

      for (const file of files) {
        const ext = file.originalname.split('.').pop();
        const filename = `${nanoid()}.${ext}`;
        const filePath = join(publicPath, 'parts', filename);
        
        await writeFile(filePath, file.buffer);
        imageUrls.push(`/public/parts/${filename}`);
      }

      // Update part with new image URLs
      const part = await storage.addPartImages(req.params.id, imageUrls);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      res.json(part);
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });

  // Maintenance History endpoints
  // Mechanics
  app.get("/api/mechanics", async (req, res) => {
    try {
      const mechanics = await storage.getAllMechanics();
      res.json(mechanics);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      res.status(500).json({ error: "Failed to fetch mechanics" });
    }
  });

  app.get("/api/mechanics/:id", async (req, res) => {
    try {
      const mechanic = await storage.getMechanicById(req.params.id);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      res.json(mechanic);
    } catch (error) {
      console.error("Error fetching mechanic:", error);
      res.status(500).json({ error: "Failed to fetch mechanic" });
    }
  });

  app.post("/api/mechanics", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertMechanicSchema.parse(req.body);
      const mechanic = await storage.createMechanic(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'maintenance', mechanic.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(mechanic);
    } catch (error) {
      console.error("Error creating mechanic:", error);
      res.status(400).json({ error: "Invalid mechanic data" });
    }
  });

  app.put("/api/mechanics/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const mechanic = await storage.updateMechanic(req.params.id, req.body);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'maintenance', mechanic.id, req.user.username, req.body
        ));
      }
      
      res.json(mechanic);
    } catch (error) {
      console.error("Error updating mechanic:", error);
      res.status(400).json({ error: "Failed to update mechanic" });
    }
  });

  // Maintenance Records
  app.get("/api/equipment/:equipmentId/maintenance", async (req, res) => {
    try {
      const records = await storage.getMaintenanceRecordsByEquipment(req.params.equipmentId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ error: "Failed to fetch maintenance records" });
    }
  });

  app.get("/api/maintenance/:id", async (req, res) => {
    try {
      const record = await storage.getMaintenanceRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      res.status(500).json({ error: "Failed to fetch maintenance record" });
    }
  });

  app.post("/api/maintenance", isCEOOrAdmin, async (req, res) => {
    try {
      const { partsUsed, ...recordData } = req.body;
      
      // Validate maintenance record data
      const validatedRecord = insertMaintenanceRecordSchema.parse(recordData);
      const record = await storage.createMaintenanceRecord(validatedRecord);

      // Add parts if provided
      if (partsUsed && Array.isArray(partsUsed) && partsUsed.length > 0) {
        const validatedParts = partsUsed.map((part: any) => ({
          ...part,
          maintenanceRecordId: record.id,
        }));
        await storage.addPartsToMaintenance(record.id, validatedParts);
      }

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'maintenance', record.id, req.user.username, recordData
        ));
      }

      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(400).json({ error: "Invalid maintenance record data" });
    }
  });

  app.put("/api/maintenance/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const record = await storage.updateMaintenanceRecord(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'maintenance', record.id, req.user.username, req.body
        ));
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(400).json({ error: "Failed to update maintenance record" });
    }
  });

  // Parts Usage History
  app.get("/api/equipment/:equipmentId/parts-usage", async (req, res) => {
    try {
      const partsUsage = await storage.getPartsUsageByEquipment(req.params.equipmentId);
      res.json(partsUsage);
    } catch (error) {
      console.error("Error fetching parts usage:", error);
      res.status(500).json({ error: "Failed to fetch parts usage" });
    }
  });

  app.post("/api/maintenance/:maintenanceId/parts", isCEOOrAdmin, async (req, res) => {
    try {
      const parts = req.body.parts || [];
      const validatedParts = parts.map((part: any) => 
        insertPartsUsageHistorySchema.parse({
          ...part,
          maintenanceRecordId: req.params.maintenanceId,
        })
      );
      await storage.addPartsToMaintenance(req.params.maintenanceId, validatedParts);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'parts_usage', req.params.maintenanceId, req.user.username, { parts }
        ));
      }
      
      res.status(201).json({ message: "Parts added successfully" });
    } catch (error) {
      console.error("Error adding parts to maintenance:", error);
      res.status(400).json({ error: "Invalid parts data" });
    }
  });

  // Operating Behavior Reports
  app.get("/api/equipment/:equipmentId/operating-reports", async (req, res) => {
    try {
      const reports = await storage.getOperatingReportsByEquipment(req.params.equipmentId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching operating reports:", error);
      res.status(500).json({ error: "Failed to fetch operating reports" });
    }
  });

  app.post("/api/operating-reports", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertOperatingBehaviorReportSchema.parse(req.body);
      const report = await storage.createOperatingReport(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'operating_report', report.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating operating report:", error);
      res.status(400).json({ error: "Invalid operating report data" });
    }
  });

  // ============================================
  // GARAGE MANAGEMENT ROUTES
  // ============================================

  // Garages/Workshops
  app.get("/api/garages", async (req, res) => {
    try {
      const garages = await storage.getAllGarages();
      res.json(garages);
    } catch (error) {
      console.error("Error fetching garages:", error);
      res.status(500).json({ error: "Failed to fetch garages" });
    }
  });

  app.get("/api/garages/:id", async (req, res) => {
    try {
      const garage = await storage.getGarageById(req.params.id);
      if (!garage) {
        return res.status(404).json({ error: "Garage not found" });
      }
      res.json(garage);
    } catch (error) {
      console.error("Error fetching garage:", error);
      res.status(500).json({ error: "Failed to fetch garage" });
    }
  });

  app.post("/api/garages", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertGarageSchema.parse(req.body);
      const garage = await storage.createGarage(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'garage', garage.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(garage);
    } catch (error) {
      console.error("Error creating garage:", error);
      res.status(400).json({ error: "Invalid garage data" });
    }
  });

  app.put("/api/garages/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertGarageSchema.parse(req.body);
      const garage = await storage.updateGarage(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'garage', garage.id, req.user.username, validatedData
        ));
      }
      
      res.json(garage);
    } catch (error) {
      console.error("Error updating garage:", error);
      res.status(400).json({ error: "Failed to update garage" });
    }
  });

  // Repair Bays
  app.get("/api/garages/:garageId/bays", async (req, res) => {
    try {
      const bays = await storage.getRepairBaysByGarage(req.params.garageId);
      res.json(bays);
    } catch (error) {
      console.error("Error fetching repair bays:", error);
      res.status(500).json({ error: "Failed to fetch repair bays" });
    }
  });

  app.post("/api/repair-bays", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertRepairBaySchema.parse(req.body);
      const bay = await storage.createRepairBay(validatedData);
      res.status(201).json(bay);
    } catch (error) {
      console.error("Error creating repair bay:", error);
      res.status(400).json({ error: "Invalid repair bay data" });
    }
  });

  app.put("/api/repair-bays/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertRepairBaySchema.parse(req.body);
      const bay = await storage.updateRepairBay(req.params.id, validatedData);
      res.json(bay);
    } catch (error) {
      console.error("Error updating repair bay:", error);
      res.status(400).json({ error: "Failed to update repair bay" });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    try {
      const { role, garageId } = req.query;
      const employees = await storage.getAllEmployees(
        role as string | undefined, 
        garageId as string | undefined
      );
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'employee', employee.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ error: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'employee', employee.id, req.user.username, validatedData
        ));
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ error: "Failed to update employee" });
    }
  });

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const { status, assignedToId, garageId } = req.query;
      const workOrders = await storage.getAllWorkOrders({
        status: status as string | undefined,
        assignedToId: assignedToId as string | undefined,
        garageId: garageId as string | undefined,
      });
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrderById(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error fetching work order:", error);
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse({
        ...req.body,
        createdById: req.user?.id,
      });
      const workOrder = await storage.createWorkOrder(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'work_order', workOrder.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(400).json({ error: "Invalid work order data" });
    }
  });

  app.put("/api/work-orders/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(400).json({ error: "Failed to update work order" });
    }
  });

  // Standard Operating Procedures (SOPs)
  app.get("/api/sops", async (req, res) => {
    try {
      const { category, targetRole, language } = req.query;
      const sops = await storage.getAllSOPs({
        category: category as string | undefined,
        targetRole: targetRole as string | undefined,
        language: language as string | undefined,
      });
      res.json(sops);
    } catch (error) {
      console.error("Error fetching SOPs:", error);
      res.status(500).json({ error: "Failed to fetch SOPs" });
    }
  });

  app.get("/api/sops/:id", async (req, res) => {
    try {
      const sop = await storage.getSOPById(req.params.id);
      if (!sop) {
        return res.status(404).json({ error: "SOP not found" });
      }
      res.json(sop);
    } catch (error) {
      console.error("Error fetching SOP:", error);
      res.status(500).json({ error: "Failed to fetch SOP" });
    }
  });

  app.post("/api/sops", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertStandardOperatingProcedureSchema.parse(req.body);
      const sop = await storage.createSOP(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'sop', sop.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(sop);
    } catch (error) {
      console.error("Error creating SOP:", error);
      res.status(400).json({ error: "Invalid SOP data" });
    }
  });

  app.put("/api/sops/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertStandardOperatingProcedureSchema.parse(req.body);
      const sop = await storage.updateSOP(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'sop', sop.id, req.user.username, validatedData
        ));
      }
      
      res.json(sop);
    } catch (error) {
      console.error("Error updating SOP:", error);
      res.status(400).json({ error: "Failed to update SOP" });
    }
  });

  // Parts Storage Locations
  app.get("/api/parts/:partId/locations", async (req, res) => {
    try {
      const locations = await storage.getPartStorageLocations(req.params.partId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching part locations:", error);
      res.status(500).json({ error: "Failed to fetch part locations" });
    }
  });

  app.get("/api/garages/:garageId/parts-inventory", async (req, res) => {
    try {
      const inventory = await storage.getGaragePartsInventory(req.params.garageId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching garage inventory:", error);
      res.status(500).json({ error: "Failed to fetch garage inventory" });
    }
  });

  app.post("/api/parts-storage", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsStorageLocationSchema.parse(req.body);
      const location = await storage.createPartsStorageLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating parts storage location:", error);
      res.status(400).json({ error: "Invalid parts storage data" });
    }
  });

  app.put("/api/parts-storage/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsStorageLocationSchema.parse(req.body);
      const location = await storage.updatePartsStorageLocation(req.params.id, validatedData);
      res.json(location);
    } catch (error) {
      console.error("Error updating parts storage location:", error);
      res.status(400).json({ error: "Failed to update parts storage location" });
    }
  });

  // Equipment Location Tracking
  app.get("/api/equipment/:equipmentId/location-history", async (req, res) => {
    try {
      const history = await storage.getEquipmentLocationHistory(req.params.equipmentId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching location history:", error);
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  app.get("/api/equipment/:equipmentId/current-location", async (req, res) => {
    try {
      const location = await storage.getEquipmentCurrentLocation(req.params.equipmentId);
      res.json(location);
    } catch (error) {
      console.error("Error fetching current location:", error);
      res.status(500).json({ error: "Failed to fetch current location" });
    }
  });

  app.post("/api/equipment-locations", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentLocationSchema.parse(req.body);
      const location = await storage.createEquipmentLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating equipment location:", error);
      res.status(400).json({ error: "Invalid equipment location data" });
    }
  });

  app.put("/api/equipment-locations/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentLocationSchema.parse(req.body);
      const location = await storage.updateEquipmentLocation(req.params.id, validatedData);
      res.json(location);
    } catch (error) {
      console.error("Error updating equipment location:", error);
      res.status(400).json({ error: "Failed to update equipment location" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
