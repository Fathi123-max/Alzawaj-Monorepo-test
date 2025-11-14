import admin from "firebase-admin";

let initialized = false;

export function getFirebaseAdmin(): admin.app.App {
  if (initialized && admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not set in environment variables");
  }

  // Handle escaped newlines if provided via env
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  initialized = true;
  return admin.app();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

export async function generateEmailVerificationLink(
  email: string,
  actionCodeSettings: admin.auth.ActionCodeSettings,
): Promise<string> {
  const auth = getAuth();
  return auth.generateEmailVerificationLink(email, actionCodeSettings);
}

