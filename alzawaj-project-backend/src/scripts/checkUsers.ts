import mongoose from "mongoose";
import { User } from "../models/User";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to database");

    // Find users with email verification tokens
    const users = await User.find(
      {
        emailVerificationToken: { $exists: true, $ne: null },
      },
      {
        email: 1,
        emailVerificationToken: 1,
        emailVerificationExpires: 1,
        isEmailVerified: 1,
        createdAt: 1,
      }
    );

    console.log(`Found ${users.length} users with email verification tokens:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Token: ${user.emailVerificationToken}`);
      console.log(`   Expires: ${user.emailVerificationExpires}`);
      console.log(`   Is Verified: ${user.isEmailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log("---");
    });

    // Also find a few random users to potentially test with
    const randomUsers = await User.find({})
      .limit(5)
      .select("email isEmailVerified _id");
    console.log("\nSome sample users:");
    randomUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user._id}, Email: ${user.email}, Verified: ${user.isEmailVerified}`
      );
    });

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the function
checkUsers();
