#!/bin/bash

# Database Import Script for AlloCare Medical System
# This script imports a database dump into PostgreSQL container

set -e  # Exit on error

echo "================================================"
echo "AlloCare Database Import Tool"
echo "================================================"

# Configuration
CONTAINER_NAME="medical_postgres"
DATABASE_NAME="medical_db"
DATABASE_USER="medical_user"
DATABASE_PASSWORD="medical_password"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for input file
if [ $# -eq 0 ]; then
    # Try to use latest dump if no argument provided
    DEFAULT_FILE="./backend/src/database/seed/latest_dump.sql"
    if [ -f "$DEFAULT_FILE" ]; then
        SQL_FILE="$DEFAULT_FILE"
        echo -e "${BLUE}Using latest dump: $SQL_FILE${NC}"
    else
        echo -e "${RED}Error: No SQL file specified${NC}"
        echo "Usage: $0 <sql_file>"
        echo "   or: $0  (uses latest_dump.sql if exists)"
        echo ""
        echo "Example: $0 ./backend/src/database/seed/database_dump_20240101_120000.sql"
        exit 1
    fi
else
    SQL_FILE="$1"
fi

# Check if file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: File '$SQL_FILE' not found${NC}"
    exit 1
fi

# Check if container is running
echo -e "\n${YELLOW}Checking PostgreSQL container...${NC}"
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: PostgreSQL container '$CONTAINER_NAME' is not running${NC}"
    echo "Starting the container..."
    cd backend && docker-compose up -d postgres
    echo "Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Get file info
FILE_SIZE=$(ls -lh "$SQL_FILE" | awk '{print $5}')
echo -e "${BLUE}Import file: $SQL_FILE${NC}"
echo -e "${BLUE}File size: $FILE_SIZE${NC}"

# Warning
echo -e "\n${YELLOW}⚠️  WARNING: This will replace ALL data in the database!${NC}"
echo -e "${YELLOW}Current data will be permanently deleted.${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Import cancelled."
    exit 0
fi

# Import database
echo -e "\n${YELLOW}Importing database...${NC}"
echo "This may take a moment depending on file size..."

# First, drop existing connections to the database
echo -e "${YELLOW}Dropping existing connections...${NC}"
docker exec -t $CONTAINER_NAME psql -U $DATABASE_USER -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DATABASE_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Import the SQL file
cat "$SQL_FILE" | docker exec -i $CONTAINER_NAME psql -U $DATABASE_USER -d postgres

# Check if import was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Database imported successfully!${NC}"
    
    # Show some statistics
    echo -e "\n${YELLOW}Verifying import...${NC}"
    
    # Count records in main tables
    echo -e "${BLUE}Database statistics:${NC}"
    
    docker exec -t $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "
    SELECT 
        'Organizations' as table_name, COUNT(*) as count FROM organizations
    UNION ALL
    SELECT 'Users', COUNT(*) FROM users
    UNION ALL
    SELECT 'Patients', COUNT(*) FROM patients
    UNION ALL
    SELECT 'Consultations', COUNT(*) FROM consultations
    UNION ALL
    SELECT 'Prescriptions', COUNT(*) FROM prescriptions
    ORDER BY table_name;" 2>/dev/null | grep -E '^\s*(Organizations|Users|Patients|Consultations|Prescriptions)' || true
    
    echo -e "\n${GREEN}✓ Import complete!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Restart the backend: cd backend && docker-compose restart app"
    echo "2. Test login with: admin@saintmary.com / Admin123!"
    echo "3. Check the application at: http://localhost:4200"
else
    echo -e "${RED}✗ Database import failed${NC}"
    echo -e "${YELLOW}Check the error messages above for details${NC}"
    exit 1
fi

echo -e "\n================================================"
echo "Import complete!"
echo "================================================"