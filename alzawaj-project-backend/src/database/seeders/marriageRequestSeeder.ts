import { MarriageRequest } from '../../models/MarriageRequest';
import { User } from '../../models/User';
import logger from '../../config/logger';
import { faker } from '@faker-js/faker';

export const seedMarriageRequests = async () => {
  try {
    logger.info('🌱 Seeding marriage requests...');

    // Get users to link with marriage requests
    const users = await User.find({ role: 'user' }).sort({ createdAt: 1 });
    if (users.length < 2) {
      logger.error('❌ Not enough users found - please seed users first');
      return;
    }

    // Create marriage requests between different users
    const requestsToCreate = 40; // Create 40 marriage requests for better testing data
    let createdCount = 0;

    for (let i = 0; i < requestsToCreate; i++) {
      // Select random sender and receiver (different users)
      const senderIndex = faker.number.int({ min: 0, max: users.length - 1 });
      let receiverIndex;
      do {
        receiverIndex = faker.number.int({ min: 0, max: users.length - 1 });
      } while (receiverIndex === senderIndex);

      const sender = users[senderIndex];
      const receiver = users[receiverIndex];

      if (!sender || !receiver) {
        continue; // Skip if either sender or receiver is undefined
      }

      // Check if a request already exists between these users
      const existingRequest = await MarriageRequest.findOne({
        $or: [
          { sender: sender._id, receiver: receiver._id },
          { sender: receiver._id, receiver: sender._id }
        ],
        status: { $in: ['pending', 'accepted'] }
      });

      if (!existingRequest) {
        const status = faker.helpers.arrayElement(['pending', 'accepted', 'rejected', 'cancelled']) as any;
        const message = faker.lorem.sentence();

        const requestData: any = {
          sender: sender._id,
          receiver: receiver._id,
          status,
          message,
          priority: faker.helpers.arrayElement(['low', 'normal', 'high']) as any,
          contactInfo: {
            phone: sender.phone || '+1234567890',
            preferredContactMethod: 'phone' as const,
          },
          guardianApproval: {
            isRequired: faker.datatype.boolean(),
            isApproved: faker.datatype.boolean(),
            approvalDate: faker.datatype.boolean() ? new Date() : undefined,
          },
          metadata: {
            source: faker.helpers.arrayElement(['search', 'recommendation', 'direct']) as any,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };

        // Add response if the status is accepted/rejected
        if (status === 'accepted' || status === 'rejected') {
          requestData.response = {
            message: faker.lorem.sentence(),
            responseDate: new Date(),
            reason: faker.helpers.arrayElement(['interested', 'not_compatible', 'not_ready', 'already_engaged', 'other']) as any,
          };
        }

        // Add meeting details if request was accepted
        if (status === 'accepted') {
          const arrangeMeeting = faker.datatype.boolean();
          if (arrangeMeeting) {
            requestData.meeting = {
              isArranged: true,
              date: faker.date.future({ years: 1 }),
              location: faker.location.city(),
              notes: faker.lorem.sentence(),
              status: faker.helpers.arrayElement(['pending', 'confirmed', 'completed', 'cancelled']) as any,
            };
          }
        }

        // Add read status
        if (status !== 'pending' || faker.datatype.boolean()) {
          requestData.isRead = true;
          requestData.readDate = new Date();
        } else {
          requestData.isRead = faker.datatype.boolean();
          if (requestData.isRead) {
            requestData.readDate = new Date();
          }
        }

        await MarriageRequest.create(requestData);
        createdCount++;
        logger.info(`✅ Created marriage request from ${sender.email || sender._id} to ${receiver.email || receiver._id} (Status: ${status})`);
      } else {
        logger.info(`ℹ️  Marriage request already exists between ${sender.email || sender._id} and ${receiver.email || receiver._id}`);
      }
    }

    logger.info(`✅ Marriage requests seeding completed. Created ${createdCount} requests.`);
  } catch (error) {
    logger.error('❌ Error seeding marriage requests:', error);
    throw error;
  }
};