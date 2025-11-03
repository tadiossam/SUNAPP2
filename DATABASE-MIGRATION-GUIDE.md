# Database Migration Guide
## Gelan Terminal Maintenance System

This guide explains how to safely manage database schema updates for your local PostgreSQL database.

---

## RECOMMENDED: Migration Files Method

The safest way to update your database is to generate SQL migration files that you can review before applying.

### **Why use migration files?**
- You can review the exact SQL changes before they run
- You have a record of all schema changes over time
- You can share migrations with team members via Git
- You can roll back if something goes wrong
- No risk of accidental data loss

### **How to use migration files:**

1. **Generate migration SQL files:**
   - Double-click: `GENERATE-MIGRATION.bat`
   - This creates SQL files in the `migrations/` folder

2. **Review the SQL files:**
   - Open the newly created `.sql` file in `migrations/`
   - Verify the changes are what you expect
   - Look for any DROP statements that might delete data

3. **Apply the migration:**
   - Double-click: `APPLY-MIGRATIONS.bat`
   - This runs the SQL against your database

4. **Done!** Your database is safely updated.

---

## ALTERNATIVE: Quick Sync (Advanced Users Only)

**File:** `UPDATE-DATABASE-SCHEMA.bat`

### **WARNING:**
This method directly syncs your database without review. It is ONLY safe for simple additive changes like:
- Adding new tables
- Adding new columns
- Adding indexes

This method is NOT safe for:
- Changing column types
- Renaming columns or tables
- Deleting columns
- Changing constraints

**These changes can cause data loss!**

### **When to use quick sync:**
- Only for simple additive changes
- Only if you're confident about what's changing
- Only on development databases (never production)
- Only if you have a recent backup

### **How to use quick sync:**
1. Make changes to `shared/schema.ts`
2. Double-click: `UPDATE-DATABASE-SCHEMA.bat`
3. Confirm you understand the risks
4. Done (if successful)

---

## Folder Structure

```
SUNAPP2/
├── migrations/               ← SQL migration files (recommended method)
│   ├── 0000_initial.sql
│   ├── 0001_add_users_updated.sql
│   └── meta/                 ← Migration metadata
│       └── _journal.json
├── shared/
│   └── schema.ts             ← Your database schema (edit this)
├── GENERATE-MIGRATION.bat    ← Step 1: Generate SQL files
├── APPLY-MIGRATIONS.bat      ← Step 2: Apply SQL files
└── UPDATE-DATABASE-SCHEMA.bat← Quick sync (advanced, use with caution)
```

---

## Complete Workflow Example

### Scenario: You added a new column to `employees` table

**Step 1: Edit your schema**
```typescript
// shared/schema.ts
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  newColumn: text("new_column"), // ← You added this
  // ... other columns
});
```

**Step 2: Generate migration**
```
Double-click: GENERATE-MIGRATION.bat
```

This creates a new file like `migrations/0001_add_new_column.sql`:
```sql
ALTER TABLE "employees" ADD COLUMN "new_column" text;
```

**Step 3: Review the SQL**
- Open `migrations/0001_add_new_column.sql`
- Verify it's doing what you expect
- Check for any DROP statements

**Step 4: Apply the migration**
```
Double-click: APPLY-MIGRATIONS.bat
```

**Done!** Your database now has the new column, and you have a SQL file record of the change.

---

## Important Safety Notes

1. **Always backup before major changes:**
   - Use pgAdmin or DBeaver to export your database
   - Store backups in a safe location
   - Test restoring backups periodically

2. **Review SQL before applying:**
   - Migration files show you exactly what will change
   - Look for DROP TABLE, DROP COLUMN, or ALTER TYPE statements
   - These can cause permanent data loss

3. **Never manually edit migration files:**
   - Let Drizzle generate them automatically
   - Manual edits can cause sync issues

4. **Commit migrations to Git:**
   - Store migration files in version control
   - Team members can apply the same changes
   - You have a history of all schema changes

5. **Understanding --force flag:**
   - `npm run db:push -- --force` bypasses safety checks
   - It can DROP tables and columns without warning
   - Only use after reviewing changes and backing up data
   - Required for breaking changes like column type changes

---

## Troubleshooting

### Problem: "Column already exists" error
**Solution:** The migration has already been applied. No action needed.

### Problem: Quick sync fails with breaking changes
**Solution:**
1. Use the migration files method instead
2. Run `GENERATE-MIGRATION.bat`
3. Review the SQL carefully
4. Run `APPLY-MIGRATIONS.bat`

### Problem: Need to undo a schema change
**Solution:** 
1. Revert your changes in `shared/schema.ts`
2. Run `GENERATE-MIGRATION.bat` to create a reverse migration
3. Review and apply it

### Problem: Migration fails to apply
**Solution:**
1. Check error message for details
2. Verify database connection
3. Check for data that conflicts with new schema
4. Consider manual intervention or data migration

---

## Database Configuration

- **Connection:** Configured via `DATABASE_URL` environment variable
- **Type:** PostgreSQL (Neon-backed)
- **Management Tools:** pgAdmin or DBeaver
- **Port:** 5432 (default PostgreSQL port)

---

## Best Practices Summary

1. **Use migration files as default** - Review before applying
2. **Backup before major changes** - Especially before DROP operations
3. **Test migrations locally first** - Verify they work as expected
4. **Commit migrations to Git** - Track schema evolution
5. **Avoid quick sync for breaking changes** - Too risky
6. **Document complex migrations** - Add comments explaining why
7. **Keep migrations small** - One logical change per migration

---

## Method Comparison

| Feature | Migration Files | Quick Sync |
|---------|----------------|------------|
| Safety | High - review before applying | Low - no review |
| Speed | Slower (2 steps) | Faster (1 step) |
| Recommended for | All changes | Additive changes only |
| Version control | Yes | No |
| Team collaboration | Yes | No |
| Risk of data loss | Low (with review) | High (without review) |
| Use when | Any schema change | Simple column additions only |

**Default recommendation: Always use migration files for safety and traceability.**

---

*Last Updated: October 27, 2025*
