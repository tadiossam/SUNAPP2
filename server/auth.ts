import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import type { Express } from "express";
import session from "express-session";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { User } from "@shared/schema";

export function setupAuth(app: Express) {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "partfinder-ssc-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user has CEO role
export function isCEO(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === "CEO") {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO role required." });
}

// Middleware to check if user has CEO or Admin role
export function isCEOOrAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && (req.user?.role === "CEO" || req.user?.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Access denied. CEO or Admin role required." });
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, "password"> {}
  }
}
