# Web-based Mobile Build From Zero: A Developer's Guide

This guide explains how to set up a local development environment for OpenDuelyst and build the web client suitable for testing on mobile devices or emulators.

## 1. Prerequisites

Ensure you have the following software installed:

- **Git**: For cloning the repository.
- **Node.js**: Version 18.x is recommended (as per `.github/workflows/build_app.yaml`). You can use a Node version manager like `nvm` to install and manage versions.
- **Yarn**: Version 1.0.0 or higher (as per `package.json`). Install via npm: `npm install -g yarn`.
- **Docker Desktop**: For running the local server components (PostgreSQL, Redis, API server, etc.).
- **`cross-env`**: A utility for setting environment variables across platforms. Install globally: `npm install -g cross-env`.
- **`http-server`** (or any simple HTTP server): For serving the built web client locally. Install globally: `npm install -g http-server`.

## 2. Setting Up the Local Server Environment

This section outlines how to get the backend services running using Docker.

### a. Clone the Repository
```bash
git clone https://github.com/open-duelyst/duelyst.git
cd duelyst
```

### b. Configure Server Environment Variables

A local `.env` file in the project root is used by Docker Compose to configure the services and by the client build process.

**Create a `.env` file in the root of the `duelyst` project with the following content:**
```env
# .env (in the root of the project)

# Firebase settings (used by Dockerized services AND client build)
FIREBASE_URL=https://test-url.firebaseio.com/
FIREBASE_LEGACY_TOKEN=test_token # For server-side services

# API URL for client build (points to Dockerized API service exposed on host)
API_URL=http://localhost:3000

# PostgreSQL settings (used by Dockerized 'api' and 'worker' services via docker-compose.yaml)
POSTGRES_USER=duelyst
POSTGRES_PASSWORD=duelyst
POSTGRES_DB=duelyst

# Redis - services connect to 'redis' hostname within Docker.
# For client-side, not typically needed. If a server-side script needed full REDIS_URL:
# REDIS_URL=redis://localhost:6379

# Node environment
NODE_ENV=development
```
**Key Points:**
- `API_URL=http://localhost:3000`: This is crucial. Your Dockerized API service is exposed on port `3000` of your host machine (as per `docker-compose.yaml`). The web client will send requests here.
- `FIREBASE_URL`: Used by both server-side services (via Docker Compose) and the client build process. For local development, the placeholder is usually sufficient.

### c. Start Local Servers with Docker Compose
```bash
docker compose up -d
```
This command starts all backend services (api, game, sp, worker, db, redis) in detached mode.

**Checking Server Logs:**
To view logs from a specific service (e.g., the API):
```bash
docker compose logs -f api
```
To see the status of your containers:
```bash
docker compose ps
```

## 3. Building the Web Client for Mobile Development

With the local server running, you can now build the web application.

### a. Install Root Project Dependencies
If you haven't already, install all project dependencies from the root directory:
```bash
yarn install --include=dev
```

### b. Build the Web Application
This command compiles the client-side JavaScript, CSS, and HTML, configured for your local environment.

**From the project root directory, run:**
```bash
cross-env NODE_ENV=${NODE_ENV} FIREBASE_URL=${FIREBASE_URL} API_URL=${API_URL} yarn build
```
**Explanation:**
- `cross-env`: Ensures `NODE_ENV` (and other variables) are set correctly across different operating systems.
- `${NODE_ENV}`, `${FIREBASE_URL}`, `${API_URL}`: These will be substituted by `cross-env` (if your shell supports it and they are exported) or you should replace them with the actual values from your `.env` file if substitution doesn't occur. For example:
  ```bash
  cross-env NODE_ENV=development FIREBASE_URL="https://test-url.firebaseio.com/" API_URL="http://localhost:3000" yarn build
  ```
- `yarn build`: This script (defined in `package.json`) bundles the application.

The compiled application assets, including `index.html`, will be placed in the `dist/src/` directory, with `dist/index.html` (or `dist/src/index.html` if `gulp/html.js` places it there) being the main entry point. The standard build places it at `dist/src/index.html`.

## 4. Testing the Web-based Mobile Version

### a. Accessing the Local Web Server
The `yarn build` command produces static files. You need a simple HTTP server to serve them.

1.  **Navigate to the directory containing the built assets**:
    The main `index.html` is typically in `dist/src/`. However, other assets might be in `dist/`. Serving from `dist/` is usually correct to ensure all paths resolve.
    ```bash
    cd dist
    ```
2.  **Start the HTTP server**:
    ```bash
    # (Ensure http-server is installed: npm install -g http-server)
    http-server -o
    ```
    (If you are in the project root, you can run `http-server ./dist -o`)

This command will typically serve the site at `http://localhost:8080` (or another available port) and open it in your default browser.

### b. Browser Developer Tools for Mobile Emulation
Desktop browsers have excellent tools for mobile emulation:
- **Chrome**: Open DevTools (F12 or Cmd/Ctrl+Shift+I), then click the "Toggle device toolbar" icon (looks like a phone and tablet). Select a device from the dropdown or set custom dimensions and user agent.
- **Firefox**: Go to Tools > Web Developer > Responsive Design Mode (Cmd/Ctrl+Shift+M).
- **Safari**: Enable "Show Develop menu in menu bar" in Preferences > Advanced. Then, Develop > Enter Responsive Design Mode.

These tools allow you to simulate screen sizes, resolutions, pixel densities, touch events, and network conditions.

### c. Accessing from a Physical Mobile Device
To test on an actual mobile device:
1.  **Connect to the Same Network**: Ensure your computer (running the `http-server`) and your mobile device are on the same Wi-Fi network.
2.  **Find Your Computer's Local IP Address**:
    - Windows: Open Command Prompt and type `ipconfig`. Look for "IPv4 Address" under your active network adapter.
    - macOS: Go to System Preferences > Network, or type `ifconfig | grep "inet " | grep -v 127.0.0.1` in Terminal.
    - Linux: Type `ip addr show` or `ifconfig` in Terminal.
3.  **Access the Site**: Open the browser on your mobile device and navigate to `http://<your_computer_ip_address>:<port>`. For example, if your computer's IP is `192.168.1.100` and `http-server` is running on port `8080`, you'd go to `http://192.168.1.100:8080`.

**Firewall Note**: If you can't connect, your computer's firewall might be blocking incoming connections. You may need to temporarily adjust your firewall settings to allow access to the port `http-server` is using (e.g., 8080).

### d. Specific Mobile Considerations
- The standard web build (`yarn build` as described) is the one used for mobile web access. There are no separate mobile-specific build flags apparent in the project structure for the web client.
- **UI/UX Testing**: Focus on:
    - **Responsiveness**: How the layout adapts to different screen sizes and orientations.
    - **Touch Interactions**: Ensure buttons are easily tappable, gestures work as expected, and there are no hover-dependent interactions that fail on touch devices.
    - **Performance**: Mobile devices, especially older ones, may have less CPU/GPU power and slower network connections. Test for smooth animations, quick load times, and efficient resource usage.
    - **Legibility**: Ensure text is readable on smaller screens.

## 5. Troubleshooting

- **Server Issues**:
    - Ensure Docker Desktop is running.
    - Check Docker container statuses with `docker compose ps`. All relevant services (api, db, redis) should be 'Up' or 'running'.
    - Review logs for specific services if issues are suspected: `docker compose logs -f <service_name>` (e.g., `docker compose logs -f api`).
- **Build Failures (`yarn build`)**:
    - Carefully read the error messages in the terminal. The build process logs detailed output.
    - Ensure Node.js (v18) and Yarn (>=1.0.0) are correctly installed and active.
    - Make sure `cross-env` is globally installed (`npm install -g cross-env`).
    - Try deleting `node_modules` and reinstalling with `yarn install --include=dev`.
- **Connection Issues (Browser to Local Game Server via `http-server`)**:
    - Confirm `http-server` is running and note the port it's using (usually 8080).
    - If accessing from a physical mobile device:
        - Double-check that your computer and mobile device are on the same Wi-Fi network.
        - Verify the computer's local IP address.
        - Check your computer's firewall settings to ensure it's not blocking incoming connections on the port `http-server` is using.
- **Connection Issues (Game Client to API Server)**:
    - **Verify `API_URL`**: The `API_URL` (e.g., `http://localhost:3000`) compiled into the client JavaScript must correctly point to where your Dockerized API service is accessible from the host machine. If this was incorrect during the `yarn build` step (Section 3b), you'll need to rebuild the client with the correct `API_URL`.
    - Check that the `api` Docker container is running and healthy (`docker compose ps` and `docker compose logs api`).

This guide should help you get the web version of OpenDuelyst running for mobile testing. Good luck!
```
