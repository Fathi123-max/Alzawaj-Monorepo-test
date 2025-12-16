# Coolify Environment Variables for Alzawaj Project

# Copy these variables to your Coolify application environment settings

# ===========================================

# COOLIFY SERVER URLS (Production)

# ===========================================

SERVICE_FQDN_BACKEND=r4kgg4g8s0c4kk4o44g0kc4o.116.203.98.236.sslip.io
SERVICE_FQDN_FRONTEND=b48g4sc8cckkcc88s8so0sw8.116.203.98.236.sslip.io
SERVICE_URL_BACKEND=http://r4kgg4g8s0c4kk4o44g0kc4o.116.203.98.236.sslip.io
SERVICE_URL_FRONTEND=http://b48g4sc8cckkcc88s8so0sw8.116.203.98.236.sslip.io

# ===========================================

# PUBLIC URLs (Required)

# ===========================================

FRONTEND_URL=http://b48g4sc8cckkcc88s8so0sw8.116.203.98.236.sslip.io
BACKEND_URL=http://r4kgg4g8s0c4kk4o44g0kc4o.116.203.98.236.sslip.io

# ===========================================

# SECURITY SECRETS (Required)

# ===========================================

JWT_SECRET=37c2d2ef5f6b7a9e8d4c1f2a3b5e6f7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f
MONGO_ROOT_PASSWORD=admin123

# ===========================================

# DATABASE CONNECTIONS

# ===========================================

MONGODB_URI=mongodb://mongodb:27017/alzawaj
REDIS_URL=redis://redis:6379
MONGO_ROOT_USERNAME=admin

# ===========================================

# FILE UPLOAD & STORAGE

# ===========================================

# ImageKit (for image processing)

IMAGEKIT_PRIVATE_KEY=private_cuyHlOjlpvx7KPm8QWVaasohmCQ=
IMAGEKIT_PUBLIC_KEY=public_HFNVWs3EBDzcR9BRWARlKhfqlqI=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/alzawaj
IMAGEKIT_ROOT_FOLDER=alzawaj-images/

# AWS S3 (for file storage)

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# ===========================================

# COMMUNICATION SERVICES

# ===========================================

# Email Service (Nodemailer)

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=fathiwehba5@gmail.com
SMTP_PASS=qlmpgegugyyndrsa

# Twilio (for SMS verification)

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ===========================================

# FIREBASE SERVICES

# ===========================================

# Firebase Admin (Backend)

FIREBASE_PROJECT_ID=alzawaj-50afb
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZ0+JxER2CQL0V\n/gxvYB7BwxkDv/XUdp8rKLQAAqXodwqlTYFVdA01sXdvXFY08VdzUa0vhf1Szpyw\nMiD2rLxpry20UVrDUke5U+ibUImKI2YaqqFWvhU9aAPBig5wTpJx2X3K9Dfm/Wpo\no/04qdF+WhiBqiIZSPZY19L+dRFSCpenpwWE0WSvyJ/dk2OVWJuN6QUyO5IsATqC\ns74aBhtiSHeeEt3SrwvChtRj8bPoFcqwOVOMJDP9zdco2dnsl9XxTNlypUVbC8EC\nsd0d0bxIVCmkb9QasNjkHpFsLXIAM5yoweVnak7O/WECZjQ4ajQ/3J4+8+vWs61W\n/qYt3QxtAgMBAAECggEAG6Do6U9y7zj34si42g2WiRwOWa/o5dxv3uEIR7IOShiD\nRKk6fNS98jACxqCvHIL6BRn4ff0gPvcO37hT/wW01jDOer8Q5JJUn5iZec2yzE8m\nHb7DvQVaG1JMm6k/oJYOtBsSfgIQ7x74drJKJXxAoqaZ0iR6s7tR573kOLsvibir\nOc0ocIFxT1/KStiAktQT0Xw64NP4yACTL9pYfQ1begpyb/Uj0r73NHyCjETZhVcq\nfTlwqwLkpwuFmdXrpeIlT4SgoGtv6hnuxTRTXmFf+8BJYiP41KrG4u676vaPWKWG\n/GuO4I2UZ5is+h3ZiZMwqqvdYWlbp9nleDn0DK2IHwKBgQD5iv+nlSF1G5MQw5gE\n4VZ4WJ909iCyQJIWwR1dVy0JYlFQBfo4r7EiYGoKaVVRLg1NjnQ57pNxfNU0OJxM\n+4+VWou/bzVe5flFfkTgqMzh4cXaD+OEhQjZvDndlsbPsDszQPPCKP6J2XQXjNZV\n0xE21AGxV6TiGvpA6Zl/RssAZwKBgQDfdszW5t4XQEjJXX7IfvyW7Qk/g5rVM/8M\nVlntqRdLdG03MhwR/f7qACvg4iFjkVg2SWxYsHEwFNZukpIarOKFH18ltv88Cn0P\nNycyqzrEeCH2gJC3OkNJ9I0TAXD46DwNoc9cQtOGlvyuV1cPFpe7OjmQHn1W16+2\nbcBs/ha4CwKBgGXrdpVsnHinJX7QVDOSEW4fzCjKKfqD0ucGQscPxu4xQMKtXlBu\nuasvs7/C27zHUVme2CudHI1ajf3BLV1n1XILxE4QzryOsyvF8b3MU7niK5vvp15F\ns6KydPPjFBpZgSRi3+wqMCP/M6I2vIfbKAm7t2FGSaqrmBCRGEdak6j7AoGAKW2m\n8DiA+CKM2/gfZyBTx89OJZ5KeDhZknn31h3BGdYN4WvC1HsYZV1+xQRnWEQ77GSU\nV6TudxGF5534xEVFAZUdWKqiiwkOwmFhPP2NuZrkAQU4zx9YFj/mX52myh6T85sK\nDHq/KHaZheDfXQa9PpK+1T8x0YXPJ60VPZ+lqp0CgYEAiA0y3JAvWortjr6UWu9q\nrxDtyX/csmbUa+fl9Da3qJvBjBz7UoTNVdPb4H7/1t3k5APx3mK9pbKeNTJbve3z\npqMXFIMhlqfy2lwHHQeCQdPMr62s5wqXq0xbAA4A20RY66NE0V4/9OBaziTWX84m\ngSHqjxCA7g0m8vyuTUbPGsE=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@alzawaj-50afb.iam.gserviceaccount.com

# Firebase Client (Frontend)

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAA_huhlBn2YQsj29HLe1DiKTnco9kg12o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alzawaj-50afb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alzawaj-50afb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alzawaj-50afb.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=423822963344
NEXT_PUBLIC_FIREBASE_APP_ID=1:423822963344:web:9bf562ffc8387b9eef9e15
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-64NDG1021P
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNt2hdSJmt1sTunmbe0VkYZjYCh5_HKkIF3-kMaeJF9f3hC60BmaQ8wycPFkvhblortPUWtDk-f3qTM-89VFw-A

# ===========================================

# FRONTEND PUBLIC VARIABLES

# ===========================================

NEXT_PUBLIC_APP_NAME=Alzawaj Platform
NEXT_PUBLIC_APP_DESCRIPTION=Islamic Marriage Platform
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/alzawaj
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_HFNVWs3EBDzcR9BRWARlKhfqlqI=

# Analytics (Optional)

NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-64NDG1021P
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true

# Feature Flags

NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_PHOTOS=true

# ===========================================

# BACKEND CONFIGURATION

# ===========================================

NODE_ENV=production
PORT=5000
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_CREDENTIALS=true
BACKEND_URL=http://backend:5000

# Rate Limiting

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings

MAX_FILE_SIZE=10485760 # 10MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# Logging

LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Monitoring

ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30000

# ===========================================

# FRONTEND CONFIGURATION

# ===========================================

NEXT_PUBLIC_API_URL=http://r4kgg4g8s0c4kk4o44g0kc4o.116.203.98.236.sslip.io
NEXT_PUBLIC_APP_URL=http://b48g4sc8cckkcc88s8so0sw8.116.203.98.236.sslip.io

# ===========================================

# PORT CONFIGURATION (Optional)

# ===========================================

FRONTEND_PORT=3000
BACKEND_PORT=5000
MONGODB_PORT=27017
REDIS_PORT=6379

# ===========================================

# INSTRUCTIONS

# ===========================================

# 1. Replace all placeholder values with your actual service credentials

# 2. Add these variables to your Coolify application environment settings

# 3. Make sure to use HTTPS URLs for FRONTEND_URL and BACKEND_URL in production

# 4. Keep all SECRET and PRIVATE_KEY values secure and never commit them to git

# 5. Test all external service connections before deploying to production
