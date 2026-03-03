import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/mercadopago';

/**
 * POST - Confirma pagamento quando usuário retorna do Mercado Pago.
 * Requer payment_id para validar com a API do Mercado Pago antes de confirmar.
 * Body: { external_reference, payment_id } — payment_id é obrigatório.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ref = body.external_reference || body.externalReference;
    const paymentId = body.payment_id || body.paymentId || body.collection_id;

    if (!ref || typeof ref !== 'string' || !ref.startsWith('pag-')) {
      return NextResponse.json({ error: 'Referência inválida' }, { status: 400 });
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'payment_id é obrigatório para validação' },
        { status: 400 }
      );
    }

    const pagamentoId = Number(ref.replace('pag-', ''));
    if (Number.isNaN(pagamentoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    if (pagamento.status === 'confirmado') {
      return NextResponse.json({ status: 'confirmado' });
    }

    try {
      const mpPayment = await getPayment(String(paymentId));
      const status = (mpPayment as { status?: string }).status;
      let externalRef = (mpPayment as { external_reference?: string }).external_reference;
      const metaRef = (mpPayment as { metadata?: { reference?: string } }).metadata?.reference;
      if (!externalRef && metaRef) externalRef = metaRef;

      if (
        (status === 'approved' || status === 'authorized') &&
        externalRef?.startsWith('pag-') &&
        externalRef === ref
      ) {
        await prisma.pagamento.update({
          where: { id: pagamentoId },
          data: { status: 'confirmado' },
        });
        return NextResponse.json({ status: 'confirmado' });
      }
    } catch (mpError) {
      console.error('Erro ao validar pagamento no Mercado Pago:', mpError);
      return NextResponse.json(
        { error: 'Não foi possível validar o pagamento' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Pagamento não aprovado ou referência não confere' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar' },
      { status: 500 }
    );
  }
}
