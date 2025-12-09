import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

// Create a transporter object using SMTP transport
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com", // Use Gmail SMTP as default
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true" || false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "", // Your email address
    pass: process.env.SMTP_PASS || "", // Your email password or app password
  },
  // Add timeout settings to prevent hanging
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

// Verify the transporter configuration
transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export default transporter;
