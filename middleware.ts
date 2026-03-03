import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const DEFAULT_SECRET = 'default-secret-change-in-production';
const rawSecret = process.env.JWT_SECRET || DEFAULT_SECRET;
if (process.env.NODE_ENV === 'production' && rawSecret === DEFAULT_SECRET) {
  console.error(
    'CRÍTICO: JWT_SECRET deve ser definido e forte em produção. Use variáveis de ambiente.'
  );
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protege rotas /admin/* exceto /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('wedding_admin_token')?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
