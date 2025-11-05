import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Define interfaces for custom logger functions
interface ApiRequestData {
  method: string;
  url: string;
  statusCode: any;
  responseTime: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
  userId?: any;
}

interface SecurityEventData {
  event: string;
  details: any;
  request?:
    | {
        ip?: string | undefined;
        userAgent?: string | undefined;
        url?: string | undefined;
        userId?: any;
      }
    | undefined;
  timestamp: string;
}

interface AuditLogData {
  action: string;
  resource: string;
  userId: string;
  details?: any;
  timestamp: string;
}

interface CustomLogger extends winston.Logger {
  apiRequest: (req: Request, res: any, responseTime: number) => void;
  apiError: (error: Error, req: Request) => void;
  security: (event: string, details: any, req?: Request) => void;
  audit: (
    action: string,
    resource: string,
    userId: string,
    details?: any,
  ) => void;
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint(),
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure transports
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV === "development") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// File transports
if (process.env.NODE_ENV !== "test") {
  // Error log - only error level
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  );

  // Combined log - all levels
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  );

  // Access log - for API requests
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, "access-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
      level: "http",
    }),
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "zawag-api",
    environment: process.env.NODE_ENV,
  },
  transports,
}) as CustomLogger;

// Add custom log levels for specific use cases
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  http: "magenta",
  verbose: "white",
  debug: "green",
  silly: "grey",
});

// Helper functions
logger.apiRequest = (req: Request, res: any, responseTime: number): void => {
  const requestData: ApiRequestData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: (req as any).user?.id || "anonymous",
  };

  logger.http("API Request", requestData);
};

logger.apiError = (error: Error, req: Request): void => {
  logger.error("API Error", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userId: (req as any).user?.id || "anonymous",
    },
  });
};

logger.security = (event: string, details: any, req?: Request): void => {
  const securityData: SecurityEventData = {
    event,
    details,
    request: req
      ? {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.originalUrl,
          userId: (req as any).user?.id || "anonymous",
        }
      : undefined,
    timestamp: new Date().toISOString(),
  };

  logger.warn("Security Event", securityData);
};

logger.audit = (
  action: string,
  resource: string,
  userId: string,
  details: any = {},
): void => {
  const auditData: AuditLogData = {
    action,
    resource,
    userId,
    details,
    timestamp: new Date().toISOString(),
  };

  logger.info("Audit Log", auditData);
};

export { logger };
export default logger;
