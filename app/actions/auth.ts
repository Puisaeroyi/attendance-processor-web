'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, deleteSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ACCOUNT_LOCKOUT } from '@/lib/auth/validation'

// In-memory rate limiting (for single server deployment)
// For production with multiple servers, use Redis
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_RATE_LIMIT_ATTEMPTS = 10 // Max attempts per IP in window

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return { allowed: true }
  }

  if (record.count >= MAX_RATE_LIMIT_ATTEMPTS) {
    const retryAfter = Math.ceil((record.firstAttempt + RATE_LIMIT_WINDOW - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

/**
 * Login server action
 *
 * Authenticates user with rate limiting and account lockout protection
 *
 * @param username - User username
 * @param password - Plain text password
 * @returns Error message or null on success
 */
export async function login(username: string, password: string): Promise<{ error?: string }> {
  try {
    // Get IP for rate limiting
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown'

    // Check rate limit
    const rateCheck = checkRateLimit(ipAddress)
    if (!rateCheck.allowed) {
      return { error: `Too many login attempts. Please try again in ${rateCheck.retryAfter} seconds.` }
    }

    // Input validation
    if (!username || !password) {
      return { error: 'Username and password are required' }
    }

    // 1. Find user by username (include lockout fields)
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      }
    })

    if (!user) {
      await prisma.auditLog.create({
        data: {
          userId: null,
          entityType: 'AUTH',
          entityId: 0,
          action: 'LOGIN_FAILED',
          performedBy: username,
          status: 'FAILURE',
          reason: 'User not found',
          metadata: JSON.stringify({ ip: ipAddress }),
        }
      })

      return { error: 'Invalid username or password' }
    }

    // 2. Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000)
      
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: 'AUTH',
          entityId: 0,
          action: 'LOGIN_BLOCKED',
          performedBy: user.username,
          status: 'FAILURE',
          reason: 'Account locked',
          metadata: JSON.stringify({ ip: ipAddress, remainingMinutes }),
        }
      })

      return { error: `Account is locked. Please try again in ${remainingMinutes} minutes.` }
    }

    // 3. Check if user is active
    if (!user.isActive) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: 'AUTH',
          entityId: 0,
          action: 'LOGIN_FAILED',
          performedBy: user.username,
          status: 'FAILURE',
          reason: 'User inactive',
        }
      })

      return { error: 'Account is inactive. Contact administrator.' }
    }

    // 4. Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1
      const shouldLock = newFailedAttempts >= ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil: shouldLock 
            ? new Date(Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MS) 
            : null,
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          entityType: 'AUTH',
          entityId: 0,
          action: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          performedBy: user.username,
          status: 'FAILURE',
          reason: shouldLock ? 'Account locked due to failed attempts' : 'Invalid password',
          metadata: JSON.stringify({ 
            ip: ipAddress, 
            failedAttempts: newFailedAttempts,
            locked: shouldLock
          }),
        }
      })

      if (shouldLock) {
        return { error: `Account locked due to too many failed attempts. Try again in ${ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MS / 60000} minutes.` }
      }

      const remainingAttempts = ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS - newFailedAttempts
      return { error: `Invalid username or password. ${remainingAttempts} attempts remaining.` }
    }

    // 5. Successful login - reset failed attempts and create session
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      // Reset failed login attempts
      await tx.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      })

      // Revoke all existing sessions (single-device)
      await tx.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      })

      // Create new session record
      await tx.session.create({
        data: {
          userId: user.id,
          accessToken: 'jwt-cookie',
          deviceId: 'web',
          deviceName: 'Web Browser',
          userAgent,
          ipAddress,
          tokenExpiry: expiresAt,
          expiresAt,
        }
      })

      // Create success audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          entityType: 'AUTH',
          entityId: 0,
          action: 'LOGIN_SUCCESS',
          performedBy: user.username,
          status: 'SUCCESS',
          metadata: JSON.stringify({ ip: ipAddress }),
        }
      })
    })

    // 6. Create JWT session cookie
    await createSession(user.id, user.username, user.role)

    return {}  // Success - will redirect on client
  } catch (error) {
    // Don't log error details to console in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', error)
    }
    return { error: 'An error occurred during login. Please try again.' }
  }
}

/**
 * Logout server action
 *
 * Deletes session cookie and redirects to login
 */
export async function logout() {
  try {
    await deleteSession()
  } catch {
    // Silent fail for logout
  }

  redirect('/login')
}
