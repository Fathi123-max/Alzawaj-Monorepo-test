#!/bin/bash

# Comprehensive Search Filter Testing Script
# Usage: ./test-filters.sh

API_URL="http://localhost:5001/api"
EMAIL="wikiy79439@bablace.com"
PASSWORD="TestPass123!"

echo "=========================================="
echo "Search Filter Testing Script"
echo "=========================================="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Test Education Filter
echo "=========================================="
echo "Step 2: Testing Education Filter"
echo "=========================================="
for edu in "primary" "secondary" "high-school" "diploma" "bachelor" "master" "doctorate" "other"; do
  response=$(curl -s -X GET "$API_URL/search?education=$edu&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ education=$edu: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ education=$edu: FAILED - $error"
  fi
done
echo ""

# Step 3: Test Marital Status Filter
echo "=========================================="
echo "Step 3: Testing Marital Status Filter"
echo "=========================================="
for status in "single" "divorced" "widowed"; do
  response=$(curl -s -X GET "$API_URL/search?maritalStatus=$status&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ maritalStatus=$status: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ maritalStatus=$status: FAILED - $error"
  fi
done
echo ""

# Step 4: Test Religious Commitment Filter
echo "=========================================="
echo "Step 4: Testing Religious Commitment Filter"
echo "=========================================="
for level in "basic" "moderate" "practicing" "very-religious"; do
  response=$(curl -s -X GET "$API_URL/search?religiousCommitment=$level&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ religiousCommitment=$level: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ religiousCommitment=$level: FAILED - $error"
  fi
done
echo ""

# Step 5: Test Age Range Filters
echo "=========================================="
echo "Step 5: Testing Age Range Filters"
echo "=========================================="
for test in "ageMin=25" "ageMax=35" "ageMin=25&ageMax=35"; do
  response=$(curl -s -X GET "$API_URL/search?$test&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ $test: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ $test: FAILED - $error"
  fi
done
echo ""

# Step 6: Test Height Range Filters
echo "=========================================="
echo "Step 6: Testing Height Range Filters"
echo "=========================================="
for test in "heightMin=160" "heightMax=180" "heightMin=160&heightMax=180"; do
  response=$(curl -s -X GET "$API_URL/search?$test&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ $test: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ $test: FAILED - $error"
  fi
done
echo ""

# Step 7: Test Boolean Filters
echo "=========================================="
echo "Step 7: Testing Boolean Filters"
echo "=========================================="
for filter in "isPrayerRegular=true" "hasBeard=true" "wearHijab=true" "wearNiqab=true" "verified=true" "hasChildren=true" "wantsChildren=true"; do
  response=$(curl -s -X GET "$API_URL/search?$filter&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ $filter: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ $filter: FAILED - $error"
  fi
done
echo ""

# Step 8: Test Location Filters
echo "=========================================="
echo "Step 8: Testing Location Filters"
echo "=========================================="
for test in "country=Saudi Arabia" "city=Riyadh" "location=Saudi"; do
  response=$(curl -s -X GET "$API_URL/search?$test&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ $test: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ $test: FAILED - $error"
  fi
done
echo ""

# Step 9: Test Combined Filters
echo "=========================================="
echo "Step 9: Testing Combined Filters"
echo "=========================================="
response=$(curl -s -X GET "$API_URL/search?education=bachelor&maritalStatus=single&ageMin=25&ageMax=35&limit=1" \
  -H "Authorization: Bearer $TOKEN")
success=$(echo "$response" | jq -r '.success')
count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')

if [ "$success" = "true" ]; then
  echo "✅ Combined filters: SUCCESS (found $count profiles)"
else
  error=$(echo "$response" | jq -r '.message // "Unknown error"')
  echo "❌ Combined filters: FAILED - $error"
fi
echo ""

# Step 10: Test Invalid Values
echo "=========================================="
echo "Step 10: Testing Invalid Values (Should Fail)"
echo "=========================================="
for test in "education=invalid" "maritalStatus=married" "religiousCommitment=atheist"; do
  response=$(curl -s -X GET "$API_URL/search?$test&limit=1" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  
  if [ "$success" = "false" ]; then
    error=$(echo "$response" | jq -r '.message')
    echo "✅ $test: Correctly rejected - $error"
  else
    echo "❌ $test: Should have been rejected but was accepted!"
  fi
done
echo ""

# Step 11: Test Pagination and Sorting
echo "=========================================="
echo "Step 11: Testing Pagination and Sorting"
echo "=========================================="
for test in "page=1&limit=5" "page=2&limit=5" "sortBy=age" "sortBy=compatibility" "sortBy=newest"; do
  response=$(curl -s -X GET "$API_URL/search?$test" \
    -H "Authorization: Bearer $TOKEN")
  success=$(echo "$response" | jq -r '.success')
  count=$(echo "$response" | jq -r '.data.pagination.totalCount // 0')
  
  if [ "$success" = "true" ]; then
    echo "✅ $test: SUCCESS (found $count profiles)"
  else
    error=$(echo "$response" | jq -r '.message // "Unknown error"')
    echo "❌ $test: FAILED - $error"
  fi
done
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
