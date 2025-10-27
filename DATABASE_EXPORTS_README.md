# PostgreSQL Database Exports
## Gelan Terminal Maintenance System

Generated: October 27, 2025

---

## Files Created

### 1. **PostgreSQL_Schema_Gelan_Terminal.sql** (55 KB, 1,794 lines)
**Database structure only - no data**

Contains:
- All 39 table definitions
- Primary keys, foreign keys, and constraints
- Indexes and unique constraints
- Column types and default values

**Use this when:**
- You need to recreate the database structure on a new server
- You want to review the schema design
- You need to share the database structure with developers

**Restore command:**
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f PostgreSQL_Schema_Gelan_Terminal.sql
```

---

### 2. **PostgreSQL_Data_Gelan_Terminal.sql** (2.9 MB, 7,445 lines)
**Data only - assumes schema already exists**

Contains:
- INSERT statements for all records
- Column-level inserts (safer and more readable)
- All data from all 39 tables

**Use this when:**
- The database structure already exists
- You only need to populate/restore data
- You're moving data between environments with the same schema

**Restore command:**
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f PostgreSQL_Data_Gelan_Terminal.sql
```

---

### 3. **PostgreSQL_Full_Backup_Gelan_Terminal.sql** (2.9 MB, 9,213 lines)
**Complete backup - schema + data**

Contains:
- Everything from both files above
- Complete database structure
- All data with INSERT statements
- Ready for full database restoration

**Use this when:**
- You need a complete database backup
- You're setting up a new server from scratch
- You want a single file for disaster recovery

**Restore command:**
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f PostgreSQL_Full_Backup_Gelan_Terminal.sql
```

---

## Database Statistics

**Total Tables:** 39

### Main Tables (by data size):
1. **inspection_checklist_items** - 1.7 MB (largest table)
2. **equipment** - 160 KB
3. **employees** - 152 KB
4. **spare_parts** - 136 KB
5. **work_orders** - 104 KB
6. **approvals** - 64 KB
7. **equipment_locations** - 56 KB
8. **equipment_receptions** - 48 KB

### Complete Table List:
```
approvals                      garages
attendance_device_settings     inspection_checklist_items
d365_sync_logs                 items
damage_reports                 maintenance_records
device_import_logs             mechanics
dynamics365_settings           operating_behavior_reports
employees                      part_compatibility
equipment                      parts_requests
equipment_categories           parts_storage_locations
equipment_inspections          parts_usage_history
equipment_locations            reception_checklists
equipment_parts_compatibility  reception_inspection_items
equipment_receptions           reorder_rules
                               repair_estimates
                               spare_parts
                               standard_operating_procedures
                               stock_ledger
                               stock_reservations
                               system_settings
                               users
                               warehouse_zones
                               warehouses
                               work_order_required_parts
                               work_orders
                               workshop_members
                               workshops
```

---

## Restoration Instructions

### Full Database Restore (New Server):
```bash
# 1. Create empty database
createdb -h YOUR_HOST -U YOUR_USER gelan_maintenance

# 2. Restore everything
psql -h YOUR_HOST -U YOUR_USER -d gelan_maintenance -f PostgreSQL_Full_Backup_Gelan_Terminal.sql
```

### Schema Only Restore:
```bash
# Restore just the structure
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f PostgreSQL_Schema_Gelan_Terminal.sql
```

### Data Only Restore (existing schema):
```bash
# Restore just the data (schema must exist)
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f PostgreSQL_Data_Gelan_Terminal.sql
```

---

## Important Notes

### Foreign Keys & Constraints
All foreign key relationships are preserved:
- equipment → equipment_categories
- employees → garages
- work_orders → equipment, garages, employees
- equipment_receptions → equipment, employees
- And many more...

### Data Integrity
- All UUIDs preserved
- Timestamps maintain original values
- Relationships maintained with proper foreign keys
- Unique constraints enforced

### Character Encoding
- All files use UTF8 encoding
- Safe for Amharic and English text
- No data loss on international characters

---

## Security Recommendations

1. **Store Securely:** These files contain your complete database - keep them safe!
2. **Version Control:** Consider adding to your private Git repository
3. **Regular Backups:** Run exports regularly (weekly or daily)
4. **Test Restores:** Periodically test restoration to ensure backups work

---

## Quick Backup Command (For Future Use)

Add to your batch files for regular backups:

```batch
@echo off
SET TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET TIMESTAMP=%TIMESTAMP: =0%

pg_dump %DATABASE_URL% --no-owner --no-acl --column-inserts > "backup_%TIMESTAMP%.sql"

echo Backup created: backup_%TIMESTAMP%.sql
pause
```

---

*Generated automatically from your PostgreSQL database at 192.168.0.34:5432*
