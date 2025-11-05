import express, { Router } from "express";
import { query, param, body } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import { rateLimitConfig } from "../config/rateLimiting";
import * as searchController from "../controllers/searchController";
import {
  ALLOWED_EDUCATION_LEVELS,
  ALLOWED_MARITAL_STATUS,
  ALLOWED_RELIGIOUS_LEVELS,
} from "../utils/constants";

const router: Router = express.Router();

// Validation rules
const searchValidation = [
  query("ageMin").optional().isInt({ min: 18, max: 100 }).withMessage("العمر الأدنى يجب أن يكون بين 18-100"),
  query("ageMax").optional().isInt({ min: 18, max: 100 }).withMessage("العمر الأعلى يجب أن يكون بين 18-100"),
  query("location").optional().trim().isLength({ max: 100 }).withMessage("الموقع طويل جداً"),
  query("education").optional().trim().isIn(ALLOWED_EDUCATION_LEVELS).withMessage("المستوى التعليمي غير صحيح"),
  query("maritalStatus").optional().trim().isIn(ALLOWED_MARITAL_STATUS).withMessage("الحالة الاجتماعية غير صحيحة"),
  query("religiousCommitment").optional().trim().isIn(ALLOWED_RELIGIOUS_LEVELS).withMessage("المستوى الديني غير صحيح"),
  query("profession").optional().trim().isLength({ max: 100 }).withMessage("المهنة طويلة جداً"),
  query("page").optional().isInt({ min: 1 }).withMessage("رقم الصفحة يجب أن يكون رقمًا موجبًا"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("الحد يجب أن يكون بين 1-100"),
  query("fuzzy").optional().isBoolean().withMessage("يجب أن يكون fuzzy قيمة منطقية"),
  query("name").optional().trim().isLength({ max: 100 }).withMessage("الاسم طويل جداً"),
  query("hasChildren").optional().isBoolean().withMessage("يجب أن يكون hasChildren قيمة منطقية"),
  query("wantsChildren").optional().isBoolean().withMessage("يجب أن يكون wantsChildren قيمة منطقية"),
];

const quickSearchValidation = [
  query("q").notEmpty().trim().escape().withMessage("كلمة البحث مطلوبة"),
  query("q").isLength({ min: 2, max: 100 }).withMessage("كلمة البحث يجب أن تكون بين 2-100 حرف"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("الحد يجب أن يكون بين 1-50"),
  query("fuzzy").optional().isBoolean().withMessage("يجب أن يكون fuzzy قيمة منطقية"),
];

const saveSearchValidation = [
  body("name").notEmpty().trim().escape().isLength({ max: 100 }).withMessage("اسم البحث مطلوب"),
  body("criteria").isObject().withMessage("معايير البحث مطلوبة"),
];

const deleteSavedSearchValidation = [
  param("searchName").notEmpty().trim().escape().withMessage("اسم البحث مطلوب"),
];

// Routes

// Search profiles with advanced filtering
router.get("/", protect, rateLimitConfig.search, searchValidation, validateRequest, searchController.searchProfiles);

// Get recommended profiles
router.get("/recommendations", protect, rateLimitConfig.search, searchController.getRecommendations);

// Quick search by name or basic criteria
router.get("/quick", protect, rateLimitConfig.search, quickSearchValidation, validateRequest, searchController.quickSearch);

// Get search filters options
router.get("/filters", protect, rateLimitConfig.search, searchController.getSearchFilters);

// Save search criteria as favorites
router.post("/save", protect, rateLimitConfig.search, saveSearchValidation, validateRequest, searchController.saveSearchCriteria);

// Get saved search criteria
router.get("/saved", protect, rateLimitConfig.search, searchController.getSavedSearches);

// Delete saved search
router.delete("/saved/:searchName", protect, rateLimitConfig.search, deleteSavedSearchValidation, validateRequest, searchController.deleteSavedSearch);

// Get search statistics
router.get("/stats", protect, rateLimitConfig.search, searchController.getSearchStats);

export default router;