#!/bin/bash

# Script to seed the production database for the Islamic Marriage Platform

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting production database seeding process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root directory."
  exit 1
fi

# Check if environment variables are set
if [ -z "$MONGODB_URI" ]; then
  echo "❌ Error: MONGODB_URI environment variable is not set"
  echo "Please set your MongoDB URI before running this script:"
  echo "export MONGODB_URI='your-production-mongodb-uri'"
  exit 1
fi

if [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
  echo "❌ Error: JWT_SECRET or JWT_REFRESH_SECRET environment variable is not set"
  echo "Please set your JWT secrets before running this script:"
  echo "export JWT_SECRET='your-production-jwt-secret'"
  echo "export JWT_REFRESH_SECRET='your-production-jwt-refresh-secret'"
  exit 1
fi

echo "✅ Environment variables are set"

# Build the project
echo "🔨 Building the project..."
pnpm run build

# Run the seed command
echo "🌱 Seeding the production database..."
NODE_ENV=production pnpm run db:seed

echo "✅ Production database seeding completed successfully!"
echo ""
echo "⚠️  IMPORTANT: If this was your first time running this script, make sure to change your database password immediately."
echo "🔒 You should also consider using a secrets management system for production environments."