import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

// Function to create transporter only when needed
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", // Use Gmail SMTP as default
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true" || false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "", // Your email address
      pass: process.env.SMTP_PASS || "", // Your email password or app password
    },
    // Add timeout settings to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
  });
};

// Create the transporter
const transporter: Transporter = createTransporter();

// Export a method to check if email is properly configured
export const isEmailConfigured = (): boolean => {
  return !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
};

// Only perform verification if needed elsewhere in the app
// Avoid doing it at module load time to prevent connection issues in deployments
export default transporter;
