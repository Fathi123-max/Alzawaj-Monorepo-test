// Controller exports for TypeScript backend
export { default as authController } from "./authController";
export { default as profileController } from "./profileController";
export { default as requestController } from "./requestController";
export { default as searchController } from "./searchController";
export { default as chatController } from "./chatController";
export { default as notificationController } from "./notificationController";
export { default as adminController } from "./adminController";

// Re-export all controller methods (excluding duplicates)
export * from "./authController";
export * from "./searchController";
export * from "./notificationController";
export * from "./adminController";