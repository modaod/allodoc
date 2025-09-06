#!/bin/bash

# OWASP Dependency Check Script for AlloDoc
# This script runs comprehensive security checks on project dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}     AlloDoc Security Dependency Check           ${NC}"
echo -e "${GREEN}==================================================${NC}"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run npm audit
run_npm_audit() {
    local project=$1
    local path=$2
    
    echo -e "\n${YELLOW}Running npm audit for $project...${NC}"
    cd "$path"
    
    # Generate JSON report
    npm audit --json > "$REPORT_DIR/${project}_npm_audit_${TIMESTAMP}.json" 2>/dev/null || true
    
    # Generate human-readable report
    echo "NPM Audit Report for $project" > "$REPORT_DIR/${project}_npm_audit_${TIMESTAMP}.txt"
    echo "Generated: $(date)" >> "$REPORT_DIR/${project}_npm_audit_${TIMESTAMP}.txt"
    echo "----------------------------------------" >> "$REPORT_DIR/${project}_npm_audit_${TIMESTAMP}.txt"
    npm audit >> "$REPORT_DIR/${project}_npm_audit_${TIMESTAMP}.txt" 2>&1 || true
    
    # Check for vulnerabilities
    local vulns=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")
    
    if [ "$vulns" -gt 0 ]; then
        echo -e "${RED}Found $vulns vulnerabilities in $project${NC}"
        
        # Get vulnerability breakdown
        local critical=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
        local high=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.high' 2>/dev/null || echo "0")
        local moderate=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.moderate' 2>/dev/null || echo "0")
        local low=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.low' 2>/dev/null || echo "0")
        
        echo "  Critical: $critical"
        echo "  High: $high"
        echo "  Moderate: $moderate"
        echo "  Low: $low"
    else
        echo -e "${GREEN}No vulnerabilities found in $project${NC}"
    fi
}

# Function to check for outdated packages
check_outdated() {
    local project=$1
    local path=$2
    
    echo -e "\n${YELLOW}Checking for outdated packages in $project...${NC}"
    cd "$path"
    
    npm outdated > "$REPORT_DIR/${project}_outdated_${TIMESTAMP}.txt" 2>&1 || true
    
    local outdated_count=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
    
    if [ "$outdated_count" -gt 0 ]; then
        echo -e "${YELLOW}Found $outdated_count outdated packages in $project${NC}"
    else
        echo -e "${GREEN}All packages are up to date in $project${NC}"
    fi
}

# Function to check for known vulnerable packages
check_vulnerable_packages() {
    local project=$1
    local path=$2
    
    echo -e "\n${YELLOW}Checking for known vulnerable packages in $project...${NC}"
    cd "$path"
    
    # Check for commonly vulnerable packages
    local vulnerable_packages=(
        "minimist<1.2.6"
        "lodash<4.17.21"
        "axios<0.21.1"
        "node-forge<1.3.0"
        "jsonwebtoken<9.0.0"
        "express<4.17.3"
    )
    
    echo "Vulnerable Package Check for $project" > "$REPORT_DIR/${project}_vulnerable_check_${TIMESTAMP}.txt"
    
    for pkg in "${vulnerable_packages[@]}"; do
        pkg_name=$(echo "$pkg" | cut -d'<' -f1)
        if grep -q "\"$pkg_name\"" package.json; then
            installed_version=$(npm list "$pkg_name" --depth=0 2>/dev/null | grep "$pkg_name@" | cut -d'@' -f2 || echo "unknown")
            echo "Checking $pkg_name (installed: $installed_version)" >> "$REPORT_DIR/${project}_vulnerable_check_${TIMESTAMP}.txt"
        fi
    done
}

# Function to run OWASP Dependency Check (if available)
run_owasp_check() {
    echo -e "\n${YELLOW}Setting up OWASP Dependency Check...${NC}"
    
    # Check if dependency-check is installed
    if command_exists dependency-check; then
        echo -e "${GREEN}OWASP Dependency Check found, running scan...${NC}"
        
        dependency-check \
            --project "AlloDoc" \
            --scan "$PROJECT_ROOT" \
            --out "$REPORT_DIR" \
            --format "ALL" \
            --suppression "$SCRIPT_DIR/suppression.xml" 2>/dev/null || true
    else
        echo -e "${YELLOW}OWASP Dependency Check not installed.${NC}"
        echo "To install: https://owasp.org/www-project-dependency-check/"
        
        # Alternative: Use retire.js for JavaScript vulnerability scanning
        if command_exists retire; then
            echo -e "${GREEN}Using retire.js as alternative...${NC}"
            retire --path "$PROJECT_ROOT" --outputformat json --outputpath "$REPORT_DIR/retire_${TIMESTAMP}.json" || true
        else
            echo "Consider installing retire.js: npm install -g retire"
        fi
    fi
}

# Function to check for secrets in code
check_secrets() {
    echo -e "\n${YELLOW}Checking for secrets in code...${NC}"
    
    # Common patterns to check
    local secret_patterns=(
        "password.*=.*['\"].*['\"]"
        "api[_-]?key.*=.*['\"].*['\"]"
        "secret.*=.*['\"].*['\"]"
        "token.*=.*['\"].*['\"]"
        "AWS.*=.*['\"].*['\"]"
        "jwt.*=.*['\"].*['\"]"
    )
    
    echo "Secret Scan Report" > "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"
    echo "Generated: $(date)" >> "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"
    echo "----------------------------------------" >> "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"
    
    for pattern in "${secret_patterns[@]}"; do
        echo -e "\nChecking pattern: $pattern" >> "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"
        grep -r -i -n "$pattern" "$PROJECT_ROOT" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=dist \
            --exclude-dir=coverage \
            --exclude="*.log" \
            --exclude="*.lock" >> "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt" 2>/dev/null || true
    done
    
    # Check for .env files that shouldn't be committed
    if find "$PROJECT_ROOT" -name ".env*" -not -path "*/node_modules/*" | grep -q .; then
        echo -e "${YELLOW}Warning: Found .env files in project${NC}"
        find "$PROJECT_ROOT" -name ".env*" -not -path "*/node_modules/*" >> "$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"
    fi
}

# Function to generate summary report
generate_summary() {
    echo -e "\n${GREEN}Generating summary report...${NC}"
    
    local summary_file="$REPORT_DIR/security_summary_${TIMESTAMP}.md"
    
    cat > "$summary_file" << EOF
# Security Dependency Check Summary

**Date:** $(date)
**Project:** AlloDoc Medical Management System

## Executive Summary

This report provides a comprehensive security analysis of the AlloDoc project dependencies and codebase.

## NPM Audit Results

### Backend
$(cd "$PROJECT_ROOT/backend" && npm audit 2>/dev/null | head -20 || echo "No data available")

### Frontend
$(cd "$PROJECT_ROOT/frontend" && npm audit 2>/dev/null | head -20 || echo "No data available")

## Recommendations

### Critical Actions
1. Update all packages with critical vulnerabilities
2. Review and update authentication dependencies
3. Implement automated security scanning in CI/CD

### Medium Priority
1. Update packages with moderate vulnerabilities
2. Review outdated packages for potential security issues
3. Implement dependency update policies

### Low Priority
1. Monitor low-severity vulnerabilities
2. Plan regular dependency update cycles
3. Document security practices

## Files Generated

- Backend NPM Audit: backend_npm_audit_${TIMESTAMP}.json
- Frontend NPM Audit: frontend_npm_audit_${TIMESTAMP}.json
- Secrets Scan: secrets_scan_${TIMESTAMP}.txt
- Outdated Packages: *_outdated_${TIMESTAMP}.txt

## Next Steps

1. Review all findings in detail
2. Create tickets for critical vulnerabilities
3. Schedule regular security audits
4. Implement automated security checks in CI/CD pipeline

---
*Generated by AlloDoc Security Check Script*
EOF
    
    echo -e "${GREEN}Summary report generated: $summary_file${NC}"
}

# Main execution
main() {
    echo -e "\n${GREEN}Starting comprehensive security check...${NC}"
    
    # Check backend
    if [ -d "$PROJECT_ROOT/backend" ]; then
        run_npm_audit "backend" "$PROJECT_ROOT/backend"
        check_outdated "backend" "$PROJECT_ROOT/backend"
        check_vulnerable_packages "backend" "$PROJECT_ROOT/backend"
    fi
    
    # Check frontend
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        run_npm_audit "frontend" "$PROJECT_ROOT/frontend"
        check_outdated "frontend" "$PROJECT_ROOT/frontend"
        check_vulnerable_packages "frontend" "$PROJECT_ROOT/frontend"
    fi
    
    # Run OWASP check
    run_owasp_check
    
    # Check for secrets
    check_secrets
    
    # Generate summary
    generate_summary
    
    echo -e "\n${GREEN}==================================================${NC}"
    echo -e "${GREEN}     Security Check Complete!                     ${NC}"
    echo -e "${GREEN}     Reports saved in: $REPORT_DIR              ${NC}"
    echo -e "${GREEN}==================================================${NC}"
}

# Run main function
main "$@"