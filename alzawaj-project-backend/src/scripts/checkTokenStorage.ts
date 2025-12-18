import mongoose from "mongoose";
import { User } from "../models/User";
import crypto from "crypto";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function checkTokenStorage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to database");

    // Find the user we just created
    const user = await User.findOne({
      email: "testverify@example.com",
    }).select("+emailVerificationToken");

    if (!user) {
      console.log("User not found");
      await mongoose.connection.close();
      return;
    }

    console.log("User found:", {
      email: user.email,
      token: user.emailVerificationToken,
      isEmailVerified: user.isEmailVerified,
      tokenLength: user.emailVerificationToken?.length,
    });

    // Check if the token looks like a hash (SHA256 should be 64 characters)
    if (user.emailVerificationToken) {
      console.log("Token length:", user.emailVerificationToken.length);

      // Test: if this is a hash, creating a hash of the original value should NOT match
      const originalValue = "6gfyp9uqgxt6mw7ti6c3qo"; // The value we tried to send
      const hashOfOriginal = crypto
        .createHash("sha256")
        .update(originalValue)
        .digest("hex");

      console.log(
        "Original token length (6gfyp9uqgxt6mw7ti6c3qo):",
        originalValue.length
      );
      console.log("Hash of original would be length:", hashOfOriginal.length);
      console.log(
        "Does token look like a hash?:",
        user.emailVerificationToken.length === 64
      );

      // Check if the stored token matches the hash of the original
      console.log(
        "Stored token matches hash of original?",
        user.emailVerificationToken === hashOfOriginal
      );
      console.log("Raw stored token:", user.emailVerificationToken);
    }

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the function
checkTokenStorage();
