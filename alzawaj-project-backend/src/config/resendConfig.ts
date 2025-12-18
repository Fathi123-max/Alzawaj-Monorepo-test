import { Resend } from "resend";

// Function to create Resend client
const createResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  // Check if apiKey is not set, undefined, or an empty string
  if (!apiKey || apiKey.trim() === '') {
    console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
    return null;
  }
  return new Resend(apiKey);
};

// Lazy initialization for the Resend client
let _resendClient: Resend | null = null;
let _initialized = false;

// Function to get the Resend client (with lazy initialization)
const getResendClient = (): Resend | null => {
  if (!_initialized) {
    _resendClient = createResendClient();
    _initialized = true;
  }
  return _resendClient;
};

// Export configuration check
export const isResendConfigured = (): boolean => {
  const apiKey = process.env.RESEND_API_KEY;
  return !!(apiKey && apiKey.trim() !== '');
};

// Export the function to get the Resend client
export default getResendClient;

// Get the default sender email
export const getDefaultSender = (): string => {
  return process.env.RESEND_SENDER_EMAIL || "noreply@yourdomain.com";
};

// Get the default sender name
export const getDefaultSenderName = (): string => {
  return process.env.RESEND_SENDER_NAME || "منصة الزواج الإسلامية";
};