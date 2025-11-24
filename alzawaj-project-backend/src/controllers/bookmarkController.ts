import { Request, Response } from 'express';
import Bookmark from '../models/Bookmark';
import User from '../models/User';

// Add bookmark
export const addBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { profileId } = req.body;

    // Check if profile exists
    const profile = await User.findById(profileId);
    if (!profile) {
      res.status(404).json({ success: false, message: 'الملف الشخصي غير موجود' });
      return;
    }

    // Check if already bookmarked
    const existing = await Bookmark.findOne({ userId, bookmarkedUserId: profileId });
    if (existing) {
      res.status(400).json({ success: false, message: 'تم حفظ هذا الملف مسبقاً' });
      return;
    }

    const bookmark = await Bookmark.create({ userId, bookmarkedUserId: profileId });
    res.status(201).json({ success: true, data: bookmark, message: 'تم حفظ الملف الشخصي' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove bookmark
export const removeBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { profileId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({ userId, bookmarkedUserId: profileId });
    if (!bookmark) {
      res.status(404).json({ success: false, message: 'الملف غير محفوظ' });
      return;
    }

    res.json({ success: true, message: 'تم إلغاء حفظ الملف الشخصي' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookmarks
export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const bookmarks = await Bookmark.find({ userId })
      .populate('bookmarkedUserId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bookmark.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        bookmarks: bookmarks.map(b => b.bookmarkedUserId),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
          limit
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check if profile is bookmarked
export const checkBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { profileId } = req.params;

    const bookmark = await Bookmark.findOne({ userId, bookmarkedUserId: profileId });
    res.json({ success: true, data: { isBookmarked: !!bookmark } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
