"use server";

import { PrismaClient } from "../../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function registerPlayer({
  username,
  email,
  password,
  firstName,
  lastName,
  photo,
  gender,
  dateOfBirth,
  nationality,
  bio,
  phone,
}: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  photo?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  bio?: string;
  phone?: string;
}) {
  // Check required fields
  if (!username || !email || !password || !firstName || !lastName) {
    throw new Error("Please fill all required fields.");
  }

  // Check for existing user
  const exists = await prisma.player.findFirst({
    where: {
      OR: [
        { username },
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });
  if (exists) {
    throw new Error("User with this username/email/phone already exists.");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create player
  await prisma.player.create({
    data: {
      username,
      email,
      phone: phone || null,
      passwordHash,
      firstName,
      lastName,
      photo: photo || null,
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || null,
      bio: bio || null,
    },
  });
}

export async function loginPlayer({
  usernameOrEmail,
  password,
}: {
  usernameOrEmail: string;
  password: string;
}) {
  if (!usernameOrEmail || !password) {
    throw new Error("Please enter both username/email and password.");
  }

  // Find user by username or email
  const user = await prisma.player.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
      ],
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Compare password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Incorrect password.");
  }

  // You can set a cookie/session here if needed

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}