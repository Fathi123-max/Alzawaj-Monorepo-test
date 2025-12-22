#!/bin/bash

# Simple script to load .env.local and run the local Docker Compose setup

set -e  # Exit immediately if a command exits with a non-zero status

ENV_FILE="${1:-.env.local}"

# Check if the environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Environment file $ENV_FILE does not exist."
    echo "Please create it first or specify a different file as an argument."
    exit 1
fi

echo "Loading environment variables from $ENV_FILE..."

# Load the environment variables properly using the dotenv-cli approach
# First, check if dotenv-cli is available
if command -v dotenv-cli >/dev/null 2>&1; then
    # Use dotenv-cli if available
    eval $(dotenv-cli -e "$ENV_FILE" printenv)
else
    # Fallback: use a safer approach to parse the env file
    while IFS= read -r line || [[ -n "$line" ]]; do  # The '|| [[ -n "$line" ]]' handles the last line if it doesn't end with newline
        # Trim leading and trailing whitespace
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        # Skip empty lines and comments
        if [[ -n "$line" && "$line" != "#"* ]]; then
            # Check if the line contains an assignment
            if [[ "$line" == *"="* ]]; then
                # Extract the variable name and value
                key="${line%%=*}"
                value="${line#*$key=}"

                # Trim whitespace from key and value
                key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

                # Remove surrounding quotes if present
                if [[ "$value" == \"*\" ]] || [[ "$value" == \'*\' ]]; then
                    value="${value:1:${#value}-2}"
                fi

                # Export the variable
                export "$key=$value"
            fi
        fi
    done < "$ENV_FILE"
fi

echo "Starting local development environment..."
echo "Using FRONTEND_PORT=$FRONTEND_PORT"
echo "Using BACKEND_PORT=$BACKEND_PORT"
echo "Using MONGODB_PORT=$MONGODB_PORT"
echo "Using REDIS_PORT=$REDIS_PORT"

# Run docker compose with the loaded environment
docker compose -f docker-compose.local.yaml up -d

echo "Local development environment started successfully!"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "MongoDB: localhost:$MONGODB_PORT"
echo "Redis: localhost:$REDIS_PORT"