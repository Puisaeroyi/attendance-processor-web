import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/dal'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/lib/auth/types'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Require authentication for API routes
 *
 * Verifies JWT session and returns user data or 401 response
 *
 * @param requiredRoles - Optional array of roles required (e.g., ['ADMIN', 'MANAGER'])
 * @returns User object or NextResponse with 401/403 error
 */
export async function requireAuth(
  requiredRoles?: UserRole[]
): Promise<{ user?: { id: string; email: string; role: string; username: string }; response?: NextResponse }> {
  try {
    // Get authenticated user
    const user = await getUser()

    if (!user) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          userId: null,
          entityType: 'API',
          entityId: 0,
          action: 'UNAUTHORIZED_ACCESS',
          performedBy: 'Anonymous',
          status: 'FAILURE',
          reason: 'No valid session',
        }
      }).catch(() => {}) // Ignore audit log errors

      return {
        response: NextResponse.json(
          { success: false, error: 'Authentication required' } as ApiResponse,
          { status: 401 }
        ),
      }
    }

    // Check role if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role as UserRole)) {
        // Log forbidden access attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            entityType: 'API',
            entityId: 0,
            action: 'FORBIDDEN_ACCESS',
            performedBy: user.email,
            status: 'FAILURE',
            reason: `Requires one of: ${requiredRoles.join(', ')}`,
            metadata: JSON.stringify({ userRole: user.role, requiredRoles }),
          }
        }).catch(() => {})

        return {
          response: NextResponse.json(
            {
              success: false,
              error: 'Insufficient permissions',
              message: `This action requires ${requiredRoles.join(' or ')} role`
            } as ApiResponse,
            { status: 403 }
          ),
        }
      }
    }

    // Log successful API access
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: 'API',
        entityId: 0,
        action: 'API_ACCESS',
        performedBy: user.email,
        status: 'SUCCESS',
      }
    }).catch(() => {})

    return { user }
  } catch (error) {
    console.error('API auth error:', error)

    return {
      response: NextResponse.json(
        { success: false, error: 'Internal server error' } as ApiResponse,
        { status: 500 }
      ),
    }
  }
}

/**
 * Require specific role(s) for API routes
 *
 * Shorthand for requireAuth with role requirement
 *
 * @param roles - Required roles
 * @returns User object or NextResponse with 401/403 error
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<{ user?: { id: string; email: string; role: string; username: string }; response?: NextResponse }> {
  return requireAuth(roles)
}

/**
 * Require ADMIN role
 */
export async function requireAdmin() {
  return requireRole('ADMIN')
}

/**
 * Require MANAGER or ADMIN role
 */
export async function requireManagerOrAdmin() {
  return requireRole('MANAGER', 'ADMIN')
}
