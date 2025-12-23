import mongoose from "mongoose";
import logger from "./logger";

export const connectDB = async (): Promise<void> => {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const attemptConnection = async (uri: string, isRetry = false): Promise<boolean> => {
    try {
      const maskedURI = uri.replace(/:([^:@]+)@/, ":****@");
      logger.info(`${isRetry ? "Retrying" : "Attempting"} to connect to MongoDB...`);
      
      await mongoose.connect(uri, options);
      logger.info(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("Authentication failed") && !isRetry) {
        logger.warn("Authentication failed. Checking if 'authSource=admin' is needed...");
        
        // If it's an auth failure and we haven't tried authSource=admin yet
        if (!uri.includes("authSource=")) {
          const separator = uri.includes("?") ? "&" : "?";
          const retryURI = `${uri}${separator}authSource=admin`;
          return await attemptConnection(retryURI, true);
        }
      }
      
      logger.error(`Database connection failed: ${errorMessage}`);
      return false;
    }
  };

  try {
    let mongoURI: string | undefined =
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_TEST_URI
        : process.env.MONGODB_URI;

    if (mongoURI) {
      mongoURI = mongoURI.replace(/\s/g, "");
      
      // Check for potentially unencoded special characters in the password part
      const passwordMatch = mongoURI.match(/:([^:@]+)@/);
      if (passwordMatch && passwordMatch[1]) {
        const password = passwordMatch[1];
        if (/[#?\[\]@:/]/.test(password)) {
          logger.warn("⚠️ Your MongoDB password contains special characters that might need URL encoding (e.g. @ should be %40). This could cause authentication to fail.");
        }
      }
    }

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    const success = await attemptConnection(mongoURI);
    
    if (!success) {
      logger.info("💡 TIP: If using 'root' user, ensure your password is correct and URL-encoded if it contains special characters.");
      process.exit(1);
    }

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
    logger.error("Critical error during database setup:", error);
    process.exit(1);
  }
};

export default connectDB;
