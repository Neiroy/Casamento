import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/** DELETE - Excluir mensagem (admin) */
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

    await prisma.mensagem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir mensagem' },
      { status: 500 }
    );
  }
}

/** PATCH - Curtir ou alterar status da mensagem (admin) */
export async function PATCH(
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
    const status = body.status === 'aprovado' || body.status === 'rejeitado' ? body.status : undefined;
    const curtida = typeof body.curtida === 'boolean' ? body.curtida : undefined;

    const data: { status?: string; curtida?: boolean } = {};
    if (status !== undefined) data.status = status;
    if (curtida !== undefined) data.curtida = curtida;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    const mensagem = await prisma.mensagem.update({
      where: { id },
      data,
    });
    return NextResponse.json(mensagem);
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar mensagem' },
      { status: 500 }
    );
  }
}
