'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ContribuicaoPage() {
  const [metodo, setMetodo] = useState<'pix' | 'cartao'>('pix');
  const [pixChave, setPixChave] = useState({ chave: '(35) 99707-5707', chaveNumeros: '35997075707' });
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'success' | 'falha' | 'pendente' | null>(null);

  const [step, setStep] = useState<'form' | 'pix-qr'>('form');
  const [pixData, setPixData] = useState<{
    pagamentoId: number;
    qr_code_base64?: string | null;
    qr_code?: string | null;
    use_static_qr?: boolean;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/pix-config')
      .then((r) => r.json())
      .then((d) => setPixChave({ chave: d.chave, chaveNumeros: d.chaveNumeros }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('pagamento');
    if (p === 'success') setFeedback('success');
    else if (p === 'falha') setFeedback('falha');
    else if (p === 'pendente') setFeedback('pendente');
  }, []);

  useEffect(() => {
    if (step !== 'pix-qr' || !pixData || pixData.use_static_qr) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/pagamento/status/${pixData.pagamentoId}`);
        const d = await r.json();
        if (d.status === 'confirmado') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setFeedback('success');
          setTimeout(() => {
            window.location.href = '/?pagamento=success';
          }, 1500);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, pixData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Preencha seu nome.');
      return;
    }
    const val = valor.trim() ? Number(valor.replace(',', '.')) : 1;
    if (val < 0) {
      setError('Valor inválido.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pagamento/contribuicao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          valor: val > 0 ? val : 1,
          metodo,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');

      if (metodo === 'cartao' && data.init_point) {
        window.location.href = data.init_point;
        return;
      }

      if (metodo === 'pix' && data.pagamentoId) {
        setPixData({
          pagamentoId: data.pagamentoId,
          qr_code_base64: data.qr_code_base64,
          qr_code: data.qr_code,
          use_static_qr: data.use_static_qr,
        });
        setStep('pix-qr');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao processar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-wedding-cream">
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-wedding-charcoal mb-2">
            Contribuição
          </h1>
          <div className="w-20 h-px bg-wedding-gold mx-auto my-4" />
          <p className="text-wedding-charcoal/80">
            Escolha uma forma de contribuição que preferir.
          </p>
        </div>

        {feedback === 'success' && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
            Pagamento aprovado! Obrigado pela contribuição.
          </div>
        )}
        {feedback === 'falha' && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
            O pagamento não pôde ser processado. Tente novamente.
          </div>
        )}
        {feedback === 'pendente' && (
          <div className="mb-6 p-4 bg-amber-100 text-amber-800 rounded-lg text-center">
            Pagamento em processamento.
          </div>
        )}

        {/* Seletor PIX | Cartão */}
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setMetodo('pix')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              metodo === 'pix'
                ? 'bg-wedding-gold text-white'
                : 'bg-white border border-wedding-sand text-wedding-charcoal hover:border-wedding-gold'
            }`}
          >
            PIX
          </button>
          <button
            type="button"
            onClick={() => setMetodo('cartao')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              metodo === 'cartao'
                ? 'bg-wedding-gold text-white'
                : 'bg-white border border-wedding-sand text-wedding-charcoal hover:border-wedding-gold'
            }`}
          >
            Cartão
          </button>
        </div>

        {step === 'pix-qr' && pixData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {feedback === 'success' && (
              <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg animate-pulse">
                ✓ Pagamento confirmado! Redirecionando...
              </div>
            )}
            {feedback !== 'success' && (
              <>
                <p className="text-wedding-charcoal/80 mb-6">
                  Escaneie o QR Code ou copie o código PIX abaixo no app do seu banco.
                </p>
                <div className="mb-6 flex justify-center">
                  {pixData.qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      width={224}
                      height={224}
                      className="w-56 h-56"
                    />
                  ) : (
                    <Image src="/qr-pix.png" alt="QR Code PIX" width={224} height={224} className="w-56 h-56" />
                  )}
                </div>
                {pixData.qr_code && !pixData.use_static_qr && (
                  <div className="mb-6 py-4 border-t border-b border-wedding-sand">
                    <p className="text-wedding-charcoal/80 text-sm mb-2">Ou copie o código PIX</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(pixData.qr_code!)}
                      className="text-sm text-wedding-gold hover:underline"
                    >
                      Copiar código PIX
                    </button>
                  </div>
                )}
                <p className="text-sm text-wedding-charcoal/60">
                  {pixData.use_static_qr
                    ? 'Pague via PIX. A confirmação será feita manualmente.'
                    : 'Aguardando confirmação do pagamento...'}
                </p>
              </>
            )}
            <Link href="/" className="btn-primary mt-6 inline-block">
              Voltar ao início
            </Link>
          </div>
        )}

        {step === 'form' && metodo === 'pix' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-wedding-sand">
            <div className="p-6">
              <h2 className="font-serif text-xl text-wedding-charcoal mb-4">
                Contribuir com PIX
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">Seu nome *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input-field"
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">
                    Valor da contribuição (R$) — opcional
                  </label>
                  <input
                    type="text"
                    value={valor}
                    onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ''))}
                    className="input-field"
                    placeholder="Deixe em branco para definir no app"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="seu@email.com"
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-70"
                >
                  {submitting ? 'Gerando QR Code...' : 'Gerar QR Code PIX'}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'form' && metodo === 'cartao' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-wedding-sand">
            <div className="p-6">
              <h2 className="font-serif text-xl text-wedding-charcoal mb-4">
                Contribuir com cartão
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">
                    Seu nome *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input-field"
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">
                    Valor da contribuição (R$) — opcional
                  </label>
                  <input
                    type="text"
                    value={valor}
                    onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ''))}
                    className="input-field"
                    placeholder="Deixe em branco para definir no app"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="seu@email.com"
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-70"
                >
                  {submitting ? 'Redirecionando...' : 'Ir para pagamento com cartão'}
                </button>
              </form>
              <p className="mt-4 text-xs text-wedding-charcoal/60">
                Você será redirecionado ao checkout seguro do Mercado Pago.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-wedding-gold hover:underline">
            ← Voltar ao convite
          </Link>
        </div>
      </div>
    </main>
  );
}
