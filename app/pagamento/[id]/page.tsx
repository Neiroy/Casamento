'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatBRL } from '@/lib/formatBRL';

interface Presente {
  id: number;
  nome: string;
  imagemUrl: string;
  linkProduto: string | null;
  valor: number;
}

export default function PagamentoPage() {
  const params = useParams();
  const id = Number(params.id);
  const [presente, setPresente] = useState<Presente | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'pix' | 'redirect'>('form');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pixData, setPixData] = useState<{
    pagamentoId?: number;
    qr_code_base64?: string;
    qr_code?: string;
    pix_url?: string;
    use_static_qr?: boolean;
  } | null>(null);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pixChave, setPixChave] = useState({ chave: '(35) 99707-5707', chaveNumeros: '35997075707' });
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    fetch(`/api/presentes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Presente não encontrado');
        return res.json();
      })
      .then(setPresente)
      .catch(() => setPresente(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (step === 'pix') {
      fetch('/api/pix-config')
        .then((r) => r.json())
        .then((d) => setPixChave({ chave: d.chave, chaveNumeros: d.chaveNumeros }))
        .catch(() => {});
    }
  }, [step]);

  async function handlePix() {
    if (!presente || !nome.trim()) {
      setError('Preencha seu nome.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenteId: presente.id,
          nome: nome.trim(),
          valor: presente.valor,
          metodo: 'pix',
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX');
      setPixData({
        pagamentoId: data.pagamentoId,
        qr_code_base64: data.qr_code_base64,
        qr_code: data.qr_code,
        pix_url: data.pix_url,
        use_static_qr: data.use_static_qr,
      });
      setStep('pix');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar PIX');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step !== 'pix' || !pixData?.pagamentoId || pixData.use_static_qr) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/pagamento/status/${pixData.pagamentoId}`);
        const d = await r.json();
        if (d.status === 'confirmado') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPixConfirmed(true);
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

  async function handleCartao() {
    if (!presente || !nome.trim()) {
      setError('Preencha seu nome.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenteId: presente.id,
          nome: nome.trim(),
          valor: presente.valor,
          metodo: 'cartao',
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar checkout');
      if (data.init_point) {
        setInitPoint(data.init_point);
        setStep('redirect');
        window.location.href = data.init_point;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar checkout');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-wedding-cream flex items-center justify-center">
        <p className="text-wedding-charcoal/70">Carregando...</p>
      </main>
    );
  }

  if (!presente) {
    return (
      <main className="min-h-screen bg-wedding-cream flex flex-col items-center justify-center px-4">
        <p className="text-wedding-charcoal mb-4">Presente não encontrado.</p>
        <Link href="/presentes" className="btn-primary">
          Voltar à lista
        </Link>
      </main>
    );
  }

  if (step === 'pix' && pixData) {
    const useDynamicQr = pixData.qr_code_base64 || pixData.qr_code;
    return (
      <main className="min-h-screen bg-wedding-cream py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="font-serif text-2xl text-wedding-charcoal mb-2">Pagamento PIX</h2>
          {pixConfirmed && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg animate-pulse">
              ✓ Pagamento confirmado! Redirecionando...
            </div>
          )}
          {!pixConfirmed && (
            <>
              <p className="text-wedding-charcoal/80 mb-6">
                Escaneie o QR Code ou use a chave Pix abaixo no app do seu banco.
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
              {pixData.qr_code && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(pixData.qr_code!)}
                    className="text-sm text-wedding-gold hover:underline"
                  >
                    Copiar código PIX
                  </button>
                </div>
              )}
              <div className="mb-6 py-4 border-t border-b border-wedding-sand">
                <p className="text-wedding-charcoal/80 text-sm mb-1">Ou use a chave Pix</p>
                <p className="font-semibold text-wedding-charcoal">Chave Pix</p>
                <p className="text-wedding-gold font-medium mt-1">{pixChave.chave}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(pixChave.chaveNumeros)}
                  className="mt-2 text-sm text-wedding-gold hover:underline"
                >
                  Copiar chave
                </button>
              </div>
              {useDynamicQr && (
                <p className="text-sm text-wedding-charcoal/60 mb-4">Aguardando confirmação do pagamento...</p>
              )}
            </>
          )}
          <p className="text-sm text-wedding-charcoal/70">
            Valor: {formatBRL(presente?.valor || 0)} — {presente?.nome}
          </p>
          <Link href="/" className="btn-primary mt-6 inline-block">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  if (step === 'redirect' && initPoint) {
    return (
      <main className="min-h-screen bg-wedding-cream flex flex-col items-center justify-center px-4">
        <p className="text-wedding-charcoal mb-4">Redirecionando para o checkout...</p>
        <a href={initPoint} className="btn-primary">
          Clique aqui se não for redirecionado
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-wedding-cream py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-wedding-sand">
          <div className="p-6 border-b border-wedding-sand">
            <h1 className="font-serif text-2xl text-wedding-charcoal">{presente.nome}</h1>
            <p className="text-wedding-gold font-semibold mt-2">
              {formatBRL(presente.valor)}
            </p>
          </div>
          <div className="p-6 space-y-4">
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
                maxLength={100}
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
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handlePix}
                disabled={submitting}
                className="btn-primary disabled:opacity-70"
              >
                {submitting ? '...' : 'Pagar com PIX'}
              </button>
              <button
                type="button"
                onClick={handleCartao}
                disabled={submitting}
                className="btn-outline disabled:opacity-70"
              >
                Cartão
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/" className="text-wedding-gold hover:underline">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
