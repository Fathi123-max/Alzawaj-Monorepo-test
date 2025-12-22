#!/bin/bash

# Script to load environment variables from .env.local and run Docker Compose
# This script loads the environment variables before running Docker Compose

set -e  # Exit immediately if a command exits with a non-zero status

# Function to load environment variables from .env.local
load_env_file() {
    local env_file="${1:-.env.local}"
    
    if [[ ! -f "$env_file" ]]; then
        echo "Warning: $env_file does not exist. Creating a default one..."
        create_default_env_file "$env_file"
    fi
    
    echo "Loading environment variables from $env_file..."

    # Load the environment variables properly using the dotenv-cli approach
    # First, check if dotenv-cli is available
    if command -v dotenv-cli >/dev/null 2>&1; then
        # Use dotenv-cli if available
        eval $(dotenv-cli -e "$env_file" printenv)
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
        done < "$env_file"
    fi
}

# Function to create a default .env.local file
create_default_env_file() {
    local env_file="$1"
    
    cat > "$env_file" << 'EOF'
# Environment variables for local development
NODE_ENV=development

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=5001
MONGODB_PORT=27017
REDIS_PORT=6380

# Application settings
NEXT_PUBLIC_APP_NAME="Alzawaj Platform - Local"
NEXT_PUBLIC_APP_DESCRIPTION="Islamic Marriage Platform - Local Dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:5001"

# CORS
CORS_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"

# Database
MONGODB_URI="mongodb://localhost:27017/alzawaj-dev"

# JWT
JWT_SECRET="your-local-jwt-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-local-jwt-refresh-secret-key-change-in-production"

# Redis
REDIS_URL="redis://localhost:6380"

# Logging
LOG_LEVEL=debug

# ImageKit (optional - set to empty if not using)
IMAGEKIT_PUBLIC_KEY=""
IMAGEKIT_PRIVATE_KEY=""
IMAGEKIT_URL_ENDPOINT=""

# Firebase (optional - set to empty if not using)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY_ID=""
FIREBASE_PRIVATE_KEY=""

# SMTP (optional - set to empty if not using)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_SECURE="false"

# Resend (optional - set to empty if not using)
RESEND_API_KEY=""
RESEND_SENDER_EMAIL=""
RESEND_SENDER_NAME=""
EOF

    echo "Default $env_file created. Please update the values according to your local setup."
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS] [DOCKER_COMPOSE_ARGS...]"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE    Specify the Docker Compose file to use (default: docker-compose.local.yaml)"
    echo "  -e, --env FILE     Specify the environment file to load (default: .env.local)"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                 # Load .env.local and run docker-compose.local.yaml up"
    echo "  $0 -f docker-compose.yaml         # Load .env.local and run docker-compose.yaml up"
    echo "  $0 up -d                          # Load .env.local and run 'docker compose up -d'"
    echo "  $0 -e .env.development up         # Load .env.development and run 'docker compose up'"
    exit 0
}

# Parse command line options
COMPOSE_FILE="docker-compose.local.yaml"
ENV_FILE=".env.local"
DOCKER_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information."
            exit 1
            ;;
        *)
            DOCKER_ARGS+=("$1")
            shift
            ;;
    esac
done

# Load environment variables
load_env_file "$ENV_FILE"

# Check if Docker Compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "Error: Docker Compose file $COMPOSE_FILE does not exist."
    exit 1
fi

echo "Running Docker Compose with file: $COMPOSE_FILE"
echo "Using environment file: $ENV_FILE"

# Run Docker Compose with the loaded environment
docker compose -f "$COMPOSE_FILE" "${DOCKER_ARGS[@]}"

echo "Docker Compose command completed."