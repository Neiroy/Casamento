import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { presenteSchema, sanitizeString } from '@/lib/validations';

/**
 * GET - Lista presentes.
 * Query: ?ativos=true (default) para só ativos. Admin pode passar ?ativos=false para todos.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('ativos') !== 'false';

    const where = onlyActive ? { ativo: true } : {};
    const presentes = await prisma.presente.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(presentes);
  } catch (error) {
    console.error('Erro ao listar presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar presentes' },
      { status: 500 }
    );
  }
}

/**
 * POST - Cria presente (apenas admin).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = presenteSchema.safeParse({
      nome: sanitizeString(body.nome || '', 150),
      imagemUrl: sanitizeString(body.imagemUrl || '', 500) || '',
      linkProduto: body.linkProduto ? sanitizeString(body.linkProduto, 500) : null,
      valor: Number(body.valor),
      ativo: body.ativo !== false,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nome, valor, ativo } = parsed.data;
    const imagemUrl = parsed.data.imagemUrl ?? '';
    const linkProduto = parsed.data.linkProduto && parsed.data.linkProduto.trim() !== '' 
      ? parsed.data.linkProduto.trim() 
      : null;

    const presente = await prisma.presente.create({
      data: {
        nome,
        imagemUrl,
        linkProduto,
        valor,
        ativo: ativo ?? true,
      },
    });
    return NextResponse.json(presente);
  } catch (error) {
    console.error('Erro ao criar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar presente' },
      { status: 500 }
    );
  }
}
