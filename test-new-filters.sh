#!/bin/bash

API_URL="http://localhost:5001/api"
EMAIL="wikiy79439@bablace.com"
PASSWORD="TestPass123!"

echo "=========================================="
echo "Testing New Search Filters"
echo "=========================================="

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test Appearance Filter
echo "Testing Appearance Filter:"
for val in "very-attractive" "attractive" "average" "simple"; do
  result=$(curl -s -X GET "$API_URL/search?appearance=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ appearance=$val: $count profiles" || echo "❌ appearance=$val: FAILED"
done
echo ""

# Test Skin Color Filter
echo "Testing Skin Color Filter:"
for val in "fair" "medium" "olive" "dark"; do
  result=$(curl -s -X GET "$API_URL/search?skinColor=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ skinColor=$val: $count profiles" || echo "❌ skinColor=$val: FAILED"
done
echo ""

# Test Body Type Filter
echo "Testing Body Type Filter:"
for val in "slim" "average" "athletic" "heavy"; do
  result=$(curl -s -X GET "$API_URL/search?bodyType=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ bodyType=$val: $count profiles" || echo "❌ bodyType=$val: FAILED"
done
echo ""

# Test Smoking Status Filter
echo "Testing Smoking Status Filter:"
for val in "never" "quit" "occasionally" "regularly"; do
  result=$(curl -s -X GET "$API_URL/search?smokingStatus=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ smokingStatus=$val: $count profiles" || echo "❌ smokingStatus=$val: FAILED"
done
echo ""

# Test Financial Situation Filter (Male profiles)
echo "Testing Financial Situation Filter:"
for val in "excellent" "good" "average" "struggling"; do
  result=$(curl -s -X GET "$API_URL/search?financialSituation=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ financialSituation=$val: $count profiles" || echo "❌ financialSituation=$val: FAILED"
done
echo ""

# Test Housing Ownership Filter (Male profiles)
echo "Testing Housing Ownership Filter:"
for val in "owned" "rented" "family-owned"; do
  result=$(curl -s -X GET "$API_URL/search?housingOwnership=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ housingOwnership=$val: $count profiles" || echo "❌ housingOwnership=$val: FAILED"
done
echo ""

# Test Work After Marriage Filter (Female profiles)
echo "Testing Work After Marriage Filter:"
for val in "yes" "no" "undecided"; do
  result=$(curl -s -X GET "$API_URL/search?workAfterMarriage=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ workAfterMarriage=$val: $count profiles" || echo "❌ workAfterMarriage=$val: FAILED"
done
echo ""

# Test Nationality Filter
echo "Testing Nationality Filter:"
for val in "Saudi" "Egyptian" "Syrian"; do
  result=$(curl -s -X GET "$API_URL/search?nationality=$val&limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.pagination.totalCount')
  success=$(echo "$result" | head -1)
  count=$(echo "$result" | tail -1)
  [ "$success" = "true" ] && echo "✅ nationality=$val: $count profiles" || echo "❌ nationality=$val: FAILED"
done
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
