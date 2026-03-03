import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

/**
 * POST - Logout: remove cookie de sessão.
 */
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
