// Service exports for TypeScript backend
export { default as emailService } from "./resendEmailService";
export { default as smsService } from "./smsService";
export { default as uploadService } from "./uploadService";
export { default as chatService } from "./chatService";
export { default as adminService } from "./adminService";
export { default as searchService } from "./searchService";

// Re-export all service classes and functions
export * from "./resendEmailService";
export * from "./smsService";
export * from "./uploadService";
export * from "./chatService";
export * from "./notificationService";
export * from "./adminService";
export * from "./searchService";