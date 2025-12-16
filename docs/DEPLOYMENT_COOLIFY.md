# Coolify Deployment Guide

This guide explains how to deploy the Alzawaj Monorepo to a server using Coolify.

## 1. Import into Coolify

1. Go to your Coolify Dashboard.
2. Select your Project (or create a new one).
3. Click **"+ New"** -> **"Docker Compose"**.
4. Select using **"File"** (or Git source if you prefer auto-deployments).
5. Paste the contents of your `docker-compose.yaml`.
   > **Note:** Coolify handles builds automatically. Make sure to select **Git Source** if you want it to pull code and build from this repository.
   >
   > *Recommendation:* Use the **Git Source** method.
   > 1. Select **"Private Repository"** (if private) or Public.
   > 2. Select the repository `Alzawaj-Alsaeid/Alzawaj-Monorepo`.
   > 3. Branch: `main`.
   > 4. Docker Compose Location: `/docker-compose.yaml`.

## 2. Domain Setup (Important for "No Domain" Users)

If you **do not have a domain**, Coolify provides "Magic DNS" (e.g., `http://random-name.server-ip.sslip.io`).

1. After importing, look at your **Frontend** and **Backend** services in the Coolify UI.
2. Coolify will automatically assign a domain (like `http://xxx.123.123.123.sslip.io`).
3. **Copy these URLs**—you will need them for the environment variables in the next step.
   - **Frontend URL**: e.g., `http://front.111.111.111.sslip.io`
   - **Backend URL**: e.g., `http://back.111.111.111.sslip.io`

## 3. Configure Environment Variables

This is the most critical step. You must define all variables referenced in `docker-compose.yaml`.

1. Go to the **Environment Variables** tab of your deployed resource in Coolify.
2. Switch to **"Edit raw"** (if available) or paste the keys and values below.

**Copy & Paste this block (Update values for Production):**

```env
# --- Service Configuration ---
NODE_ENV=production
LOG_LEVEL=info

# --- Ports (Internal to Container Network) ---
# Coolify handles external routing via its Traefik proxy
FRONTEND_PORT=3000
BACKEND_PORT=5000
MONGODB_PORT=27017
REDIS_PORT=6379

# --- URLs (CRITICAL) ---
# Paste the Coolify-generated URLs (sslip.io) here
NEXT_PUBLIC_APP_URL=http://[YOUR_FRONTEND_URL]
NEXT_PUBLIC_API_URL=http://[YOUR_BACKEND_URL]
FRONTEND_URL=http://[YOUR_FRONTEND_URL]
BACKEND_URL=http://backend:5000
CORS_ORIGIN=http://[YOUR_FRONTEND_URL]

# --- Security Secrets (CHANGE THESE) ---
JWT_SECRET=generate_a_secure_random_string_here_min_32_chars
MONGO_ROOT_PASSWORD=secure_db_password
MONGO_APP_PASSWORD=secure_db_password
REDIS_PASSWORD=secure_redis_password

# --- Database Connection Strings ---
# These use internal Docker network aliases
MONGODB_URI=mongodb://admin:secure_db_password@mongodb:27017/alzawaj?authSource=admin
REDIS_URL=redis://:secure_redis_password@redis:6379

# --- Feature Flags ---
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_PHOTOS=true
ENABLE_METRICS=true

# --- External Services (Fill with your keys) ---
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=

# ImageKit
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
IMAGEKIT_ROOT_FOLDER=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=true

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## 4. Network & Domains in Coolify

1. **Frontend Service**:
   - In the Coolify UI Service settings, find the Frontend container.
   - Set **Domains** to your desired frontend domain (e.g., `https://alzawaj.example.com`).
   - Ensure the **Exposed Port** is `3000`.

2. **Backend Service**:
   - Find the Backend container.
   - Set **Domains** to your API domain (e.g., `https://api.alzawaj.example.com`).
   - Ensure the **Exposed Port** is `5000`.

   - Ensure the **Exposed Port** is `5000`.

## 5. Deploy

1. Click **"Deploy"**.
2. Watch the "Logs" tab.
3. If the build fails, verify that all secret keys (Firebase, AWS, etc.) are correctly set.

## 6. Verification

After deployment:
1. Visit your Frontend URL.
2. Check `https://api.alzawaj.example.com/api/health` to confirm the backend is running.

## 7. Troubleshooting: "Authentication Failed" or "StoredKey Mismatch"

If your backend crashes with `AuthenticationFailed` or `storedKey mismatch`, it means **MongoDB has a different password stored than what you put in the Environment Variables.**

This happens if you started MongoDB once (it created the user), and *then* changed the password in Coolify. MongoDB **does not** update the password automatically on restart if the data volume exists.

### Option A: The "Nuke and Pave" (Recommended for fresh install)
**⚠️ WARNING: THIS DELETES ALL DATABASE DATA**

1. Go to Coolify -> **MongoDB** Service.
2. Go to **Storage**.
3. Delete the persistent volume (or click "Delete Volume").
4. **Restart** the MongoDB service.
   *It will re-initialize with the password from your Environment Variables.*

### Option B: Manual Password Reset (Preserves Data)

1. Go to Coolify -> **MongoDB** Service -> **Terminal** (or Console).
2. Connect to the database:
   ```bash
   mongosh -u admin -p OLD_PASSWORD
   # If you don't know the old password, try "alzawaj_password" or "admin"
   ```
3. Update the password:
   ```javascript
   use admin;
   db.changeUserPassword("admin", "NEW_SECURE_PASSWORD");
   // Replace NEW_SECURE_PASSWORD with exactly what is in your Coolify Env Vars
   ```
4. Restart the Backend.
