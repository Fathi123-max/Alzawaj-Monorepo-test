import { Profile } from '../../models/Profile';
import { User } from '../../models/User';
import logger from '../../config/logger';
import { faker } from '@faker-js/faker';

export const seedProfiles = async () => {
  try {
    logger.info('🌱 Seeding profiles...');

    // Get users to link with profiles
    const users = await User.find({ role: 'user' }).sort({ createdAt: 1 });
    if (users.length === 0) {
      logger.error('❌ No regular users found - please seed users first');
      return;
    }

    // Define some common values for faker
    const countries = ['Egypt', 'Saudi Arabia', 'Jordan', 'Lebanon', 'United Arab Emirates', 'Morocco', 'Tunisia', 'Algeria', 'Iraq', 'Syria'];
    const cities = {
      'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
      'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina'],
      'Jordan': ['Amman', 'Irbid', 'Zarqa'],
      'Lebanon': ['Beirut', 'Tripoli', 'Sidon'],
      'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
      'Morocco': ['Casablanca', 'Rabat', 'Marrakech'],
      'Tunisia': ['Tunis', 'Sfax', 'Sousse'],
      'Algeria': ['Algiers', 'Oran', 'Constantine'],
      'Iraq': ['Baghdad', 'Basra', 'Mosul'],
      'Syria': ['Damascus', 'Aleppo', 'Homs']
    };
    const occupations = ['Doctor', 'Engineer', 'Teacher', 'Lawyer', 'Accountant', 'Architect', 'Pharmacist', 'Nurse', 'IT Specialist', 'Business Owner', 'Consultant', 'Researcher', 'Financial Analyst', 'Marketing Manager'];
    const educationLevels = ['primary', 'secondary', 'high-school', 'diploma', 'bachelor', 'master', 'doctorate', 'other'];
    const religiousLevels = ['basic', 'practicing', 'very-religious', 'moderate'];
    const appearances = ['very-attractive', 'attractive', 'average', 'simple'];
    const skinColors = ['fair', 'medium', 'olive', 'dark'];
    const bodyTypes = ['slim', 'average', 'athletic', 'heavy'];
    const financialSituations = ['excellent', 'good', 'average', 'struggling'];
    const housingOwnerships = ['owned', 'rented', 'family-owned'];
    const guardianRelationships = ['father', 'brother', 'uncle', 'other'];
    const clothingStyles = ['niqab-full', 'niqab-hands', 'khimar', 'tarha-loose', 'hijab-conservative', 'hijab-modest', 'tarha-fitted', 'hijab-modern', 'loose-covering', 'modest-covering'];
    const maritalStatuses = ['single', 'divorced', 'widowed'];
    const workAfterMarriageOptions = ['yes', 'no', 'undecided'];

    // Create profiles for users
    for (const user of users) {
      const country = faker.helpers.arrayElement(countries);
      const city = faker.helpers.arrayElement(cities[country as keyof typeof cities]);
      const age = faker.number.int({ min: 22, max: 45 });
      const gender = faker.helpers.arrayElement(['m', 'f'] as const);
      const maritalStatus = faker.helpers.arrayElement(maritalStatuses) as 'single' | 'divorced' | 'widowed';
      
      const profileData: any = {
        userId: user._id,
        name: `${user.firstname} ${user.lastname}`,
        age,
        gender,
        country,
        city,
        nationality: country,
        maritalStatus,
        education: faker.helpers.arrayElement(educationLevels),
        occupation: faker.helpers.arrayElement(occupations),
        religiousLevel: faker.helpers.arrayElement(religiousLevels) as any,
        isPrayerRegular: faker.datatype.boolean(),
        height: faker.number.int({ min: 150, max: 190 }),
        weight: faker.number.int({ min: 50, max: 100 }),
        appearance: faker.helpers.arrayElement(appearances) as any,
        skinColor: faker.helpers.arrayElement(skinColors) as any,
        bodyType: faker.helpers.arrayElement(bodyTypes) as any,
        areParentsAlive: faker.helpers.arrayElement(['both', 'father', 'mother', 'none']) as any,
        parentRelationship: faker.helpers.arrayElement(['excellent', 'good', 'average', 'poor']) as any,
        hasChildren: faker.helpers.arrayElement(['yes', 'no']) as any,
        wantsChildren: faker.helpers.arrayElement(['yes', 'no', 'maybe']) as any,
        marriageGoals: faker.lorem.sentence(),
        personalityDescription: faker.lorem.sentence(),
        familyPlans: faker.lorem.sentence(),
        relocationPlans: faker.lorem.sentence(),
        marriageTimeline: faker.lorem.sentence(),
        interests: faker.helpers.arrayElements(['reading', 'sports', 'traveling', 'cooking', 'volunteering', 'music', 'art', 'gaming', 'gardening'], { min: 1, max: 5 }),
        smokingStatus: faker.helpers.arrayElement(['never', 'quit', 'occasionally', 'regularly']) as any,
        bio: faker.lorem.paragraph(),
        isComplete: true,
        isApproved: true,
      };

      // Add gender-specific fields
      if (gender === 'm') {
        profileData.hasBeard = faker.datatype.boolean();
        profileData.financialSituation = faker.helpers.arrayElement(financialSituations) as any;
        profileData.monthlyIncome = faker.number.int({ min: 2000, max: 10000 });
        profileData.housingOwnership = faker.helpers.arrayElement(housingOwnerships) as any;
      } else {
        profileData.guardianName = faker.person.fullName();
        profileData.guardianPhone = `+${faker.helpers.arrayElement(['1', '20', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269', '27', '290', '291', '297', '298', '299', '30', '31', '32', '33', '34', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '36', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '385', '386', '387', '389', '39', '40', '41', '420', '421', '423', '43', '44', '45', '46', '47', '48', '49', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '51', '52', '53', '54', '55', '56', '57', '58', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '60', '61', '62', '63', '64', '65', '66', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '684', '685', '686', '687', '688', '689', '690', '691', '692', '7', '81', '82', '84', '850', '852', '853', '855', '856', '86', '870', '878', '880', '881', '882', '883', '886', '888', '90', '91', '92', '93', '94', '95', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '98', '992', '993', '994', '995', '996', '998'])}${faker.string.numeric(7)}`;
        profileData.guardianEmail = faker.internet.email({ firstName: profileData.guardianName.split(' ')[0], lastName: profileData.guardianName.split(' ')[1] || 'Guardian' });
        profileData.guardianRelationship = faker.helpers.arrayElement(guardianRelationships) as any;
        profileData.guardianNotes = faker.lorem.sentence();
        profileData.wearHijab = faker.datatype.boolean();
        profileData.wearNiqab = faker.datatype.boolean();
        profileData.clothingStyle = faker.helpers.arrayElement(clothingStyles) as any;
        profileData.workAfterMarriage = faker.helpers.arrayElement(workAfterMarriageOptions) as any;
      }

      // Create basicInfo section
      profileData.basicInfo = {
        fullName: profileData.name,
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - profileData.age)),
        nationality: profileData.nationality,
        currentLocation: {
          city: profileData.city,
          country: profileData.country,
          coordinates: [faker.location.latitude(), faker.location.longitude()]
        },
        maritalStatus: maritalStatus === 'single' ? 'single' : maritalStatus,
        hasChildren: profileData.hasChildren === 'yes',
        wantChildren: profileData.wantsChildren === 'yes'
      };

      // Create religiousInfo section
      profileData.religiousInfo = {
        sect: faker.helpers.arrayElement(['Sunni', 'Shia', 'Ibadi', 'Other']),
        religiousLevel: profileData.religiousLevel,
        prayerFrequency: faker.helpers.arrayElement(['always', 'sometimes', 'rarely']),
        islamicEducation: faker.lorem.words(2),
        memorizedQuran: faker.helpers.arrayElement(['none', 'juz', 'half', 'full']),
        islamicActivities: faker.helpers.arrayElements(['praying', 'reading Quran', 'attending mosque', 'fasting', 'charity'], { min: 1, max: 3 })
      };

      // Create personalInfo section
      profileData.personalInfo = {
        height: profileData.height,
        build: profileData.bodyType,
        ethnicity: faker.location.country(),
        languages: [faker.location.country(), 'Arabic'],
        interests: profileData.interests,
        personality: faker.helpers.arrayElements(['patient', 'kind', 'hardworking', 'ambitious', 'funny'], { min: 2, max: 5 }),
        about: faker.lorem.paragraph()
      };

      // Create professional section
      profileData.professional = {
        education: profileData.education,
        field: faker.helpers.arrayElement(['Technology', 'Healthcare', 'Education', 'Finance', 'Business', 'Engineering', 'Arts']),
        occupation: profileData.occupation,
        income: `${profileData.monthlyIncome ? profileData.monthlyIncome * 12 : 'Not specified'}/year`
      };

      // Create location section
      profileData.location = {
        country: profileData.country,
        city: profileData.city,
        coordinates: [faker.location.latitude(), faker.location.longitude()]
      };

      // Create preferences section
      profileData.preferences = {
        ageRange: {
          min: Math.max(18, profileData.age - 5),
          max: profileData.age + 5
        },
        country: profileData.country,
        cities: [profileData.city],
        nationalities: [profileData.nationality],
        maritalStatusPreference: [profileData.maritalStatus],
        education: [profileData.education],
        religiousLevel: [profileData.religiousLevel],
        heightRange: {
          min: Math.max(140, profileData.height - 10),
          max: profileData.height + 10
        },
        financialSituation: gender === 'f' ? [faker.helpers.arrayElement(financialSituations)] : undefined,
        wearHijab: gender === 'm' ? faker.datatype.boolean() : undefined,
        wearNiqab: gender === 'm' ? faker.datatype.boolean() : undefined,
        hasBeard: gender === 'f' ? faker.datatype.boolean() : undefined,
        dealBreakers: faker.helpers.arrayElements(['smoking', 'drinking', 'not religious', 'different nationality'], { min: 0, max: 2 })
      };

      // Create privacy settings
      profileData.privacy = {
        showProfilePicture: faker.helpers.arrayElement(['everyone', 'matches-only', 'none']) as any,
        showAge: faker.datatype.boolean(),
        showLocation: faker.datatype.boolean(),
        showOccupation: faker.datatype.boolean(),
        allowMessagesFrom: faker.helpers.arrayElement(['everyone', 'matches-only', 'none']) as any,
        profileVisibility: gender === 'f' ? 'verified-only' : 'everyone',
        requireGuardianApproval: gender === 'f',
        showOnlineStatus: faker.datatype.boolean(),
        allowNearbySearch: faker.datatype.boolean(),
        blockedUsers: []
      };

      const existingProfile = await Profile.findOne({ userId: profileData.userId });
      if (!existingProfile) {
        await Profile.create(profileData);
        logger.info(`✅ Created profile for user: ${profileData.name} (Gender: ${profileData.gender})`);
      } else {
        logger.info(`ℹ️  Profile already exists for user: ${profileData.name} (Gender: ${profileData.gender})`);
      }
    }

    logger.info(`✅ Profiles seeding completed for ${users.length} users`);
  } catch (error) {
    logger.error('❌ Error seeding profiles:', error);
    throw error;
  }
};