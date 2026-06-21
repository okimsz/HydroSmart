# HydroSmart Deployment Guide (Render)

This guide walks you through deploying your full-stack **HydroSmart** application (React frontend + Node/Express backend) on **Render**.

We have updated the code so the backend Express server serves the frontend Vite build files. This allows you to host the entire application under **one single free Web Service** instead of deploying two separate sites, keeping the API connections seamless and saving costs.

---

## Prerequisite: Push to GitHub

Before creating a service on Render, your project must be pushed to a Git repository (such as GitHub, GitLab, or Bitbucket):

1. Initialize git in the root folder `d:/hydro`:
   ```bash
   git init
   git add .
   git commit -m "Initialize HydroSmart app"
   ```
2. Create a new repository on GitHub.
3. Link your local project to your GitHub repository and push it:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

---

## Deployment Steps on Render

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. **Create a New Web Service**:
   - In the top right corner, click **+ New** and select **Web Service**.
   - (Note: Even though you were looking at *Static Site*, we should choose **Web Service** because the Express backend server is dynamic and runs node).
3. **Connect Your Git Repository**:
   - Under **Connect a Git repository**, find the repository you pushed and click **Connect**.
4. **Configure Deployment Settings**:
   - **Name**: `hydrosmart` (or any custom name)
   - **Region**: Choose the closest region (e.g., Singapore for PH)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
     *(This is configured in the root `package.json` to automatically run `cd frontend && npm install && npm run build` to compile the Vite static files)*
   - **Start Command**: `npm start`
     *(This runs `node server.js` which boots up the Express API and serves the frontend build)*
   - **Instance Type**: Select **Free**
5. **Click Deploy Web Service**:
   - Render will clone your repository, run the build process, compile the static files, and start your Express server on a free subdomain (e.g., `hydrosmart.onrender.com`).

Once the deployment completes successfully, you can open your web service URL in your browser, and your entire application will be live!
