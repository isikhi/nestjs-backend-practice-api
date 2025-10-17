#!/bin/bash

# Test Runner Script
# Runs all tests in Docker isolated environment and generates comprehensive reports

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Movie API - Isolated Test Environment Runner          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Clean previous test results
echo -e "${YELLOW}🧹 Cleaning previous test results...${NC}"
rm -rf test-results coverage
mkdir -p test-results coverage

# Build test images
echo -e "${YELLOW}🏗️  Building test Docker images...${NC}"
docker compose -f docker-compose.test.yml build --no-cache

# Start test infrastructure
echo -e "${YELLOW}🚀 Starting test infrastructure (MongoDB + Redis)...${NC}"
docker compose -f docker-compose.test.yml up -d mongo-test redis-test

# Wait for infrastructure to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Run Unit Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   1/3: Running Unit & Integration Tests                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
docker compose -f docker-compose.test.yml run --rm test-unit
UNIT_EXIT_CODE=$?

if [ $UNIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
fi

# Run E2E Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   2/3: Running E2E Tests                                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
docker compose -f docker-compose.test.yml run --rm test-e2e
E2E_EXIT_CODE=$?

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ E2E tests passed${NC}"
else
    echo -e "${RED}❌ E2E tests failed${NC}"
fi

# Start test app for API tests
echo -e "${YELLOW}🚀 Starting test application for API tests...${NC}"
docker compose -f docker-compose.test.yml up -d app-test

# Wait for app to be healthy
echo -e "${YELLOW}⏳ Waiting for test app to be ready...${NC}"
sleep 10

# Run API/Postman Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   3/3: Running Postman/Newman API Tests                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
docker compose -f docker-compose.test.yml run --rm test-api
API_EXIT_CODE=$?

if [ $API_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ API tests passed${NC}"
else
    echo -e "${RED}❌ API tests failed${NC}"
fi

# Stop all test containers
echo -e "${YELLOW}🛑 Stopping test infrastructure...${NC}"
docker compose -f docker-compose.test.yml down -v

# Generate Summary Report
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Results Summary                                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_EXIT_CODE=0

if [ $UNIT_EXIT_CODE -eq 0 ]; then
    echo -e "  ${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ Unit Tests: FAILED${NC}"
    TOTAL_EXIT_CODE=1
fi

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo -e "  ${GREEN}✅ E2E Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ E2E Tests: FAILED${NC}"
    TOTAL_EXIT_CODE=1
fi

if [ $API_EXIT_CODE -eq 0 ]; then
    echo -e "  ${GREEN}✅ API Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ API Tests: FAILED${NC}"
    TOTAL_EXIT_CODE=1
fi

echo ""
echo -e "${YELLOW}📊 Test Reports Generated:${NC}"
echo -e "  - Coverage Report: ${BLUE}coverage/lcov-report/index.html${NC}"
echo -e "  - Newman Report: ${BLUE}test-results/newman-report.html${NC}"
echo -e "  - Newman JSON: ${BLUE}test-results/newman-results.json${NC}"
echo ""

if [ $TOTAL_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 All Tests Passed Successfully! 🎉                   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  Some Tests Failed - Check Reports ⚠️               ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
fi

exit $TOTAL_EXIT_CODE
