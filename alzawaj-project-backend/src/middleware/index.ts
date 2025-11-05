// Middleware exports for TypeScript backend
export { default as authMiddleware } from "./authMiddleware";
export { default as adminMiddleware } from "./adminMiddleware";
export { default as profileMiddleware } from "./profileMiddleware";
export { default as requestMiddleware } from "./requestMiddleware";
export { default as chatMiddleware } from "./chatMiddleware";
export { default as validationMiddleware } from "./validationMiddleware";
export { default as errorMiddleware } from "./errorMiddleware";

// Re-export all middleware functions (excluding duplicates)
export * from "./authMiddleware";
export * from "./profileMiddleware";
export * from "./requestMiddleware";
export * from "./chatMiddleware";
export * from "./validationMiddleware";
export * from "./errorMiddleware";