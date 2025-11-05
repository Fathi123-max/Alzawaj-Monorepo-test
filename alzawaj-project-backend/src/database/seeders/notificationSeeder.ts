import { Notification } from '../../models/Notification';
import { User } from '../../models/User';
import logger from '../../config/logger';
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';

export const seedNotifications = async () => {
  try {
    logger.info('🌱 Seeding notifications...');

    // Get users to link with notifications
    const users = await User.find({ role: 'user' }).sort({ createdAt: 1 });
    if (users.length < 2) {
      logger.error('❌ Not enough users found - please seed users first');
      return;
    }

    // Create notifications for users
    let notificationCount = 0;
    for (const user of users) {
      const numOfNotifications = faker.number.int({ min: 3, max: 10 });
      for (let i = 0; i < numOfNotifications; i++) {
        const notificationTypes = [
          'marriage_request',
          'message',
          'profile_view',
          'match',
          'guardian_approval',
          'verification',
          'system'
        ];
        
        const notificationData: any = {
          user: user._id,
          type: faker.helpers.arrayElement(notificationTypes) as any,
          title: faker.lorem.sentence({ min: 1, max: 3 }),
          message: faker.lorem.sentence({ min: 1, max: 10 }),
          isRead: faker.datatype.boolean(),
          isDeleted: false,
        };

        // Set data based on notification type
        switch(notificationData.type) {
          case 'marriage_request':
            notificationData.data = {
              requestId: new mongoose.Types.ObjectId(),
              senderName: faker.person.fullName(),
              senderId: new mongoose.Types.ObjectId(),
            };
            break;
          case 'message':
            notificationData.data = {
              senderName: faker.person.fullName(),
              senderId: new mongoose.Types.ObjectId(),
              messagePreview: faker.lorem.sentence({ min: 1, max: 5 }),
            };
            break;
          case 'profile_view':
            notificationData.data = {
              profileId: new mongoose.Types.ObjectId(),
              viewerName: faker.person.fullName(),
              viewerId: new mongoose.Types.ObjectId(),
            };
            break;
          case 'match':
            notificationData.data = {
              profileId: new mongoose.Types.ObjectId(),
              matchName: faker.person.fullName(),
              compatibilityScore: faker.number.int({ min: 70, max: 100 }),
            };
            break;
          case 'guardian_approval':
          case 'verification':
          case 'system':
            notificationData.data = {
              url: faker.internet.url(),
            };
            break;
          default:
            notificationData.data = {};
        }

        // Add timestamp
        notificationData.createdAt = faker.date.past({ years: 0.5 });

        await Notification.create(notificationData);
        notificationCount++;
      }
    }

    logger.info(`✅ Notifications seeding completed. Created ${notificationCount} notifications for ${users.length} users.`);
  } catch (error) {
    logger.error('❌ Error seeding notifications:', error);
    throw error;
  }
};