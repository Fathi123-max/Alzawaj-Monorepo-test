import mongoose from "mongoose";
import { User } from "../models/User";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function resetEmailVerification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to database");

    // Find the user and reset their email verification
    const user = await User.findById("69170c31c72716be8d7e44bf");
    if (user) {
      console.log("Before update:", {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: !!user.emailVerificationToken,
      });

      // Reset the email verification status
      user.isEmailVerified = false;
      user.emailVerifiedAt = undefined;
      user.emailVerificationToken = undefined as any;
      user.emailVerificationExpires = undefined as any;

      await user.save();

      console.log("After update:", {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: !!user.emailVerificationToken,
      });
    } else {
      console.log("User not found");
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error);
  }
}

resetEmailVerification();
