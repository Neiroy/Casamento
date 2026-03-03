import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, createToken, setSessionCookie } from '@/lib/auth';
import { loginSchema, sanitizeString } from '@/lib/validations';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * POST - Login admin.
 * Body: { usuario, senha }
 * Define cookie com JWT e redireciona (ou retorna success).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { ok } = checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse({
      usuario: sanitizeString(body.usuario || '', 100),
      senha: body.senha,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Usuário e senha obrigatórios' },
        { status: 400 }
      );
    }

    const admin = await validateAdmin(parsed.data.usuario, parsed.data.senha);
    if (!admin) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = await createToken(admin.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, redirect: '/admin/dashboard' });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
