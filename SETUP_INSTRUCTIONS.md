# Alzawaj Project - Environment Setup Instructions

This document provides links and instructions to obtain the necessary keys and credentials for your `.env.local` file.

## 🔐 Required Services and Configuration Links

### 1. Firebase Configuration

#### Frontend Firebase (Client) Keys

To get these keys, you need to create a Firebase project:

**🔗 [Create Firebase Project](https://console.firebase.google.com/)**

Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. In your project, go to Project Settings (⚙️ icon)
5. Under "Your apps", click "Add app" and select "Web"
6. Register your app (name it "Alzawaj Platform")
7. You'll get the configuration object with these values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Firebase VAPID Key (for Push Notifications)

**🔗 [Generate VAPID Key](https://web-push-codelab.glitch.me/)**

Steps:

1. Visit the Web Push Code Lab
2. Scroll down to "Application Server Public Key" section
3. Copy the generated VAPID key
4. Set it as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

#### Backend Firebase (Admin) - Service Account

**🔗 [Firebase Service Account](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)**

Steps:

1. In Firebase Console, go to Project Settings
2. Click on "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract these values:
   - `FIREBASE_PROJECT_ID` (from the JSON)
   - `FIREBASE_CLIENT_EMAIL` (from the JSON)
   - `FIREBASE_PRIVATE_KEY_ID` (from the JSON)
   - `FIREBASE_PRIVATE_KEY` (from the JSON, replace newlines with `\n`)

### 2. ImageKit Configuration

**🔗 [Create ImageKit Account](https://imagekit.io/register)**

Steps:

1. Sign up at [ImageKit.io](https://imagekit.io/register)
2. After verification, go to your dashboard
3. Navigate to "Developer settings"
4. Get these credentials:
   - `IMAGEKIT_PUBLIC_KEY` (Public key)
   - `IMAGEKIT_PRIVATE_KEY` (Private key)
   - `IMAGEKIT_URL_ENDPOINT` (URL Endpoint, usually `https://ik.imagekit.io/your-username`)

### 3. Email Service (SMTP)

#### Option A: Gmail SMTP (Recommended for Development)

**🔗 [Gmail App Password](https://support.google.com/accounts/answer/185833)**

Steps:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/)
3. Navigate to Security → 2-Step Verification → App passwords
4. Generate an app password for "Mail"
5. Use these settings:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASS=your-app-password` (16-character app password, NOT your Gmail password)
   - `SMTP_SECURE=true`

#### Option B: Ethereal Email (For Testing Only)

**🔗 [Ethereal Email](https://ethereal.email/)**

Steps:

1. Visit [Ethereal Email](https://ethereal.email/)
2. Click "Create Free Account"
3. Use the generated credentials for testing (emails won't actually be sent)

### 4. Database Services

#### MongoDB (Local Development)

For local development, you can:

1. **Install locally**: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. **Use Docker**: The `docker-compose.local.yaml` will start MongoDB for you
3. **Use MongoDB Atlas** (Cloud): [MongoDB Atlas](https://www.mongodb.com/atlas)

#### Redis (Local Development)

For local development:

1. **Install locally**: [Redis Downloads](https://redis.io/download/)
2. **Use Docker**: The `docker-compose.local.yaml` will start Redis for you

### 5. Security Keys (JWT)

#### JWT Secrets

Generate secure random keys:

**🔗 [Generate Random String](https://www.random.org/strings/)**

Or use Node.js:

```javascript
// Run in Node.js console
require("crypto").randomBytes(64).toString("hex");
```

Set these in your `.env.local`:

- `JWT_SECRET` (64+ character random string)
- `JWT_REFRESH_SECRET` (64+ character random string)

## 📋 Quick Setup Checklist

- [ ] Create Firebase project and get client keys
- [ ] Generate Firebase VAPID key
- [ ] Create Firebase service account and extract admin keys
- [ ] Create ImageKit account and get API keys
- [ ] Set up Gmail SMTP or Ethereal for email
- [ ] Install/configure MongoDB and Redis
- [ ] Generate JWT secrets
- [ ] Update `.env.local` with all credentials
- [ ] Test the application

## 🚀 Testing Your Setup

After setting up all credentials:

1. **Test MongoDB Connection**:

   ```bash
   mongosh "mongodb://localhost:27017/alzawaj-dev"
   ```

2. **Test Redis Connection**:

   ```bash
   redis-cli ping
   # Should return "PONG"
   ```

3. **Test Email (if using Gmail)**:

   - Try sending a test email through your application
   - Check Gmail security alerts if authentication fails

4. **Test Firebase**:
   - Check Firebase console for authentication attempts
   - Verify storage bucket access

## ⚠️ Security Notes

1. **Never commit `.env.local` to version control**
2. **Use different credentials for development vs production**
3. **Rotate keys regularly**
4. **Use strong, unique passwords**
5. **Enable 2FA on all accounts**

## 🔧 Troubleshooting

### Firebase Issues

- Ensure your Firebase project has Authentication enabled
- Check that your domain (localhost:3000) is added to authorized domains
- Verify service account has proper permissions

### ImageKit Issues

- Check that your account is verified
- Ensure API keys are copied correctly
- Verify URL endpoint format

### Email Issues

- For Gmail: Ensure 2FA is enabled and app password is correct
- Check Gmail security alerts for blocked sign-ins
- For Ethereal: Remember emails are for testing only

### Database Issues

- Ensure MongoDB and Redis are running
- Check port availability (27017 for MongoDB, 6379 for Redis)
- Verify connection strings in `.env.local`

## 📞 Support

If you encounter issues:

1. Check the application logs
2. Verify all credentials are correct
3. Test each service individually
4. Consult the respective service documentation
