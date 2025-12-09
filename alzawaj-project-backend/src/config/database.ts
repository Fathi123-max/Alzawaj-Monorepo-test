import mongoose from "mongoose";
import logger from "./logger";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string | undefined =
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_TEST_URI
        : process.env.MONGODB_URI;

    logger.info(
      "Database connection. attempt with NODE_ENV:",
      process.env.NODE_ENV
    );
    logger.info("MongoDB URI is set:", !!mongoURI);

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    logger.info("Attempting to connect to MongoDB...");

    // Modern Mongoose connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err: Error) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful close on Node.js app termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown database connection error";
    logger.error("Database connection failed:", errorMessage);
    if (error instanceof Error) {
      logger.error("Database connection error stack:", error.stack);
    }
    process.exit(1);
  }
};

export default connectDB;
