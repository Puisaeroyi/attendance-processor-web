import type { User } from '@prisma/client'
import type { JWTPayload } from 'jose'

export type UserRole = 'USER' | 'ADMIN' | 'MANAGER'

export interface SessionPayload extends JWTPayload {
  userId: string
  username: string
  role: UserRole
  expiresAt: Date | number
}

// Client-safe user profile (no sensitive data)
export interface UserProfile {
  id: string
  email: string
  username: string
  role: UserRole
  firstName: string | null
  lastName: string | null
  isActive: boolean
}

// Helper to extract client-safe user data
export function toUserProfile(user: unknown): UserProfile | null {
  if (!user || typeof user !== 'object') return null

  const u = user as Record<string, unknown>

  // Type guard to ensure required properties exist
  if (
    typeof u.id !== 'string' ||
    typeof u.email !== 'string' ||
    typeof u.username !== 'string' ||
    typeof u.role !== 'string' ||
    typeof u.isActive !== 'boolean'
  ) {
    return null
  }

  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role as UserRole,
    firstName: typeof u.firstName === 'string' ? u.firstName : null,
    lastName: typeof u.lastName === 'string' ? u.lastName : null,
    isActive: u.isActive,
  }
}

// Type guards for role checks
export function isAdmin(user: UserProfile | null): boolean {
  return user?.role === 'ADMIN'
}

export function isManager(user: UserProfile | null): boolean {
  return user?.role === 'MANAGER'
}

export function isManagerOrAdmin(user: UserProfile | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}

export function hasRole(user: UserProfile | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false
}