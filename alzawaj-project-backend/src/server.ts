import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import configurations and middleware
import connectDB from "./config/database";
import logger from "./config/logger";
import { errorHandler, notFound } from "./middleware/errorMiddleware";
import { rateLimitConfig } from "./config/rateLimiting";
import { initializeSocketHandlers, ExtendedServer } from "./sockets/notificationHandler";

// Import routes
import authRoutes from "./routes/authRoutes";
import profileRoutes from './routes/profileRoutes';
import searchRoutes from './routes/searchRoutes';
import requestRoutes from './routes/requestRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportsRoutes from './routes/reportsRoutes';
import adminRoutes from './routes/adminRoutes';
import debugRoutes from './routes/debugRoutes';
import verificationRoutes from './routes/verificationRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';

const app: Express = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      logger.debug(`Socket.IO CORS: Incoming origin: ${origin}`);
      logger.debug(`Socket.IO CORS: Allowed origins: ${JSON.stringify(allowedOrigins)}`); // Using the same allowedOrigins for consistency

      // Use the same logic as the main CORS configuration
      if (!origin) {
        logger.debug(`Socket.IO CORS: No origin provided - allowed.`);
        callback(null, true);
        return;
      }

      // Check if the origin is in the allowed list or is a matching pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        logger.debug(`Socket.IO CORS: Origin ${origin} allowed.`);
        callback(null, true);
      } else {
        logger.error(`Socket.IO CORS: Origin ${origin} not allowed.`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Connect to MongoDB
logger.info("Connecting to MongoDB...");
connectDB()
  .then(() => {
    logger.info("Successfully connected to MongoDB");
    
    // Create search text index
    import('./models/Profile')
      .then((ProfileModule) => {
        const Profile = ProfileModule.default || ProfileModule.Profile;
        if (Profile && typeof (Profile as any).createSearchIndex === 'function') {
          (Profile as any).createSearchIndex().catch((error: any) => {
            logger.error("Error creating search index:", error);
          });
        }
      })
      .catch((error: any) => {
        logger.error("Error importing Profile model for index creation:", error);
      });
  })
  .catch((error) => {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });

// Trust proxy (for deployment behind reverse proxy)
app.set("trust proxy", 1);

// CORS configuration - MUST be before other middleware to handle preflight requests
const corsOriginEnv = process.env.CORS_ORIGIN;
let allowedOrigins: (string | RegExp)[] = [
  "http://localhost:3000",
  "http://116.203.98.236:3000",
  "http://127.0.0.1:3000",
  "http://vw4ksss8cggwkgwwo8w4o8sk.116.203.98.236.sslip.io"
];

if (corsOriginEnv) {
  // Split the environment variable by comma and trim whitespace
  allowedOrigins = corsOriginEnv.split(",").map(origin => origin.trim());
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    logger.debug(`CORS: Incoming origin: ${origin}`);
    logger.debug(`CORS: Allowed origins: ${JSON.stringify(allowedOrigins)}`);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.debug(`CORS: No origin provided - allowed.`);
      callback(null, true);
      return;
    }

    // Check if the origin is in the allowed list or is a matching pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      logger.debug(`CORS: Origin ${origin} allowed.`);
      callback(null, true);
    } else {
      logger.error(`CORS: Origin ${origin} not allowed.`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Apply CORS middleware
app.use(cors(corsOptions));

// Add a middleware to set the Access-Control-Allow-Private-Network header
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// Compression
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );
}

// Rate limiting
app.use(rateLimitConfig.general);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API Routes
app.use("/api/auth", rateLimitConfig.auth, authRoutes);
app.use('/api/auth/verification', verificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', rateLimitConfig.search, searchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.use('/api/debug', debugRoutes);

// Socket.IO integration
app.set("io", io);
initializeSocketHandlers(io);

// Set the io instance in the notification service
import { setIoInstance } from './services/notificationService';

setIoInstance(io as ExtendedServer);

// API documentation
try {
  const swaggerUi = require("swagger-ui-express");
  const swaggerModule = require("./config/swagger") || {};
  const swaggerSpecs = swaggerModule.default || swaggerModule;
  // Serve the OpenAPI specification as JSON
  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
} catch (error) {
  logger.warn("Swagger UI not available:", error);
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Zawag Islamic Marriage Platform API",
    version: "1.0.0",
    status: "Running",
    documentation:
      process.env.NODE_ENV === "development"
        ? "/api-docs"
        : "Contact admin for documentation",
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error closing MongoDB connection:", error);
      process.exit(1);
    }
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error closing MongoDB connection:", error);
      process.exit(1);
    }
  });
});

// Uncaught exception handler
process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (err: Error, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", err);
  server.close(() => {
    process.exit(1);
  });
});

const PORT = process.env.PORT || 5001;

logger.info(`Starting server in ${process.env.NODE_ENV} mode on port ${PORT}`);
logger.info("Environment variables:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
});

server.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
  logger.info(`📝 Process ID: ${process.pid}`);
});

export { app, server, io };
