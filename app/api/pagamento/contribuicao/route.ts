import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPixPayment, createPreference } from '@/lib/mercadopago';
import { contribuicaoSchema, sanitizeString } from '@/lib/validations';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * POST - Contribuição geral (PIX ou cartão).
 * PIX: cria pagamento via API MP, retorna QR Code dinâmico.
 * Cartão: cria preferência MP e redireciona ao checkout.
 * Webhook atualiza status automaticamente.
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
    const emailInput = body.email ? String(body.email).trim().slice(0, 255) : undefined;
    const parsed = contribuicaoSchema.safeParse({
      nome: sanitizeString(body.nome || '', 100),
      valor: body.valor != null ? Number(body.valor) : undefined,
      metodo: body.metodo === 'cartao' ? 'cartao' : 'pix',
      email: emailInput || undefined,
    });

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Dados inválidos';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { nome, metodo, email } = parsed.data;
    const valorFinal = parsed.data.valor && parsed.data.valor > 0 ? parsed.data.valor : 1;

    const contribuicaoPresente = await prisma.presente.findFirst({
      where: { nome: 'Contribuição', ativo: true },
    });
    if (!contribuicaoPresente) {
      return NextResponse.json({ error: 'Configuração de contribuição não encontrada' }, { status: 500 });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        presenteId: contribuicaoPresente.id,
        nome,
        valor: valorFinal,
        metodo,
        status: 'pendente',
      },
    });

    const externalRef = `pag-${pagamento.id}`;
    const payerEmail = email || `contato-${pagamento.id}@casamento.local`;

    if (metodo === 'pix') {
      try {
        const pixResponse = await createPixPayment({
          transactionAmount: valorFinal,
          description: 'Contribuição - Casamento',
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
          qr_code_base64: null,
          qr_code: null,
        });
      }
    }

    try {
      const preference = await createPreference({
        items: [
          { title: 'Contribuição - Casamento', quantity: 1, unit_price: valorFinal },
        ],
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
    console.error('Erro na contribuição:', error);
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 });
  }
}
