# Running the App on Windows with SQL Server

## Step 1: Install Required Packages

In your app folder, run:

```cmd
npm install mssql tedious
npm install --save-dev @types/mssql
```

## Step 2: Update server/db.ts

Replace the contents of `server/db.ts` with:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// For SQL Server, you'll need to use a different approach
// Option 1: Use Better-SQLite3 (local file database - easiest for testing)
// Option 2: Use node-postgres with pg library (what we have now)
// Option 3: Create SQL Server adapter

// For now, if you want SQL Server, you need to:
// 1. Use the connection string format for your SQL Server
// 2. Update this file to use mssql driver

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export { pool };
```

## Step 3: Create .env File

Create a file called `.env` in your app folder with:

```env
# SQL Server Connection String
DATABASE_URL=Server=localhost;Database=GelanTerminal;User Id=sa;Password=YourPassword;Encrypt=true;TrustServerCertificate=true

# Session Secret
SESSION_SECRET=your-super-secret-random-key-here

# Port
PORT=5000
```

**Replace:**
- `localhost` with your SQL Server address
- `sa` with your SQL Server username
- `YourPassword` with your SQL Server password

## Step 4: Run the App

```cmd
npm run dev
```

Open browser: http://localhost:5000

Login with:
- Username: ceo
- Password: ceo123

OR

- Username: admin
- Password: admin123

---

## ⚠️ Important Note About SQL Server Support

The app currently uses Drizzle ORM with PostgreSQL driver. To fully support SQL Server, you would need to:

1. Change from `drizzle-orm/neon-serverless` to `drizzle-orm/better-sqlite3` or create a SQL Server adapter
2. This requires code changes in the database layer

**Easier Alternative:**
Run PostgreSQL locally on Windows instead of SQL Server:
1. Download PostgreSQL for Windows: https://www.postgresql.org/download/windows/
2. Import your data to PostgreSQL
3. App works without code changes
