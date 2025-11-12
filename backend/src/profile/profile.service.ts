import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, or, ilike } from 'drizzle-orm';
import { db } from '../db';
import { user, userProfile } from '../db/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetupProfileDto } from './dto/setup-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class ProfileService {
  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const result = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: userProfile.username,
        displayName: userProfile.displayName,
        statusMessage: userProfile.statusMessage,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(eq(user.id, userId))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userData = result[0];

    if (!userData.username || !userData.displayName) {
      throw new NotFoundException(`User profile for user ${userId} not found`);
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      statusMessage: userData.statusMessage,
      profilePictureUrl: userData.profilePictureUrl,
    };
  }

  async setupProfile(
    userId: string,
    setupData: SetupProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if username is already taken
    const existingUsername = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.username, setupData.username))
      .limit(1);

    if (existingUsername.length > 0 && existingUsername[0].userId !== userId) {
      throw new ConflictException('Username is already taken');
    }

    // Update user profile with username, displayName, and statusMessage
    await db
      .update(userProfile)
      .set({
        username: setupData.username,
        displayName: setupData.displayName,
        statusMessage: setupData.statusMessage || null,
      })
      .where(eq(userProfile.userId, userId));

    // Return updated profile
    return this.getUserProfile(userId);
  }

  async updateProfile(
    userId: string,
    updates: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update user profile
    await db
      .update(userProfile)
      .set({
        ...(updates.displayName && { displayName: updates.displayName }),
        ...(updates.statusMessage !== undefined && {
          statusMessage: updates.statusMessage,
        }),
      })
      .where(eq(userProfile.userId, userId));

    // Return updated profile
    return this.getUserProfile(userId);
  }

  async searchUsers(query: string): Promise<UserProfileResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query}%`;

    const results = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: userProfile.username,
        displayName: userProfile.displayName,
        statusMessage: userProfile.statusMessage,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(
        or(
          ilike(userProfile.username, searchTerm),
          ilike(user.email, searchTerm),
        ),
      )
      .limit(20);

    return results
      .filter((r) => r.username !== null && r.displayName !== null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        username: r.username!,
        displayName: r.displayName!,
        statusMessage: r.statusMessage,
        profilePictureUrl: r.profilePictureUrl,
      }));
  }
}
