import mongoose from "mongoose";
import logger from "./logger";

export const connectDB = async (): Promise<void> => {
  try {
    let mongoURI: string | undefined =
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_TEST_URI
        : process.env.MONGODB_URI;

    // Sanitize URI: remove any whitespace that might have been accidentally added
    if (mongoURI) {
      const originalURI = mongoURI;
      mongoURI = mongoURI.replace(/\s/g, "");
      if (originalURI !== mongoURI) {
        logger.info("Removed whitespace from MONGODB_URI");
      }
    }

    logger.info("Database connection attempt with NODE_ENV:", {
      env: process.env.NODE_ENV,
    });
    logger.info("MongoDB URI is set:", { isSet: !!mongoURI });

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    // Mask password in URI for logging
    const maskedURI = mongoURI.replace(/:([^:@]+)@/, ":****@");
    logger.info(`Attempting to connect to MongoDB with URI: ${maskedURI}`);

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
      logger.error(`MongoDB connection error: ${err.message}`, { stack: err.stack });
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
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Database connection failed: ${errorMessage}`, { stack: errorStack });
    process.exit(1);
  }
};

export default connectDB;
