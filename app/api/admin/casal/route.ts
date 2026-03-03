import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sanitizeString } from '@/lib/validations';

/** GET - Retorna dados do casal (admin) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const casal = await prisma.casal.findFirst({ orderBy: { id: 'desc' } });
    if (!casal) {
      return NextResponse.json(null);
    }
    return NextResponse.json({
      id: casal.id,
      nomeNoivo: casal.nomeNoivo,
      nomeNoiva: casal.nomeNoiva,
      dataEvento: casal.dataEvento.toISOString().slice(0, 16),
      horarioEvento: casal.horarioEvento,
      localEvento: casal.localEvento,
      enderecoCompleto: casal.enderecoCompleto,
      mapsUrl: casal.mapsUrl,
      fotoUrl: casal.fotoUrl,
      historiaCasal: casal.historiaCasal,
    });
  } catch (error) {
    console.error('Erro ao buscar casal:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}

/** PATCH - Atualiza dados do casal (admin) */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const casal = await prisma.casal.findFirst({ orderBy: { id: 'desc' } });
    if (!casal) {
      return NextResponse.json({ error: 'Casal não encontrado' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.nomeNoivo != null) data.nomeNoivo = sanitizeString(String(body.nomeNoivo), 100);
    if (body.nomeNoiva != null) data.nomeNoiva = sanitizeString(String(body.nomeNoiva), 100);
    if (body.dataEvento != null) data.dataEvento = new Date(body.dataEvento);
    if (body.horarioEvento !== undefined) data.horarioEvento = body.horarioEvento ? String(body.horarioEvento).trim().slice(0, 20) : null;
    if (body.localEvento != null) data.localEvento = sanitizeString(String(body.localEvento), 200);
    if (body.enderecoCompleto !== undefined) data.enderecoCompleto = body.enderecoCompleto ? sanitizeString(String(body.enderecoCompleto), 300) : null;
    if (body.mapsUrl !== undefined) data.mapsUrl = body.mapsUrl ? sanitizeString(String(body.mapsUrl), 500) : null;
    if (body.fotoUrl !== undefined) data.fotoUrl = body.fotoUrl ? sanitizeString(String(body.fotoUrl), 500) : '';
    if (body.historiaCasal !== undefined) data.historiaCasal = body.historiaCasal ? sanitizeString(String(body.historiaCasal), 5000) : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    const updated = await prisma.casal.update({
      where: { id: casal.id },
      data,
    });

    return NextResponse.json({
      nomeNoivo: updated.nomeNoivo,
      nomeNoiva: updated.nomeNoiva,
      dataEvento: updated.dataEvento.toISOString(),
      horarioEvento: updated.horarioEvento,
      localEvento: updated.localEvento,
      enderecoCompleto: updated.enderecoCompleto,
      mapsUrl: updated.mapsUrl,
      fotoUrl: updated.fotoUrl,
      historiaCasal: updated.historiaCasal,
    });
  } catch (error) {
    console.error('Erro ao atualizar casal:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
