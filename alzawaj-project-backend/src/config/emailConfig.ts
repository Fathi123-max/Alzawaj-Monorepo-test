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
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 15000, // 15 seconds
  socketTimeout: 30000, // 30 seconds
});

// Verify the transporter configuration only if SMTP credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error: Error | null, success: boolean) => {
    if (error) {
      console.error("Email configuration error:", error);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
} else {
  console.log("Email configuration not provided. Email services will be disabled.");
}

export default transporter;
