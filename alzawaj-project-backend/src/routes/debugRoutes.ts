import express, { Router } from "express";
import { getAllProfiles, searchProfilesByName } from "../controllers/debugController";
import { protect } from "../middleware/authMiddleware";

const router: Router = express.Router();

// Get all profiles 
router.get("/all", protect, getAllProfiles);

// Search profiles by name
router.get("/search", protect, searchProfilesByName);

export default router;