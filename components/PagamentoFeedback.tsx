'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PagamentoFeedback() {
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<'success' | 'falha' | 'pendente' | null>(null);

  useEffect(() => {
    const p = searchParams.get('pagamento');
    const extRef = searchParams.get('external_reference') || searchParams.get('externalReference');
    const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || searchParams.get('collection_id');

    if (p === 'success') {
      if (extRef && paymentId) {
        fetch('/api/pagamento/confirmar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            external_reference: extRef,
            payment_id: paymentId,
          }),
        }).catch(() => {});
      }
      setFeedback('success');
    } else if (p === 'falha') setFeedback('falha');
    else if (p === 'pendente') setFeedback('pendente');
  }, [searchParams]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      {feedback === 'success' && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg shadow-lg text-center">
          Pagamento aprovado! Obrigado pela contribuição.
        </div>
      )}
      {feedback === 'falha' && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow-lg text-center">
          O pagamento não pôde ser processado.
        </div>
      )}
      {feedback === 'pendente' && (
        <div className="p-4 bg-amber-100 text-amber-800 rounded-lg shadow-lg text-center">
          Pagamento em processamento.
        </div>
      )}
    </div>
  );
}
