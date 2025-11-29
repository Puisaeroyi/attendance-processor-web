import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { SessionPayload } from '@/lib/auth/types'

// SECURITY: Require SESSION_SECRET in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production')
}

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-not-for-production')

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, secretKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch {
    // Session verification failed - don't log details in production
    return null
  }
}

/**
 * Create new session with JWT cookie
 *
 * IMPORTANT: This creates a new session for single-device enforcement
 *
 * @param userId - User database ID
 * @param username - User username
 * @param role - User role (USER | ADMIN | MANAGER)
 */
export async function createSession(userId: string, username: string, role: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, username, role: role as 'USER' | 'ADMIN' | 'MANAGER', expiresAt: expiresAt.getTime() })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession(): Promise<void> {
  const session = (await cookies()).get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) {
    return null
  }

  try {
    return await decrypt(session.value)
  } catch {
    // Session decryption failed
    return null
  }
}