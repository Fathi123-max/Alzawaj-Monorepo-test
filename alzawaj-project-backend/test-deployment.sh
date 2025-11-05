#!/bin/bash
# Test script for deployed Alzawaj backend application

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <deployed-app-url>"
  echo "Example: $0 https://your-app.onrender.com"
  exit 1
fi

BASE_URL=$1

echo "Testing Alzawaj backend deployment at $BASE_URL"
echo "=============================================="

# Test 1: Health check endpoint
echo "1. Testing health check endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" $BASE_URL/health
echo

# Test 2: Root endpoint
echo "2. Testing root endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" $BASE_URL/
echo

# Test 3: API documentation (if available)
echo "3. Testing API documentation endpoint..."
curl -s -w "\nHTTP Status: %{http_code}\n" $BASE_URL/api-docs/swagger.json
echo

echo "Test completed. Please check the responses above to verify the deployment."