import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/mercadopago';

function validateWebhookSignature(
  request: NextRequest,
  body: { type?: string; data?: { id?: string } }
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  if (!xSignature) return false;

  const parts = xSignature.split(',');
  let ts = '';
  let hash = '';
  for (const part of parts) {
    const [key, value] = part.split('=').map((s) => s.trim());
    if (key === 'ts') ts = value || '';
    else if (key === 'v1') hash = value || '';
  }

  // MP doc: data.id_url vem dos query params; fallback para body
  const dataId =
    new URL(request.url).searchParams.get('data.id')?.toLowerCase() ||
    (body.data?.id ? String(body.data.id).toLowerCase() : '') ||
    '';
  if (!dataId || !ts) return false;

  const manifestParts = [`id:${dataId}`, `ts:${ts}`];
  if (xRequestId) manifestParts.splice(1, 0, `request-id:${xRequestId}`);
  const manifest = manifestParts.join(';') + ';';

  const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');
  return expectedHash === hash;
}

/**
 * Webhook do Mercado Pago.
 * Recebe notificações de pagamento e atualiza status no banco.
 * Valida x-signature quando MERCADOPAGO_WEBHOOK_SECRET está configurado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type;
    const paymentId = body.data?.id;

    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && !validateWebhookSignature(request, body)) {
      console.warn('Webhook MP: assinatura inválida ou ausente');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    if (type === 'payment' && paymentId) {
      const payment = await getPayment(String(paymentId));
      const status = (payment as { status?: string }).status;
      let externalRef = (payment as { external_reference?: string }).external_reference;

      const metaRef = (payment as { metadata?: { reference?: string } }).metadata?.reference;
      if (!externalRef && metaRef) externalRef = metaRef;

      if ((status === 'approved' || status === 'authorized') && externalRef?.startsWith('pag-')) {
        const pagamentoId = Number(externalRef.replace('pag-', ''));
        if (!Number.isNaN(pagamentoId)) {
          await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: { status: 'confirmado' },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Erro ao processar notificação' },
      { status: 500 }
    );
  }
}

/** GET - Alguns provedores fazem verificação; aceitar sem erro */
export async function GET() {
  return NextResponse.json({ ok: true });
}
