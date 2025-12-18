import mongoose from "mongoose";
import { User } from "../models/User";
import crypto from "crypto";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function generateVerificationToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to database");

    // Find the user
    const user = await User.findById("69170c31c72716be8d7e44bf");
    if (user) {
      console.log("Current status:", {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: !!user.emailVerificationToken,
      });

      // Generate a new verification token (following the same pattern as the User model)
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Hash the token since that's how it's stored in the database
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Set the token and expiration (24 hours from now)
      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await user.save();

      console.log("Token generated and saved to database");
      console.log("Plain token (for verification):", token);
      console.log("Token expires:", user.emailVerificationExpires);
    } else {
      console.log("User not found");
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error);
  }
}

generateVerificationToken();
