import { NextResponse, NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/dal'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/logout',
]

// Routes that require ADMIN or MANAGER role
const MANAGER_ROUTES = [
  '/dashboard',
  '/processor',
  '/converter',
]

// Routes that require ADMIN role only
const ADMIN_ROUTES = [
  '/admin',
]

// All protected routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/dashboard',
  '/processor',
  '/converter',
  '/leave-management',
  '/admin',
]

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/')
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const isProtected = PROTECTED_ROUTES.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )

  if (isProtected) {
    const session = await verifySession()

    if (!session) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access for ADMIN routes
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    if (isAdminRoute && session.role !== 'ADMIN') {
      // Redirect non-admin users to home page
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check role-based access for MANAGER routes (ADMIN and MANAGER only)
    const isManagerRoute = MANAGER_ROUTES.some(route => pathname.startsWith(route))
    if (isManagerRoute && session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      // Redirect USER role to leave-management page
      return NextResponse.redirect(new URL('/leave-management', request.url))
    }

    // Add user info to request headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.userId)
    response.headers.set('x-user-role', session.role)
    response.headers.set('x-user-username', session.username as string)

    return response
  }

  // Allow access to everything else
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  ]
}