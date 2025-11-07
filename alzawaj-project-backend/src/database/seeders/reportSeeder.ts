import mongoose from 'mongoose';
import logger from '../../config/logger';
import { Report } from '../../models/Report';
import { User } from '../../models/User';

export const seedReports = async () => {
  try {
    logger.info('🌱 Seeding reports...');

    // Get some users for reports
    const users = await User.find().limit(10);
    if (users.length < 2) {
      logger.warn('⚠️ Not enough users to create reports');
      return;
    }

    const user0 = users[0]!;
    const user1 = users[1]!;
    const user2 = users[2];
    const user3 = users[3];
    const user4 = users[4];
    const user5 = users[5];

    const reports = [
      {
        reporterId: user0._id,
        reportedUserId: user1._id,
        reason: 'inappropriate-content',
        description: 'المستخدم يتصرف بطريقة غير مهذبة في الدردشة',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      ...(user2 && user3
        ? [
            {
              reporterId: user2._id,
              reportedUserId: user3._id,
              reason: 'harassment',
              description: 'المستخدم يرسل رسائل مضايقة غير مرغوب فيها',
              status: 'investigating',
              priority: 'high',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
              assignedTo: user0._id,
              assignedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            },
          ]
        : []),
      ...(user4 && user5
        ? [
            {
              reporterId: user4._id,
              reportedUserId: user5._id,
              reason: 'fake-profile',
              description: 'الصور في الملف الشخصي تبدو مزيفة',
              status: 'resolved',
              priority: 'medium',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              resolvedBy: user0._id,
              resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
              resolutionNotes: 'تم التحقق من الملف الشخصي وتبين أنه حقيقي',
              actionTaken: 'no-action',
            },
            {
              reporterId: user5._id,
              reportedUserId: user0._id,
              reason: 'spam',
              description: 'المستخدم يرسل رسائل ترويجية متعددة',
              status: 'dismissed',
              priority: 'low',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
              resolvedBy: user1._id,
              resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              resolutionNotes: 'تم فحص الرسائل وتبين أنها غير مزعجة',
              actionTaken: 'no-action',
            },
          ]
        : []),
    ];

    const createdReports = await Report.insertMany(reports);
    logger.info(`✅ Created ${createdReports.length} reports`);

    return createdReports;
  } catch (error) {
    logger.error('❌ Error seeding reports:', error);
    throw error;
  }
};
