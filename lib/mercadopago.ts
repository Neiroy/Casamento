import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!accessToken) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN não definido. Pagamentos não funcionarão.');
}

const client = new MercadoPagoConfig({
  accessToken: accessToken || '',
  options: { timeout: 5000 },
});

const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);

export interface CreatePixPaymentParams {
  transactionAmount: number;
  description: string;
  payerEmail: string;
  payerFirstName: string;
  externalReference?: string;
}

/**
 * Cria um pagamento PIX no Mercado Pago.
 * Retorna point_of_interaction para exibir QR Code e código copia e cola.
 */
export async function createPixPayment(params: CreatePixPaymentParams) {
  const response = await paymentClient.create({
    body: {
      transaction_amount: params.transactionAmount,
      description: params.description,
      payment_method_id: 'pix',
      payer: {
        email: params.payerEmail,
        first_name: params.payerFirstName,
      },
      external_reference: params.externalReference || undefined,
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
    },
  });

  return response;
}

export interface CreatePreferenceParams {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }>;
  payerEmail: string;
  payerName: string;
  externalReference?: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

/**
 * Cria uma preferência (checkout) para pagamento com cartão.
 * Redireciona o usuário para o checkout do Mercado Pago.
 */
export async function createPreference(params: CreatePreferenceParams) {
  const items = params.items.map((item, index) => ({
    ...item,
    id: `item-${index + 1}`,
  }));
  const response = await preferenceClient.create({
    body: {
      items,
      payer: {
        email: params.payerEmail,
        name: params.payerName,
      },
      external_reference: params.externalReference || undefined,
      back_urls: params.backUrls || {
        success: `${baseUrl}/presentes?success=1`,
        failure: `${baseUrl}/presentes?failure=1`,
        pending: `${baseUrl}/presentes?pending=1`,
      },
      auto_return: 'approved' as const,
      notification_url: `${baseUrl}/api/webhook/mercadopago`,
    },
  });

  return response;
}

/**
 * Busca um pagamento pelo ID do Mercado Pago.
 */
export async function getPayment(paymentId: string) {
  return paymentClient.get({ id: paymentId });
}
