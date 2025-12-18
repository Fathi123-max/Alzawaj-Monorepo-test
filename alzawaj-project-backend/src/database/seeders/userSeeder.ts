import { User } from '../../models/User';
import logger from '../../config/logger';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

export const seedUsers = async () => {
  try {
    console.log('[SEEDER] Seeding users...');
    console.log('[SEEDER] BCRYPT_ROUNDS from env:', process.env.BCRYPT_ROUNDS);

    // Create an admin user first
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    console.log('[SEEDER] Using bcrypt rounds:', bcryptRounds);
    const adminPassword = 'admin123@';
    console.log('[SEEDER] Admin password:', adminPassword);
    const adminUser = {
      email: 'alzawajalsaeid1@gmail.com',
      password: adminPassword,
      phone: '+1234567890',
      firstname: 'Admin',
      lastname: 'User',
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      status: 'active',
    };

    // Create admin user if it doesn't exist
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (!existingAdmin) {
      await User.create(adminUser);
      logger.info(`✅ Created admin user: ${adminUser.email}`);
    } else {
      logger.info(`ℹ️  Admin user already exists: ${adminUser.email}`);
    }

    // Generate multiple regular users with faker
    const usersToCreate = 50; // Generate 50 regular users for good testing data
    const createdUsers = [];

    for (let i = 0; i < usersToCreate; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      // Generate phone number with the format required by the schema: + followed by 1-9 and then 1-14 more digits
      const countryCode = faker.helpers.arrayElement(['1', '20', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '27', '290', '291', '297', '298', '299', '30', '31', '32', '33', '34', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '36', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '385', '386', '387', '389', '39', '40', '41', '420', '421', '423', '43', '44', '45', '46', '47', '48', '49', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '51', '52', '53', '54', '55', '56', '57', '58', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '60', '61', '62', '63', '64', '65', '66', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685', '686', '687', '688', '689', '690', '691', '692', '7', '81', '82', '84', '850', '852', '853', '855', '856', '86', '870', '878', '880', '881', '882', '883', '886', '888', '90', '91', '92', '93', '94', '95', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '98', '992', '993', '994', '995', '996', '998']);
      const localNumber = faker.string.numeric(7); // Generate 7 digits for the local number part
      const formattedPhone = `+${countryCode}${localNumber}`;
      
      const userData = {
        email,
        password: 'Password123!',
        phone: formattedPhone,
        firstname: firstName,
        lastname: lastName,
        role: 'user' as const,
        isEmailVerified: faker.datatype.boolean(),
        isPhoneVerified: faker.datatype.boolean(),
        isActive: true,
        status: faker.helpers.arrayElement(['active', 'pending', 'suspended', 'blocked']) as 'active' | 'pending' | 'suspended' | 'blocked',
        lastLoginAt: faker.date.past({ years: 1 }),
        lastActiveAt: faker.date.recent({ days: 7 }),
        loginAttempts: faker.number.int({ min: 0, max: 5 }),
      };

      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user._id);
        logger.info(`✅ Created user: ${userData.email}`);
      } else {
        logger.info(`ℹ️  User already exists: ${userData.email}`);
      }
    }

    logger.info(`✅ Users seeding completed. Created ${createdUsers.length} regular users.`);
  } catch (error) {
    logger.error('❌ Error seeding users:', error);
    throw error;
  }
};