"use server";

import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

/**
 * Handle Google OAuth callback and auto-register as spectator if needed
 */
export async function handleGoogleAuth({
  email,
  firstName,
  lastName,
  image,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}) {
  if (!email) {
    throw new Error("Email is required from Google OAuth");
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  // If user doesn't exist, auto-register as spectator
  if (!user) {
    // Generate username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/(^-+|-+$)/g, '') || 'user';
    let username = baseUsername;
    let index = 1;

    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${index++}`;
    }

    // Generate a random temporary password (user won't use it for Google auth)
    const tempPassword = Math.random().toString(36).slice(-16);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user with minimal data
    user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || 'Spectator',
        photo: image || null,
        acceptedTermsAt: new Date(), // Accept on behalf of user for OAuth
        profileComplete: false,
      },
    });

    // Create spectator profile
    await prisma.spectator.create({
      data: {
        userId: user.id,
      },
    });

    // Mark as needs profile completion
    return {
      isNew: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo || null,
        profileComplete: false,
      },
    };
  }

  // User already exists - just return user data
  return {
    isNew: false,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photo: user.photo || null,
      profileComplete: user.profileComplete ?? true,
    },
  };
}

/**
 * Complete Google OAuth user profile with additional fields
 */
export async function completeGoogleProfile({
  userId,
  firstName,
  lastName,
  gender,
  dateOfBirth,
  nationality,
  phone,
  bio,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  bio?: string;
}) {
  if (!userId || !firstName || !lastName) {
    throw new Error("User ID, firstName, and lastName are required");
  }

  // Update user profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || null,
      phone: phone || null,
      bio: bio || null,
      profileComplete: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    photo: user.photo || null,
    profileComplete: true,
  };
}
