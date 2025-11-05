# Database Seeding with Faker - Complete Summary

## ✅ **Seeding Successful!**

The database has been successfully seeded with a comprehensive dataset using the Faker.js library for realistic test data.

---

## 📊 **Seeded Data Overview**

### **Users**
- **Admin User**: `admin@example.com` (Password: `Password123!`)
- **Regular Users**: 50 users with faker-generated data
- **Total**: 51 users in the database

### **Profiles**
- **Count**: 50 profiles (one per user)
- **Gender Split**: Random distribution (male/female)
- **Age Range**: 22-45 years
- **Countries**: Egypt, Saudi Arabia, Jordan, Lebanon, UAE, Morocco, Tunisia, Algeria, Iraq, Syria
- **Features**:
  - Complete personal information
  - Religious level and prayer habits
  - Education and occupation
  - Physical attributes (height, weight, appearance)
  - Gender-specific fields:
    - **Male**: Beard, financial situation, housing, monthly income
    - **Female**: Hijab, niqab, clothing style, guardian info, work preferences

### **Marriage Requests**
- **Count**: 40 requests
- **Status Distribution**:
  - Pending
  - Accepted (with meeting arrangements)
  - Rejected
  - Cancelled
- **Features**:
  - Guardian approval workflow
  - Contact information
  - Meeting details for accepted requests
  - Message history

### **Notifications**
- **Count**: 339 notifications (3-10 per user)
- **Types**:
  - Marriage requests
  - Messages
  - Profile views
  - Matches
  - Guardian approvals
  - Verification
  - System notifications

### **Admin Settings**
- Default admin configuration created

---

## 🔧 **Technical Implementation**

### **Files Modified**
1. **userSeeder.ts**
   - Increased users from 20 to 50
   - Realistic phone numbers with country codes
   - Hashed passwords (bcrypt)
   - Random verification status

2. **profileSeeder.ts**
   - Comprehensive profile data with all required fields
   - Gender-specific data generation
   - Arabic-friendly names and locations
   - Religious and personal attributes
   - Privacy settings
   - Search preferences

3. **marriageRequestSeeder.ts**
   - Increased requests from 15 to 40
   - Multiple status types
   - Guardian approval workflow
   - Meeting arrangements

4. **notificationSeeder.ts**
   - 7 notification types
   - Random read/unread status
   - Contextual data for each type

5. **index.ts**
   - Added `dotenv.config()` for environment variable loading
   - Fixed MongoDB connection issues

---

## 🚀 **How to Use**

### **Prerequisites**
- MongoDB running on localhost:27017
- Backend `.env` file configured
- Dependencies installed (`pnpm install`)

### **Run Seeder**
```bash
cd alzawaj-project-backend
pnpm run db:seed
```

### **What It Does**
1. Clears existing data
2. Creates admin user
3. Generates 50 random users with Faker
4. Creates profiles for all users
5. Generates 40 marriage requests
6. Creates 339 notifications
7. Sets up admin settings

---

## 📝 **Sample Data**

### **User Credentials**
- **Admin**: `admin@example.com` / `Password123!`
- **Regular User Example**: 
  - Email: `Alana.Kohler1@gmail.com`
  - Password: `Password123!`

### **Profile Example (Male)**
```json
{
  "name": "Tabitha Dietrich",
  "age": 28,
  "gender": "m",
  "country": "Egypt",
  "city": "Cairo",
  "maritalStatus": "single",
  "hasBeard": true,
  "financialSituation": "good",
  "monthlyIncome": 7500,
  "religiousLevel": "practicing",
  "education": "bachelor",
  "occupation": "Engineer"
}
```

### **Profile Example (Female)**
```json
{
  "name": "Alana Kohler",
  "age": 25,
  "gender": "f",
  "country": "Jordan",
  "city": "Amman",
  "maritalStatus": "single",
  "wearHijab": true,
  "guardianName": "Ahmed Kohler",
  "guardianPhone": "+9621234567",
  "guardianRelationship": "father",
  "religiousLevel": "very-religious"
}
```

---

## 🧪 **Testing the Data**

### **Check Database**
```bash
# Count users
mongosh zawag_db --eval "db.users.countDocuments({ role: 'user' })"
# Result: 50

# Count profiles
mongosh zawag_db --eval "db.profiles.countDocuments()"
# Result: 50

# List some users
mongosh zawag_db --eval "db.users.find().limit(5).pretty()"
```

### **API Testing**
- **Login**: POST `/api/auth/login` with any generated user email
- **View Profiles**: GET `/api/search/profiles`
- **View Profile Details**: GET `/api/profile/{userId}`
- **Marriage Requests**: GET `/api/requests/received`

---

## ✨ **Features Generated**

### **User Data**
- ✅ Email and phone
- ✅ First name and last name
- ✅ Hashed password
- ✅ Verification status
- ✅ Activity timestamps

### **Profile Data**
- ✅ Basic info (name, age, gender)
- ✅ Location (country, city, coordinates)
- ✅ Personal details (height, weight, appearance)
- ✅ Education and occupation
- ✅ Religious information
- ✅ Family background
- ✅ Marriage preferences
- ✅ Privacy settings
- ✅ Interests and hobbies
- ✅ Bio and personality

### **Gender-Specific**
- **Male**:
  - Beard status
  - Financial situation
  - Monthly income
  - Housing ownership
  - Mosques attendance

- **Female**:
  - Hijab and niqab preferences
  - Clothing style
  - Guardian information
  - Work-after-marriage preference
  - Mahram availability

---

## 🎯 **Benefits**

1. **Realistic Testing**: Comprehensive data for testing all features
2. **Time-Saving**: No need to manually create users and profiles
3. **Consistency**: Proper data relationships and constraints
4. **Diversity**: Varied demographics, ages, locations, and preferences
5. **Islamic Compliance**: Appropriate values and settings for Muslim users
6. **Gender-Specific**: Realistic differences between male and female profiles
7. **Relationship Data**: Marriage requests with various statuses

---

## 📋 **Database Schema Coverage**

- ✅ **Users** - Authentication and basic account info
- ✅ **Profiles** - Comprehensive profile data
- ✅ **MarriageRequests** - Proposal system
- ✅ **Notifications** - In-app notifications
- ✅ **AdminSettings** - Platform configuration

---

## 🔄 **Rerunning the Seeder**

The seeder is **idempotent** - you can run it multiple times:

1. It clears existing data first
2. Checks for duplicates (admin user)
3. Creates fresh data each time
4. Safe to run in development

---

## ✅ **Verification Commands**

```bash
# Verify all data
mongosh zawag_db --eval "
print('Users:', db.users.countDocuments());
print('Profiles:', db.profiles.countDocuments());
print('Marriage Requests:', db.marriagerequests.countDocuments());
print('Notifications:', db.notifications.countDocuments());
print('Admin Settings:', db.adminsettings.countDocuments());
"
```

**Expected Output:**
```
Users: 51
Profiles: 50
Marriage Requests: 40
Notifications: 339
Admin Settings: 1
```

---

## 🚀 **Next Steps**

You can now:
1. **Start the backend**: `pnpm run dev`
2. **Start the frontend**: `npm run dev`
3. **Login**: Use `admin@example.com` / `Password123!` or any generated user
4. **Test Features**:
   - Browse profiles
   - View profile details
   - Send marriage requests
   - View notifications
5. **Build UI**: Use the seeded data for developing frontend features

---

**Database successfully seeded with 481 total documents across all collections!** 🎉
