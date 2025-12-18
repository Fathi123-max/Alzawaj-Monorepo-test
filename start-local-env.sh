#!/bin/bash
# Script to start local development environment
# We'll let Docker Compose handle the env_file directly; the warnings are just about shell substitution

# Start the local development environment
# The warnings about variables not being set are just about shell context,
# Docker Compose will still load them from the env_file into the containers
# Note: Avoiding export of .env.local variables to shell to prevent parsing errors with multi-line values
docker compose -f docker-compose.local.yaml up -d