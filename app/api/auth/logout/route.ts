import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    await logout()

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}