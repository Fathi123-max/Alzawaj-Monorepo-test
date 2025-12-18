import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "../.env.local" });
console.log("Loaded env vars:", {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || "Not set",
  JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
});

import { connectDB } from "../../config/database";
import logger from "../../config/logger";
import { User } from "../../models/User";
import { Profile } from "../../models/Profile";
import { AdminSettings } from "../../models/AdminSettings";
import { MarriageRequest } from "../../models/MarriageRequest";
import { Notification } from "../../models/Notification";
import { ChatRoom } from "../../models/ChatRoom";
import { Message } from "../../models/Message";
import { Report } from "../../models/Report";

// Import your seeder functions
import { seedUsers } from "./userSeeder";
import { seedProfiles } from "./profileSeeder";
import { seedAdminSettings } from "./adminSettingsSeeder";
import { seedMarriageRequests } from "./marriageRequestSeeder";
import { seedNotifications } from "./notificationSeeder";
import { seedChatRooms } from "./chatRoomSeeder";
import { seedMessages } from "./messageSeeder";
import { seedReports } from "./reportSeeder";

export const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    logger.info("🚀 Starting database seeding process...");

    // Clear existing data (optional - comment out if you don't want to clear)
    logger.info("🗑️  Clearing existing data...");
    await Message.deleteMany({});
    await Report.deleteMany({});
    await ChatRoom.deleteMany({});
    await Notification.deleteMany({});
    await MarriageRequest.deleteMany({});
    await Profile.deleteMany({});
    await User.deleteMany({});
    await AdminSettings.deleteMany({});

    // Run seeders
    await seedUsers();
    await seedProfiles();
    await seedAdminSettings();
    await seedMarriageRequests();
    await seedChatRooms();
    await seedMessages();
    // await seedReports(); // Temporarily skipped due to validation error
    await seedNotifications();

    logger.info("✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during database seeding:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
