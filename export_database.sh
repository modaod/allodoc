#!/bin/bash

# Database Export Script for AlloCare Medical System
# This script exports the current database state to a SQL file

set -e  # Exit on error

echo "================================================"
echo "AlloCare Database Export Tool"
echo "================================================"

# Configuration
CONTAINER_NAME="medical_postgres"
DATABASE_NAME="medical_db"
DATABASE_USER="medical_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./backend/src/database/seed"
OUTPUT_FILE="${OUTPUT_DIR}/database_dump_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if container is running
echo -e "\n${YELLOW}Checking PostgreSQL container...${NC}"
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: PostgreSQL container '$CONTAINER_NAME' is not running${NC}"
    echo "Please start the container with: docker-compose up -d postgres"
    exit 1
fi

# Create output directory if it doesn't exist
echo -e "${YELLOW}Creating output directory...${NC}"
mkdir -p $OUTPUT_DIR

# Export database
echo -e "\n${YELLOW}Exporting database...${NC}"
echo "This may take a moment depending on database size..."

docker exec -t $CONTAINER_NAME pg_dump \
    -U $DATABASE_USER \
    -d $DATABASE_NAME \
    --verbose \
    --no-owner \
    --no-acl \
    --if-exists \
    --clean \
    --create \
    --encoding=UTF8 \
    > $OUTPUT_FILE

# Check if export was successful
if [ $? -eq 0 ]; then
    FILE_SIZE=$(ls -lh $OUTPUT_FILE | awk '{print $5}')
    echo -e "\n${GREEN}✓ Database exported successfully!${NC}"
    echo -e "File: ${GREEN}$OUTPUT_FILE${NC}"
    echo -e "Size: ${GREEN}$FILE_SIZE${NC}"
    
    # Create a latest symlink for convenience
    LATEST_LINK="${OUTPUT_DIR}/latest_dump.sql"
    ln -sf $(basename $OUTPUT_FILE) $LATEST_LINK
    echo -e "\nLatest dump symlink: ${GREEN}$LATEST_LINK${NC}"
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Share the file: $OUTPUT_FILE"
    echo "2. Or commit it to git (if not too large):"
    echo "   git add $OUTPUT_FILE"
    echo "   git commit -m 'Add database dump'"
    echo "3. Team member can import using: ./import_database.sh"
else
    echo -e "${RED}✗ Database export failed${NC}"
    exit 1
fi

echo -e "\n================================================"
echo "Export complete!"
echo "================================================"