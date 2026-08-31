# HydroSmart Deployment Guide (Render)

This guide walks you through deploying your full-stack **HydroSmart** application (React frontend + Node/Express backend) on **Render**.

We have restructured the project into clean subdirectories (`backend/` and `frontend/`) and configured root-level commands. The Express backend serves the compiled static frontend files in production. This allows you to host the entire application under **one single free Web Service** instead of deploying two separate sites, keeping the API connections seamless and saving costs.

---

## Prerequisite: Push to GitHub

Before creating a service on Render, confirm that your project is fully pushed to your repository:

1. Confirm your local changes are committed:
   ```bash
   git status
   ```
2. Link your local project to your repository (if not already done):
   ```bash
   git remote add origin https://github.com/okimsz/HydroSmart.git
   git branch -M main
   git push -u origin main
   ```

---

## Deployment Steps on Render

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. **Create a New Web Service**:
   - In the top right corner, click **+ New** and select **Web Service**.
   - (Note: Choose **Web Service** because the Express backend server is dynamic and runs Node.js).
3. **Connect Your Git Repository**:
   - Under **Connect a Git repository**, find your `HydroSmart` repository and click **Connect**.
4. **Configure Deployment Settings**:
   - **Name**: `hydrosmart` (or any custom name)
   - **Region**: Choose the closest region (e.g., `Singapore` for optimal response times in the Philippines)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
     *(This is configured in the root `package.json` to automatically run `npm run install-all && npm run build --prefix frontend` which installs all backend/frontend packages and compiles the Vite static files)*
   - **Start Command**: `npm start`
     *(This runs `node backend/server.js` which boots up the Express API and serves the production frontend build)*
   - **Instance Type**: Select **Free**
5. **Configure Environment Variables (Optional)**:
   - If you want to customize ports or configure environment properties, you can expand **Advanced** settings and add environment variables like:
     - `PORT`: `5000` (Render binds this port automatically in most cases)
     - `NODE_ENV`: `production`
6. **Click Deploy Web Service**:
   - Render will clone your repository, run the build process to compile the assets, and start your Express server on a free subdomain (e.g., `hydrosmart.onrender.com`).

Once the deployment completes successfully, you can open your web service URL in your browser, and your entire application will be live!
