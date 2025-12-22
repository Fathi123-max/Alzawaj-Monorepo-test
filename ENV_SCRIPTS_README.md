# Environment Loading Scripts

This directory contains scripts to load environment variables before running Docker Compose.

## Scripts

### `load-env-and-run-docker.sh`

A comprehensive script that loads environment variables from a specified file and runs Docker Compose with flexible options.

#### Usage

```bash
# Load .env.local and run docker-compose.local.yaml up
./load-env-and-run-docker.sh

# Load .env.local and run docker-compose.yaml up
./load-env-and-run-docker.sh -f docker-compose.yaml

# Load .env.local and run 'docker compose up -d'
./load-env-and-run-docker.sh up -d

# Load .env.development and run 'docker compose up'
./load-env-and-run-docker.sh -e .env.development up

# Show help
./load-env-and-run-docker.sh --help
```

#### Options

- `-f, --file FILE`: Specify the Docker Compose file to use (default: docker-compose.local.yaml)
- `-e, --env FILE`: Specify the environment file to load (default: .env.local)
- `-h, --help`: Show help message

### `run-docker-with-env.sh`

A simple script that loads `.env.local` and runs the local Docker Compose setup.

#### Usage

```bash
# Load .env.local and run the local setup
./run-docker-with-env.sh

# Load a different environment file
./run-docker-with-env.sh .env.production
```

## Environment Files

The scripts will automatically create a default `.env.local` file if it doesn't exist, with sensible defaults for local development.

## Notes

- The scripts properly handle values with spaces and special characters in environment variables
- Multi-line values (like private keys) are properly handled
- The scripts check for the existence of environment and Docker Compose files before running