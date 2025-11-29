'use server'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/dal'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db'
import { validatePasswordComplexity, validateUsername } from '@/lib/auth/validation'

/**
 * Create a new user (Admin only)
 */
export async function createUser(
  username: string,
  password: string,
  role: 'USER' | 'MANAGER' | 'ADMIN',
  firstName?: string,
  lastName?: string
): Promise<{ error?: string; success?: boolean; userId?: string }> {
  try {
    // Verify admin access
    const adminUser = await getUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required' }
    }

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return { error: usernameValidation.error }
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.valid) {
      return { error: passwordValidation.error }
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (existingUser) {
      return { error: 'Username already exists' }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: `${username.toLowerCase()}@company.local`,
          passwordHash,
          role,
          firstName: firstName || null,
          lastName: lastName || null,
          isActive: true,
          isEmailVerified: true,
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: 'USER',
          entityId: 0,
          action: 'USER_CREATED',
          performedBy: adminUser.username,
          status: 'SUCCESS',
          reason: `User created by admin ${adminUser.username}`,
          metadata: JSON.stringify({
            adminId: adminUser.id,
            newUsername: user.username,
            newRole: user.role,
          }),
        }
      })

      return user
    })

    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error('Create user error:', error)
    return { error: 'Failed to create user. Please try again.' }
  }
}

/**
 * Delete a user (Admin only)
 * This is a hard delete - removes user and all related data
 */
export async function deleteUser(
  userId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    // Verify admin access
    const adminUser = await getUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required' }
    }

    // Prevent self-deletion
    if (adminUser.id === userId) {
      return { error: 'You cannot delete your own account' }
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true, role: true }
    })

    if (!targetUser) {
      return { error: 'User not found' }
    }

    // Delete user and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          userId: null, // Set to null since user will be deleted
          entityType: 'USER',
          entityId: 0,
          action: 'USER_DELETED',
          performedBy: adminUser.username,
          status: 'SUCCESS',
          reason: `User ${targetUser.username} deleted by admin ${adminUser.username}`,
          metadata: JSON.stringify({
            adminId: adminUser.id,
            deletedUserId: userId,
            deletedUsername: targetUser.username,
            deletedEmail: targetUser.email,
            deletedRole: targetUser.role,
          }),
        }
      })

      // Delete user (cascades to sessions, password resets, audit logs with userId)
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return { error: 'Failed to delete user. Please try again.' }
  }
}

/**
 * Reset user password (Admin only)
 *
 * Hashes new password, updates user, revokes all sessions, logs audit event
 *
 * @param userId - Target user ID
 * @param newPassword - New plain text password
 * @returns Error message or null on success
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    // Verify admin access using getUser instead
    const adminUser = await getUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required' }
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(newPassword)
    if (!passwordValidation.valid) {
      return { error: passwordValidation.error }
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true, role: true }
    })

    if (!targetUser) {
      return { error: 'User not found' }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password, revoke sessions, log audit - all in transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        }
      })

      // Revoke all user sessions
      await tx.session.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'USER',
          entityId: 0,
          action: 'PASSWORD_RESET',
          performedBy: adminUser.email,
          status: 'SUCCESS',
          reason: `Password reset by admin ${adminUser.username}`,
          metadata: JSON.stringify({
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            targetUser: targetUser.email,
            targetRole: targetUser.role,
          }),
        }
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: 'Failed to reset password. Please try again.' }
  }
}

/**
 * Get all users (Admin only)
 *
 * Returns list of users with session counts and last login
 */
export async function getAllUsers() {
  try {
    // Verify admin access
    const adminUser = await getUser()

    if (!adminUser || adminUser.role !== 'ADMIN') {
      redirect('/login')
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        _count: {
          select: {
            sessions: {
              where: { revokedAt: null }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return users
  } catch (error) {
    console.error('Get users error:', error)
    return []
  }
}
