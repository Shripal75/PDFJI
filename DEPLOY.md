# Deployment Guide for PDFji

This guide explains how to deploy the PDFji application (Frontend + Backend) to [Railway](https://railway.app/).

## Prerequisites

- A Railway account
- GitHub repository with this code pushed
- Railway CLI (optional, but recommended)

## Project Structure

This is a **monorepo** with two distinct parts:
- `backend/`: Python (FastAPI) application
- `frontend/`: React application

You will deploy these as **two separate services** within the same Railway project.

## Step 1: Create a Railway Project

1. Log in to Railway.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository.

## Step 2: Configure the Backend Service

1. Select the service that was created (it might default to the root).
2. Go to **Settings**.
3. Under **Service Name**, rename it to `backend`.
4. **Root Directory**: Set this to `/backend`.
5. **Build Command**: Leave empty (Nixpacks detects requirements.txt automatically).
6. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Go to **Variables** and add these if needed (though for this app, defaults might work):
   - `PORT`: `8000` (Railway sets this automatically, but good to be aware)

## Step 3: Configure the Frontend Service

1. Click **+ New** > **GitHub Repo** and select the **SAME** repository again.
2. This creates a second service for the same repo.
3. Go to **Settings** for this new service.
4. **Service Name**: Rename it to `frontend`.
5. **Root Directory**: Set this to `/frontend`.
6. **Build Command**: `npm run build`
7. **Start Command**: `npm run preview` (or serve the static files using a lightweight server like `serve`).
   - Recommended Start Command: `npx serve -s dist -l $PORT`
8. Go to **Variables**:
   - Add `VITE_API_URL`: **IMPORTANT**
     - This must point to your *Backend Service URL*.
     - Example: `https://backend-production.up.railway.app`
     - *Note: Do not add a trailing slash.*

## Step 4: Link Frontend and Backend

1. Get the **Public Domain** of your Backend service (from the Settings or Dashboard).
2. Go to your **Frontend Service** > **Variables**.
3. Update `VITE_API_URL` with the backend URL (e.g., `https://web-production-xxxx.up.railway.app`).
4. Railway will automatically redeploy the frontend with the new variable.

## Step 5: Verify Deployment

1. Open the public URL of your Frontend service.
2. Upload a file (e.g., PDF to Image) and verify it processes correctly.
3. Check the logs in Railway if anything fails.

## Troubleshooting

- **CORS Issues**: If the frontend cannot talk to the backend, check `main.py` in the backend. Ensure `CORSMiddleware` allows your frontend domain.
  - In `backend/main.py`, update `allow_origins` to include your Railway frontend URL (or keep `["*"]` for testing).
- **Build Fails**: Check if `package.json` (frontend) or `requirements.txt` (backend) are missing dependencies.

## Local Development (Optional)

To run locally using the same configuration:
1. Backend: `cd backend && uvicorn main:app --reload`
2. Frontend: `cd frontend && npm run dev`
3. Ensure `VITE_API_URL` in `.env` (frontend) points to http://localhost:8000
