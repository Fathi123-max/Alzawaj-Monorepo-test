# Backend Setup Instructions

## The API errors you're seeing are because the backend server is not running.

### To fix this, you need to start the backend server:

## Step 1: Navigate to Backend Directory
```bash
cd alzawaj-project-backend
```

## Step 2: Install Dependencies (if not already installed)
```bash
pnpm install
```

## Step 3: Set Up Environment Variables
Create a `.env` file in the `alzawaj-project-backend` directory with the following:

```env
MONGODB_URI=mongodb+srv://<your-mongodb-connection-string>
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_ENDPOINT=your_imagekit_endpoint
NODE_ENV=development
PORT=5001
```

**Note**: You can use MongoDB Atlas (cloud) or a local MongoDB instance.

## Step 4: Start the Backend Server
```bash
pnpm run dev
```

You should see output like:
```
🚀 Server running on port 5001
📊 Database connected
🌐 CORS enabled for http://localhost:3000
```

## Step 5: Verify Backend is Running
Open your browser and go to:
- http://localhost:5001/health
- You should see a health check response

## Step 6: Start the Frontend (in a new terminal)
```bash
cd alzawaj-project-frontend
npm install
npm run dev
```

The frontend should now connect to the backend without errors.

---

## Troubleshooting

### If you get "Cannot connect to database" error:
1. Make sure MongoDB is running (local or Atlas)
2. Check your `MONGODB_URI` in `.env`
3. Ensure your IP address is whitelisted in MongoDB Atlas

### If you get "JWT secret not defined" error:
1. Make sure you have `JWT_SECRET` in your `.env` file
2. It should be a strong random string

### If you get CORS errors:
1. Make sure `FRONTEND_URL=http://localhost:3000` in your `.env`
2. Restart the backend after changing `.env`

### If you get "Module not found" errors:
```bash
# In backend directory
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### If you get TypeScript errors:
```bash
# In backend directory
pnpm run build
```

---

## Quick Start Commands Summary

Terminal 1 (Backend):
```bash
cd alzawaj-project-backend
pnpm install  # if first time
pnpm run dev
```

Terminal 2 (Frontend):
```bash
cd alzawaj-project-frontend
npm install  # if first time
npm run dev
```

Then open http://localhost:3000 in your browser.
