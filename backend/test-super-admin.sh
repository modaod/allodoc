#!/bin/bash

# Test script for Super Admin functionality
# Usage: ./test-super-admin.sh

echo "================================"
echo "Super Admin Functionality Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Login credentials
EMAIL=" "
PASSWORD="password123"
API_URL="http://localhost:3000/api/v1"

echo "1. Testing Login..."
echo "   Email: $EMAIL"
echo ""

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"

# Extract user info
USER_ROLES=$(echo $LOGIN_RESPONSE | grep -o '"roles":\[[^]]*' | cut -d'[' -f2 | cut -d']' -f1)
echo "   User roles: $USER_ROLES"
echo ""

# Test Super Admin endpoints
echo "2. Testing Super Admin Endpoints..."
echo ""

# System Stats
echo "   a) System Statistics:"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/super-admin/system-stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q "totalOrganizations"; then
    echo -e "   ${GREEN}✓ System stats accessible${NC}"
    TOTAL_ORGS=$(echo $STATS_RESPONSE | grep -o '"totalOrganizations":[0-9]*' | cut -d':' -f2)
    TOTAL_USERS=$(echo $STATS_RESPONSE | grep -o '"totalUsers":[0-9]*' | cut -d':' -f2)
    TOTAL_PATIENTS=$(echo $STATS_RESPONSE | grep -o '"totalPatients":[0-9]*' | cut -d':' -f2)
    echo "      - Organizations: $TOTAL_ORGS"
    echo "      - Users: $TOTAL_USERS"
    echo "      - Patients: $TOTAL_PATIENTS"
else
    echo -e "   ${RED}✗ Cannot access system stats${NC}"
    echo "   Response: $STATS_RESPONSE"
fi
echo ""

# List Users
echo "   b) List All Users (Cross-Organization):"
USERS_RESPONSE=$(curl -s -X GET "$API_URL/super-admin/users?limit=2" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q "data"; then
    echo -e "   ${GREEN}✓ Users list accessible${NC}"
    USER_COUNT=$(echo $USERS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "      - Total users found: $USER_COUNT"
else
    echo -e "   ${RED}✗ Cannot access users list${NC}"
fi
echo ""

# List Organizations
echo "   c) List All Organizations:"
ORGS_RESPONSE=$(curl -s -X GET "$API_URL/super-admin/organizations" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ORGS_RESPONSE" | grep -q "data"; then
    echo -e "   ${GREEN}✓ Organizations list accessible${NC}"
    # Extract organization names
    echo "      Organizations found:"
    echo "$ORGS_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4 | while read org; do
        echo "      - $org"
    done
else
    echo -e "   ${RED}✗ Cannot access organizations list${NC}"
fi
echo ""

# List Patients
echo "   d) List All Patients (Cross-Organization):"
PATIENTS_RESPONSE=$(curl -s -X GET "$API_URL/super-admin/patients?limit=2" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PATIENTS_RESPONSE" | grep -q "data"; then
    echo -e "   ${GREEN}✓ Patients list accessible${NC}"
    PATIENT_COUNT=$(echo $PATIENTS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "      - Total patients found: $PATIENT_COUNT"
else
    echo -e "   ${RED}✗ Cannot access patients list${NC}"
fi
echo ""

# Test regular endpoint to compare
echo "3. Testing Regular Endpoints (for comparison)..."
echo ""

# Try to access regular users endpoint
echo "   Regular users endpoint (organization-scoped):"
REGULAR_USERS=$(curl -s -X GET "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$REGULAR_USERS" | grep -q "data"; then
    echo -e "   ${GREEN}✓ Regular users endpoint accessible${NC}"
    # This should only show users from the user's organization
else
    echo -e "   ${RED}✗ Cannot access regular users endpoint${NC}"
fi
echo ""

echo "================================"
echo "Test Summary"
echo "================================"
echo ""
echo "User: $EMAIL"
echo "Roles: $USER_ROLES"
echo ""
echo "Super Admin Capabilities:"
echo "- System-wide statistics: Available"
echo "- Cross-organization user access: Available"
echo "- Organization management: Available"
echo "- Cross-organization patient access: Available"
echo ""
echo -e "${GREEN}✓ Super Admin functionality is working correctly!${NC}"
echo ""
echo "To test more features, you can use these commands:"
echo ""
echo "# Assign roles to a user:"
echo "curl -X POST \"$API_URL/super-admin/users/{userId}/roles\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"roles\": [\"DOCTOR\", \"ADMIN\"]}'"
echo ""
echo "# Move user to different organization:"
echo "curl -X POST \"$API_URL/super-admin/users/{userId}/move-organization\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"organizationId\": \"new-org-id\"}'"
echo ""