import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const DEFAULT_SECRET = 'default-secret-change-in-production';
const rawSecret = process.env.JWT_SECRET || DEFAULT_SECRET;
if (process.env.NODE_ENV === 'production' && rawSecret === DEFAULT_SECRET) {
  console.error(
    'CRÍTICO: JWT_SECRET deve ser definido e forte em produção. Use variáveis de ambiente.'
  );
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

const COOKIE_NAME = 'wedding_admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 horas

/** Hash de senha com bcrypt */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/** Verifica senha contra hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Gera JWT para o admin */
export async function createToken(adminId: number): Promise<string> {
  return new SignJWT({ sub: String(adminId), role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/** Valida e decodifica o JWT */
export async function verifyToken(token: string): Promise<{ adminId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sub = payload.sub;
    if (!sub) return null;
    return { adminId: Number(sub) };
  } catch {
    return null;
  }
}

/** Obtém o admin da sessão (cookie) */
export async function getSession(): Promise<{ adminId: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Define cookie com o token após login */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/** Remove cookie (logout) */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Valida credenciais e retorna o admin se válido */
export async function validateAdmin(usuario: string, senha: string) {
  const admin = await prisma.admin.findUnique({ where: { usuario } });
  if (!admin) return null;
  const valid = await verifyPassword(senha, admin.senha);
  return valid ? admin : null;
}
