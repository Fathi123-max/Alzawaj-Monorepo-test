import { Resend } from "resend";

// Function to create Resend client
const createResendClient = (): Resend => {
  return new Resend(process.env.RESEND_API_KEY || "");
};

// Create the Resend client
const resend = createResendClient();

// Export configuration check
export const isResendConfigured = (): boolean => {
  return !!process.env.RESEND_API_KEY;
};

// Export the Resend client
export default resend;

// Get the default sender email
export const getDefaultSender = (): string => {
  return process.env.RESEND_SENDER_EMAIL || "noreply@yourdomain.com";
};

// Get the default sender name
export const getDefaultSenderName = (): string => {
  return process.env.RESEND_SENDER_NAME || "منصة الزواج الإسلامية";
};