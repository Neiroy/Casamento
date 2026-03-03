import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { presenteSchema, sanitizeString } from '@/lib/validations';

/** GET - Busca um presente por ID (público para página de pagamento) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const presente = await prisma.presente.findFirst({
      where: { id, ativo: true },
    });
    if (!presente) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }
    return NextResponse.json(presente);
  } catch (error) {
    console.error('Erro ao buscar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar presente' },
      { status: 500 }
    );
  }
}

/** PUT - Atualiza presente (apenas admin) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = presenteSchema.partial().safeParse({
      nome: body.nome != null ? sanitizeString(String(body.nome), 150) : undefined,
      imagemUrl: body.imagemUrl != null ? sanitizeString(String(body.imagemUrl), 500) : undefined,
      linkProduto: body.linkProduto !== undefined ? (body.linkProduto ? sanitizeString(String(body.linkProduto), 500) : null) : undefined,
      valor: body.valor != null ? Number(body.valor) : undefined,
      ativo: body.ativo,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const presente = await prisma.presente.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(presente);
  } catch (error) {
    console.error('Erro ao atualizar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar presente' },
      { status: 500 }
    );
  }
}

/** DELETE - Remove presente (apenas admin) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.presente.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir presente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir presente' },
      { status: 500 }
    );
  }
}
