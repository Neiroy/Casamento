import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPixPayment, createPreference } from '@/lib/mercadopago';
import { pagamentoSchema, sanitizeString } from '@/lib/validations';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * POST - Inicia pagamento (PIX ou cartão) para presente específico.
 * PIX: cria pagamento via API MP, retorna QR dinâmico.
 * Cartão: cria preferência MP e redireciona ao checkout.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { ok } = checkRateLimit(`pagamento:${ip}`, RATE_LIMITS.pagamento);
  if (!ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = pagamentoSchema.safeParse({
      presenteId: Number(body.presenteId),
      nome: sanitizeString(body.nome || '', 100),
      valor: Number(body.valor),
      metodo: body.metodo === 'cartao' ? 'cartao' : 'pix',
      email: body.email ? String(body.email).trim().slice(0, 255) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { presenteId, nome, valor, metodo, email } = parsed.data;

    const presente = await prisma.presente.findFirst({
      where: { id: presenteId, ativo: true },
    });
    if (!presente) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        presenteId,
        nome,
        valor,
        metodo,
        status: 'pendente',
      },
    });

    const externalRef = `pag-${pagamento.id}`;
    const payerEmail = email || `contato-${pagamento.id}@casamento.local`;

    if (metodo === 'pix') {
      try {
        const pixResponse = await createPixPayment({
          transactionAmount: valor,
          description: presente.nome,
          payerEmail,
          payerFirstName: nome,
          externalReference: externalRef,
        });

        const mpPayment = pixResponse as {
          id?: number;
          point_of_interaction?: {
            transaction_data?: {
              qr_code_base64?: string;
              qr_code?: string;
            };
          };
        };

        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: { mpPaymentId: String(mpPayment.id || '') },
        });

        const qrBase64 = mpPayment.point_of_interaction?.transaction_data?.qr_code_base64;
        const qrCode = mpPayment.point_of_interaction?.transaction_data?.qr_code;

        return NextResponse.json({
          pagamentoId: pagamento.id,
          metodo: 'pix',
          qr_code_base64: qrBase64,
          qr_code: qrCode,
        });
      } catch (pixError) {
        console.error('Erro ao criar PIX:', pixError);
        return NextResponse.json({
          pagamentoId: pagamento.id,
          metodo: 'pix',
          use_static_qr: true,
          pix_url: process.env.PIX_LINK || '',
          qr_code_base64: null,
          qr_code: null,
        });
      }
    }

    try {
      const preference = await createPreference({
        items: [{ title: presente.nome, quantity: 1, unit_price: valor }],
        payerEmail,
        payerName: nome,
        externalReference: externalRef,
        backUrls: {
          success: `${baseUrl}/?pagamento=success`,
          failure: `${baseUrl}/?pagamento=falha`,
          pending: `${baseUrl}/?pagamento=pendente`,
        },
      });

      const initPoint = (preference as { init_point?: string }).init_point;
      if (!initPoint) {
        return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 });
      }
      return NextResponse.json({
        pagamentoId: pagamento.id,
        metodo: 'cartao',
        init_point: initPoint,
      });
    } catch (prefError) {
      console.error('Erro ao criar preferência:', prefError);
      const linkCartao = process.env.MERCADOPAGO_LINK_CARTAO || 'https://link.mercadopago.com.br/waeinformatica';
      return NextResponse.json({
        pagamentoId: pagamento.id,
        metodo: 'cartao',
        init_point: linkCartao,
      });
    }
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
