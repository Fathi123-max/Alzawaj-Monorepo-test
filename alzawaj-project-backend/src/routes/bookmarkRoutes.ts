import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';
import { protect } from '../middleware/authMiddleware';
import * as bookmarkController from '../controllers/bookmarkController';

const router: express.Router = express.Router();

// Add bookmark
router.post(
  '/',
  protect,
  body('profileId').isMongoId().withMessage('معرف الملف الشخصي غير صحيح'),
  validateRequest,
  bookmarkController.addBookmark as any
);

// Remove bookmark
router.delete(
  '/:profileId',
  protect,
  param('profileId').isMongoId().withMessage('معرف الملف الشخصي غير صحيح'),
  validateRequest,
  bookmarkController.removeBookmark as any
);

// Get all bookmarks
router.get('/', protect, bookmarkController.getBookmarks as any);

// Check if bookmarked
router.get(
  '/check/:profileId',
  protect,
  param('profileId').isMongoId().withMessage('معرف الملف الشخصي غير صحيح'),
  validateRequest,
  bookmarkController.checkBookmark as any
);

export default router;
