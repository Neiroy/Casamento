import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Retorna dados do casal para a home.
 * Se não houver registro, retorna dados padrão.
 */
export async function GET() {
  try {
    const casal = await prisma.casal.findFirst({
      orderBy: { id: 'desc' },
    });

    if (casal) {
      return NextResponse.json({
        nomeNoivo: casal.nomeNoivo,
        nomeNoiva: casal.nomeNoiva,
        dataEvento: casal.dataEvento.toISOString(),
        horarioEvento: casal.horarioEvento,
        localEvento: casal.localEvento,
        enderecoCompleto: casal.enderecoCompleto,
        mapsUrl: casal.mapsUrl,
        fotoUrl: casal.fotoUrl,
        historiaCasal: casal.historiaCasal,
      });
    }

    // Dados padrão para desenvolvimento
    return NextResponse.json({
      nomeNoivo: 'João Paulo',
      nomeNoiva: 'Sabrina',
      dataEvento: new Date().toISOString(),
      localEvento: 'Salão de Eventos - Endereço completo aqui',
      fotoUrl: '/placeholder-couple.jpg',
    });
  } catch (error) {
    console.error('Erro ao buscar casal:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
