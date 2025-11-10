import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { employees } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { User, Employee } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "partfinder-ssc-secret-key";

// JWT payload interface
interface JWTPayload {
  id: string;
  username: string;
  role: string;
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    username: user.username || '',
    role: user.role || 'user',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Verify user credentials - checks employees table only
export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  // Check employees table
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.username, username))
    .limit(1);

  if (!employee || !employee.password || !employee.username) {
    return null;
  }

  const isValid = await bcrypt.compare(password, employee.password);
  if (!isValid) {
    return null;
  }

  // Convert employee to User-like structure for authentication
  return {
    id: employee.id,
    username: employee.username || '',
    password: employee.password || '',
    fullName: employee.fullName,
    role: employee.role || 'user',
    language: employee.language || 'en',
    createdAt: employee.createdAt,
  } as User;
}

// Middleware to extract and verify JWT from Authorization header
export async function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    req.user = null;
    return next();
  }

  // Fetch full user from employees table
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, payload.id))
    .limit(1);

  if (employee && employee.username && employee.password) {
    // Convert employee to User-like structure
    req.user = {
      id: employee.id,
      username: employee.username || '',
      password: employee.password || '',
      fullName: employee.fullName,
      role: employee.role || 'user',
      language: employee.language || 'en',
      createdAt: employee.createdAt,
    } as User;
  } else {
    req.user = null;
  }

  next();
}

export function setupAuth(app: Express) {
  // Add JWT authentication middleware to all routes
  app.use(authenticateToken);
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user has CEO role
export function isCEO(req: any, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (role === "ceo") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO role required." });
}

// Middleware to check if user has CEO or Admin role
export function isCEOOrAdmin(req: any, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (role === "ceo" || role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO or Admin role required." });
}

// Middleware to check if user has CEO, Admin, or Supervisor role (for approvals)
export function canApprove(req: any, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (role === "ceo" || role === "admin" || role === "supervisor") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO, Admin, or Supervisor role required." });
}

// Cost entry middleware - Supervisor and CEO only (admin explicitly excluded)
// Used for cost tracking endpoints where admin should NOT have universal access
export function isSupervisorOrCEO(req: any, res: Response, next: NextFunction) {
  const role = req.user?.role?.toLowerCase();
  if (role === "supervisor" || role === "ceo") {
    return next();
  }
  res.status(403).json({ 
    message: "Access denied. Cost entry is restricted to supervisors (foremen) and CEO only." 
  });
}

// Helper function to check if user has a specific role (case-insensitive)
// Admin role ALWAYS returns true (full access)
export function hasRole(user: any, ...allowedRoles: string[]): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role.toLowerCase();
  
  // Admin has full access to everything
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if user has any of the allowed roles (case-insensitive)
  return allowedRoles.some(role => userRole === role.toLowerCase());
}

// Middleware factory to check for specific roles (admin always has access)
export function requireRole(...allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (hasRole(req.user, ...allowedRoles)) {
      return next();
    }
    
    res.status(403).json({ 
      message: `Access denied. Required role(s): ${allowedRoles.join(', ')} (or admin for full access)` 
    });
  };
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password"> | null;
    }
  }
}
