import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();
const DEVELOPER_EMAIL = 'vicotennis0@gmail.com';
const DEVELOPER_USERNAME = 'wilfred';
const DEVELOPER_PASSWORD = '123456';

async function seedDeveloperUser() {
  const passwordHash = await bcrypt.hash(DEVELOPER_PASSWORD, 10);

  const devData = {
    username: DEVELOPER_USERNAME,
    email: DEVELOPER_EMAIL,
    phone: '+1-555-0001',
    passwordHash,
    firstName: 'Wilfred',
    lastName: 'Developer',
    gender: 'Male',
    dateOfBirth: new Date('1985-10-01'),
    nationality: 'Kenya',
    bio: 'Platform developer and support engineer.',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80',
    acceptedTermsAt: new Date(),
    isDeveloper: true,
  };

  const existingUser = await prisma.user.findUnique({
    where: { email: DEVELOPER_EMAIL },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: devData,
    });
    console.log(`Updated existing developer user: ${DEVELOPER_EMAIL}`);
  } else {
    await prisma.user.create({
      data: devData,
    });
    console.log(`Created new developer user: ${DEVELOPER_EMAIL}`);
  }
}

seedDeveloperUser()
  .catch((error) => {
    console.error('Failed to seed developer user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
