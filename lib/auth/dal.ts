import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/lib/auth/types'

export interface UserWithProfile {
  id: string
  email: string
  username: string
  role: UserRole
  firstName: string | null
  lastName: string | null
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  passwordChangedAt: Date | null
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    return null
  }

  const payload = await decrypt(session)

  if (!payload?.userId) {
    return null
  }

  return {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    expiresAt: new Date(payload.expiresAt)
  }
})

export const getUser = cache(async () => {
  const session = await verifySession()

  if (!session?.userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        passwordChangedAt: true,
      }
    })

    if (!user) {
      return null
    }

    return user as UserWithProfile
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
})

export const requireRole = (allowedRoles: UserRole[]) => {
  return cache(async () => {
    const session = await verifySession()

    if (!session?.userId || !allowedRoles.includes(session.role)) {
      return null
    }

    return session
  })
}

export const requireAdmin = requireRole(['ADMIN'])

export const requireManagerOrAdmin = requireRole(['ADMIN', 'MANAGER'])