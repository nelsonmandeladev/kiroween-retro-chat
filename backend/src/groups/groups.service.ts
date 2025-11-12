import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import {
  groups,
  groupMembers,
  groupStyleProfiles,
  user,
  userProfile,
} from '../db/schema';
import { GroupAIInitService } from './group-ai-init.service';

export interface GroupWithMembers {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  aiEnabled: boolean;
  members: Array<{
    id: string;
    userId: string;
    isAdmin: boolean;
    joinedAt: Date;
    notificationsMuted: boolean;
    user: {
      id: string;
      username: string;
      displayName: string;
      profilePictureUrl: string | null;
    };
  }>;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  aiEnabled?: boolean;
}

@Injectable()
export class GroupsService {
  constructor(private readonly groupAIInitService: GroupAIInitService) {}
  async createGroup(
    creatorId: string,
    name: string,
    description: string | null,
    memberIds: string[],
  ): Promise<GroupWithMembers> {
    // Validate group name
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Group name is required');
    }

    if (name.length > 50) {
      throw new BadRequestException('Group name must be 50 characters or less');
    }

    // Validate description
    if (description && description.length > 200) {
      throw new BadRequestException(
        'Group description must be 200 characters or less',
      );
    }

    // Validate minimum member count (creator + at least 2 others = 3 total)
    if (memberIds.length < 2) {
      throw new BadRequestException(
        'Groups must have at least 3 members including the creator',
      );
    }

    // Verify all members exist
    const members = await db
      .select()
      .from(user)
      .where(
        or(eq(user.id, creatorId), ...memberIds.map((id) => eq(user.id, id))),
      );

    const allMemberIds = [creatorId, ...memberIds];
    if (members.length !== allMemberIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // Create the group
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: creatorId,
      })
      .returning();

    // Add creator as admin
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: creatorId,
      isAdmin: true,
    });

    // Add other members
    if (memberIds.length > 0) {
      await db.insert(groupMembers).values(
        memberIds.map((userId) => ({
          groupId: newGroup.id,
          userId,
          isAdmin: false,
        })),
      );
    }

    // Initialize group style profile
    await db.insert(groupStyleProfiles).values({
      groupId: newGroup.id,
    });

    // Create and add Group AI Member
    await this.groupAIInitService.createGroupAIMember(newGroup.id);

    // Fetch and return the complete group with members
    return this.getGroup(newGroup.id);
  }

  async getGroup(groupId: string): Promise<GroupWithMembers> {
    // Fetch group
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Fetch members with user profiles
    const members = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        isAdmin: groupMembers.isAdmin,
        joinedAt: groupMembers.joinedAt,
        notificationsMuted: groupMembers.notificationsMuted,
        username: userProfile.username,
        displayName: userProfile.displayName,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(groupMembers)
      .leftJoin(userProfile, eq(groupMembers.userId, userProfile.userId))
      .where(eq(groupMembers.groupId, groupId));

    return {
      ...group,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        isAdmin: m.isAdmin,
        joinedAt: m.joinedAt,
        notificationsMuted: m.notificationsMuted,
        user: {
          id: m.userId,
          username: m.username || '',
          displayName: m.displayName || '',
          profilePictureUrl: m.profilePictureUrl,
        },
      })),
    };
  }

  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    // Get all group IDs where user is a member
    const userGroupMemberships = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    if (userGroupMemberships.length === 0) {
      return [];
    }

    // Fetch all groups
    const userGroups = await db
      .select()
      .from(groups)
      .where(or(...userGroupMemberships.map((m) => eq(groups.id, m.groupId))));

    // Fetch members for all groups
    const allMembers = await db
      .select({
        memberId: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        isAdmin: groupMembers.isAdmin,
        joinedAt: groupMembers.joinedAt,
        notificationsMuted: groupMembers.notificationsMuted,
        username: userProfile.username,
        displayName: userProfile.displayName,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(groupMembers)
      .leftJoin(userProfile, eq(groupMembers.userId, userProfile.userId))
      .where(
        or(
          ...userGroupMemberships.map((m) =>
            eq(groupMembers.groupId, m.groupId),
          ),
        ),
      );

    // Group members by groupId
    const membersByGroup = new Map<string, typeof allMembers>();
    for (const member of allMembers) {
      if (!membersByGroup.has(member.groupId)) {
        membersByGroup.set(member.groupId, []);
      }
      membersByGroup.get(member.groupId)!.push(member);
    }

    // Combine groups with their members
    return userGroups.map((group) => ({
      ...group,
      members: (membersByGroup.get(group.id) || []).map((m) => ({
        id: m.memberId,
        userId: m.userId,
        isAdmin: m.isAdmin,
        joinedAt: m.joinedAt,
        notificationsMuted: m.notificationsMuted,
        user: {
          id: m.userId,
          username: m.username || '',
          displayName: m.displayName || '',
          profilePictureUrl: m.profilePictureUrl,
        },
      })),
    }));
  }

  async updateGroup(
    groupId: string,
    userId: string,
    updates: GroupUpdate,
  ): Promise<GroupWithMembers> {
    // Verify user is admin
    const isAdmin = await this.isUserAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only group admins can update group settings',
      );
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new BadRequestException('Group name cannot be empty');
      }
      if (updates.name.length > 50) {
        throw new BadRequestException(
          'Group name must be 50 characters or less',
        );
      }
    }

    if (updates.description !== undefined && updates.description !== null) {
      if (updates.description.length > 200) {
        throw new BadRequestException(
          'Group description must be 200 characters or less',
        );
      }
    }

    // Build update object
    const updateData: Partial<typeof groups.$inferInsert> = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.aiEnabled !== undefined) {
      updateData.aiEnabled = updates.aiEnabled;
    }

    // Update group
    const [updatedGroup] = await db
      .update(groups)
      .set(updateData)
      .where(eq(groups.id, groupId))
      .returning();

    if (!updatedGroup) {
      throw new NotFoundException('Group not found');
    }

    // Return updated group with members
    return this.getGroup(groupId);
  }

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    // Verify user is admin
    const isAdmin = await this.isUserAdmin(groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can delete the group');
    }

    // Delete group (cascade will handle related records)
    const result = await db
      .delete(groups)
      .where(eq(groups.id, groupId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Group not found');
    }
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
      )
      .limit(1);

    return !!membership;
  }

  async isUserAdmin(groupId: string, userId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.isAdmin, true),
        ),
      )
      .limit(1);

    return !!membership;
  }

  async addMember(
    groupId: string,
    userIdToAdd: string,
    addedBy: string,
  ): Promise<void> {
    // Verify the person adding is an admin
    const isAdmin = await this.isUserAdmin(groupId, addedBy);
    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can add members');
    }

    // Verify group exists
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify user to add exists
    const [userToAdd] = await db
      .select()
      .from(user)
      .where(eq(user.id, userIdToAdd))
      .limit(1);

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const isAlreadyMember = await this.isUserInGroup(groupId, userIdToAdd);
    if (isAlreadyMember) {
      throw new BadRequestException('User is already a member of this group');
    }

    // Add user to group
    await db.insert(groupMembers).values({
      groupId,
      userId: userIdToAdd,
      isAdmin: false,
    });
  }

  async removeMember(
    groupId: string,
    userIdToRemove: string,
    removedBy: string,
  ): Promise<void> {
    // Verify the person removing is an admin
    const isAdmin = await this.isUserAdmin(groupId, removedBy);
    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can remove members');
    }

    // Verify group exists
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member
    const isMember = await this.isUserInGroup(groupId, userIdToRemove);
    if (!isMember) {
      throw new BadRequestException('User is not a member of this group');
    }

    // Check if user being removed is an admin
    const isUserAdmin = await this.isUserAdmin(groupId, userIdToRemove);

    if (isUserAdmin) {
      // Count total admins
      const admins = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.isAdmin, true),
          ),
        );

      if (admins.length === 1) {
        throw new BadRequestException(
          'Cannot remove the last admin. Transfer admin rights first or delete the group.',
        );
      }
    }

    // Remove user from group
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userIdToRemove),
        ),
      );
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    // Verify group exists
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member
    const isMember = await this.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this group');
    }

    // Check if user is an admin
    const isAdmin = await this.isUserAdmin(groupId, userId);

    if (isAdmin) {
      // Transfer admin if needed
      await this.transferAdminIfNeeded(groupId);
    }

    // Remove user from group
    await db
      .delete(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
      );
  }

  async transferAdminIfNeeded(groupId: string): Promise<void> {
    // Count total admins
    const admins = await db
      .select()
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.isAdmin, true)),
      );

    // If this is the last admin, transfer to oldest member
    if (admins.length === 1) {
      // Find oldest non-admin member
      const [oldestMember] = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.isAdmin, false),
          ),
        )
        .orderBy(groupMembers.joinedAt)
        .limit(1);

      if (oldestMember) {
        // Transfer admin rights
        await db
          .update(groupMembers)
          .set({ isAdmin: true })
          .where(eq(groupMembers.id, oldestMember.id));
      }
    }
  }

  async getGroupMembers(groupId: string): Promise<
    Array<{
      id: string;
      userId: string;
      isAdmin: boolean;
      joinedAt: Date;
      notificationsMuted: boolean;
      user: {
        id: string;
        username: string;
        displayName: string;
        profilePictureUrl: string | null;
      };
    }>
  > {
    // Verify group exists
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Fetch members with user profiles
    const members = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        isAdmin: groupMembers.isAdmin,
        joinedAt: groupMembers.joinedAt,
        notificationsMuted: groupMembers.notificationsMuted,
        username: userProfile.username,
        displayName: userProfile.displayName,
        profilePictureUrl: userProfile.profilePictureUrl,
      })
      .from(groupMembers)
      .leftJoin(userProfile, eq(groupMembers.userId, userProfile.userId))
      .where(eq(groupMembers.groupId, groupId));

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      isAdmin: m.isAdmin,
      joinedAt: m.joinedAt,
      notificationsMuted: m.notificationsMuted,
      user: {
        id: m.userId,
        username: m.username || '',
        displayName: m.displayName || '',
        profilePictureUrl: m.profilePictureUrl,
      },
    }));
  }
}
