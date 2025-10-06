import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { User } from "@shared/schema";

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
    username: user.username,
    role: user.role,
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

// Verify user credentials
export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
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

  // Fetch full user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1);

  req.user = user || null;
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
  if (req.user?.role === "CEO") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO role required." });
}

// Middleware to check if user has CEO or Admin role
export function isCEOOrAdmin(req: any, res: Response, next: NextFunction) {
  if (req.user?.role === "CEO" || req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO or Admin role required." });
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password"> | null;
    }
  }
}
