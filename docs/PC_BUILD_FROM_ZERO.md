# PC Build From Zero: A Developer's Guide

This guide will walk you through setting up a complete development environment for OpenDuelyst, allowing you to build and run a PC client connected to a local server instance.

## 1. Prerequisites

Ensure you have the following software installed:

- **Git**: For cloning the repository.
- **Node.js**: Version 18.x is recommended (as per `.github/workflows/build_app.yaml`). You can use a Node version manager like `nvm` to install and manage versions.
- **Yarn**: Version 1.0.0 or higher (as per `package.json`). Install via npm: `npm install -g yarn`.
- **Docker Desktop**: For running the local server components (PostgreSQL, Redis, API server, etc.).
- **`cross-env`**: A utility for setting environment variables across platforms. Install globally: `npm install -g cross-env`.
- **Wine** (for building Windows client on macOS/Linux):
    - macOS: `brew install --cask wine-stable`
    - Linux: Installation varies by distribution (e.g., `sudo apt install wine`).
- **Linux Specific Dependencies**:
    - `libpng-dev`: Required for some Node.js native module builds (as seen in `.github/workflows/build_app.yaml`). Install via your package manager (e.g., `sudo apt-get install -y libpng-dev`).
    - `libgconf-2-4`: A known dependency for running the Linux desktop client (from `DESKTOP.md`). Install via your package manager (e.g., `sudo apt-get install -y libgconf-2-4`).

## 2. Setting Up the Local Server Environment

This setup uses Docker to run all backend services locally.

### a. Clone the Repository
```bash
git clone https://github.com/open-duelyst/duelyst.git
cd duelyst
```

### b. Configure Server Environment Variables

The Docker Compose setup requires certain environment variables. Create a file named `.env` in the root directory of the `duelyst` project. Docker Compose will automatically load this file.

**Essential variables for your `.env` file:**

- `FIREBASE_URL`: For local development, a placeholder or test Firebase instance URL is sufficient. The build workflows use `https://test-url.firebaseio.com/`.
- `FIREBASE_LEGACY_TOKEN`: A corresponding token for the Firebase instance. For local development with the placeholder URL, a dummy token like `test_token` can be used.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: These define the credentials for the PostgreSQL database. The `docker-compose.yaml` sets these for the `db` service, and the `api` service uses them in its `POSTGRES_CONNECTION` string.
- `NODE_ENV`: Set to `development` or `staging`. This can affect how some parts of the application behave.

**Example `.env` content for Docker Compose:**
```env
# .env (in the root of the project)

# Firebase settings (used by Dockerized services like API, game server)
FIREBASE_URL=https://test-url.firebaseio.com/
FIREBASE_LEGACY_TOKEN=test_token

# PostgreSQL settings (referenced by docker-compose.yaml for the db service)
# These are the credentials the API service will use to connect to the DB.
POSTGRES_USER=duelyst
POSTGRES_PASSWORD=duelyst
POSTGRES_DB=duelyst

# Redis - not explicitly set here as docker-compose uses 'redis' hostname internally.
# The API service connects to Redis using the hostname 'redis' (e.g., redis://redis:6379)

# Node environment for services
NODE_ENV=development
```

**Note on Ports:**
- The API service (`api`) inside Docker will run on port `3000`, which is mapped to `localhost:3000` on your host machine.
- PostgreSQL (`db`) inside Docker will run on port `5432`, mapped to `localhost:5432` on your host.
- Redis (`redis`) inside Docker will run on port `6379`, mapped to `localhost:6379` on your host.

### c. Start Local Servers with Docker Compose
```bash
docker compose up -d
```
- This command reads the `docker-compose.yaml` file and starts all necessary services (api, game, sp, worker, db, redis) in detached mode (`-d`).
- The services are configured to use the environment variables from your `.env` file where specified (e.g., `FIREBASE_URL` for the `api` service).
- Internal communication between services (e.g., API to Redis) uses Docker's network and service names (e.g., `redis` as the hostname for Redis).

**Checking Server Logs:**
To view logs from a specific service:
```bash
docker compose logs -f <service_name>
# Example:
# docker compose logs -f api
# docker compose logs -f db
```
To see the status of your containers:
```bash
docker compose ps
```

## 3. Building the JavaScript Game Client

This client is the core game interface that runs in Electron (or a browser). It needs to be built to communicate with your local server.

### a. Install Root Project Dependencies
If you haven't already, install all project dependencies:
```bash
yarn install --include=dev
```
*(This command is consistent with `DESKTOP.md`.)*

### b. Build the Application
The game client needs to be configured with the URL of your local API server.

```bash
cross-env NODE_ENV=development FIREBASE_URL="https_//test-url.firebaseio.com/" API_URL="http_//localhost:3000" yarn build
```
**Explanation:**
- `cross-env`: Ensures `NODE_ENV=development` is set correctly regardless of your OS.
- `FIREBASE_URL="https_//test-url.firebaseio.com/"`: This is the placeholder URL.
- `API_URL="http_//localhost:3000"`: **Crucially**, this tells the JavaScript client where to send API requests. `localhost:3000` is where the Dockerized `api` service is exposed on your host machine.
- `yarn build`: This script (defined in `package.json`) compiles the client-side JavaScript, CSS, and HTML.

The compiled application assets will be placed in the `dist/src/` directory.

*(Note: The `FIREBASE_URL` and `API_URL` are passed directly as environment variables to the build command. Ensure the URLs are correct. Using `https_//` and `http_//` to avoid them being treated as comments by some markdown processors, they should be `https://` and `http://` in actual use).*

## 4. Building the Desktop Client

The desktop client is an Electron wrapper around the JavaScript game client.

### a. Navigate to Desktop Directory and Install Dependencies
All commands for building the desktop client are run from the `desktop/` directory.
```bash
cd desktop
yarn install --include=dev
```

### b. Build Desktop Clients
This command builds the Electron application for various platforms.
```bash
# For a staging-like build (recommended for local development against your local server)
yarn build:all

# Alternatively, build for your specific platform:
# yarn build:mac
# yarn build:linux
# yarn build:windows
```
- The built desktop applications will be located in `desktop/dist/build/`.

## 5. Running the Desktop Client

Once the desktop client is built, you can start it.

### a. Start the Application
```bash
# From the desktop/ directory
yarn start # This typically defaults to building/running for your current OS

# Or be specific:
# yarn start:mac
# yarn start:linux
# yarn start:windows
```
- The client should launch. It will use the `API_URL` that was baked in during the `yarn build` step (in section 3b) to connect to your local server.

## 6. Troubleshooting & Common Issues

- **Linux Build/Runtime**:
    - Ensure `libpng-dev` is installed before `yarn install` at the root.
    - The desktop client depends on the `libgconf-2-4` package. Make sure it's installed.
- **Docker Issues**:
    - **Ensure Docker Desktop is running.**
    - Use `docker compose ps` to check the status of all services (api, db, redis, etc.). They should be `Up` or `running`.
    - If a service is not running or restarting, check its logs: `docker compose logs <service_name>`. For example, `docker compose logs api`.
    - If you encounter issues with ports already being in use, stop any other services occupying those ports (3000, 5432, 6379 by default) or reconfigure the port mappings in `docker-compose.yaml`.
- **Build Failures (`yarn build` or `yarn build:all` in `desktop/`)**:
    - **Read the Logs**: The build process, especially with the recent logging enhancements, should provide detailed output. Look for specific error messages.
    - **Node/Yarn Versions**: Ensure you are using Node 18 and a compatible Yarn version.
    - **Dependencies**: Sometimes, removing `node_modules` (in the root and/or `desktop/` directory) and reinstalling with `yarn install --include=dev` can resolve issues.
    - **`cross-env`**: Make sure `cross-env` is installed globally (`npm install -g cross-env`).
- **Client Connection Issues (Desktop client starts but can't connect)**:
    - **Verify `API_URL`**: Double-check that the `API_URL` used in the `yarn build` command (section 3b) was `http://localhost:3000` (or whatever port you might have reconfigured for the API service in Docker). This URL is compiled into the client. If it's wrong, you'll need to rebuild the JS client (section 3b) and then rebuild the desktop client (section 4b).
    - **Check API Service**:
        - Ensure the `api` Docker container is running: `docker compose ps`.
        - Check the logs of the `api` service: `docker compose logs api`. Look for any startup errors or messages indicating it's not ready to receive requests.
    - **Firewall**: Less common for local development, but ensure no local firewall is blocking connections to port 3000.
- **`FIREBASE_URL` and `FIREBASE_LEGACY_TOKEN`**:
    - For local server development, these are primarily used by the server-side components (API, game server). The placeholder `https://test-url.firebaseio.com/` and a dummy token are generally fine if you are not testing specific Firebase interactions like authentication. If you need to test real Firebase features, you'll need to point to a valid Firebase project and use its credentials.

This guide should provide a solid foundation for getting your OpenDuelyst development environment up and running. Happy coding!
```
