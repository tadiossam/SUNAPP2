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

  const httpServer = createServer(app);

  return httpServer;
}
