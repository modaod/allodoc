# Database Sharing Guide for AlloCare Team

This guide explains how to share the current database state between team members.

## For the Person EXPORTING Data (You)

### Step 1: Export Your Current Database

1. Copy the export script to your project root:
```bash
cp /tmp/export_database.sh ./export_database.sh
chmod +x ./export_database.sh
```

2. Run the export:
```bash
./export_database.sh
```

This creates a dump file at: `backend/src/database/seed/database_dump_[timestamp].sql`

### Step 2: Share the Dump File

#### Option A: Via Git (Recommended for small databases)
```bash
git add backend/src/database/seed/latest_dump.sql
git commit -m "Add database dump for team development"
git push
```

#### Option B: Via Cloud Storage (for large databases)
Upload the file to Google Drive, Dropbox, or any file sharing service and share the link.

## For the Person IMPORTING Data (Your Team Member)

### Prerequisites
1. Pull the latest code:
```bash
git pull
```

2. Make sure Docker containers are running:
```bash
cd backend
docker-compose up -d postgres
```

### Step 1: Get the Import Script

1. Copy the import script to your project root:
```bash
cp /tmp/import_database.sh ./import_database.sh
chmod +x ./import_database.sh
```

Or create it manually with this content:

```bash
#!/bin/bash
# Save this as import_database.sh

set -e

CONTAINER_NAME="medical_postgres"
DATABASE_NAME="medical_db"
DATABASE_USER="medical_user"

# Use latest dump by default
SQL_FILE="${1:-./backend/src/database/seed/latest_dump.sql}"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: File '$SQL_FILE' not found"
    exit 1
fi

echo "Importing database from: $SQL_FILE"
echo "WARNING: This will replace ALL data in the database!"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    exit 0
fi

# Import the database
cat "$SQL_FILE" | docker exec -i $CONTAINER_NAME psql -U $DATABASE_USER -d postgres

echo "✓ Database imported successfully!"
echo "Restart the backend: docker-compose restart app"
```

### Step 2: Import the Database

```bash
# If you pulled from git (uses latest_dump.sql automatically)
./import_database.sh

# Or specify a specific dump file
./import_database.sh backend/src/database/seed/database_dump_20250822_005531.sql
```

### Step 3: Restart Services

```bash
cd backend
docker-compose restart app
```

### Step 4: Verify

1. Test login at http://localhost:4200 with:
   - Email: `admin@saintmary.com`
   - Password: `Admin123!`

2. Check that you can see the data (patients, consultations, etc.)

## Current Database Statistics

As of the last export, the database contains:
- 3 Organizations
- 16 Users
- 15 Patients
- 30 Consultations
- 29 Prescriptions
- 2 Appointments

## Troubleshooting

### "Container not running" error
```bash
cd backend
docker-compose up -d postgres
# Wait 10 seconds for PostgreSQL to start
```

### "Permission denied" error
```bash
chmod +x ./import_database.sh
chmod +x ./export_database.sh
```

### "Database does not exist" error
The import script handles database creation automatically.

### Reset to Empty Database
If you need to start fresh:
```bash
docker-compose down -v  # This removes volumes
docker-compose up -d
```

## Important Notes

1. **Data Privacy**: Make sure not to share production data or sensitive patient information
2. **File Size**: Database dumps can be large. Use cloud storage for files > 10MB
3. **Compatibility**: Both team members should use the same Docker setup
4. **Backup**: Always backup your current database before importing new data

## Scripts Location

For convenience, save these scripts in your project:
- Export script: `/tmp/export_database.sh`
- Import script: `/tmp/import_database.sh`
- Latest dump: `backend/src/database/seed/latest_dump.sql`