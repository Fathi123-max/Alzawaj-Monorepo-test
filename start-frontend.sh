#!/bin/bash
# Startup script for frontend that handles potential build issues

# Install dependencies
echo "Installing dependencies..."
cd /app
pnpm install

# Run the development server instead of trying to build for production
echo "Starting frontend development server on port 3000..."
exec pnpm run dev