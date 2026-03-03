'use client';

import { useState, useEffect } from 'react';

interface MensagemAprovada {
  id: number;
  nome: string;
  mensagem: string;
  curtida: boolean;
  createdAt: string;
}

export default function MensagensForm() {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mensagens, setMensagens] = useState<MensagemAprovada[]>([]);

  useEffect(() => {
    fetch('/api/mensagens?status=aprovado')
      .then((r) => r.json())
      .then((d) => setMensagens(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, mensagem }),
      });
      const data = await res.json();
      if (res.ok) {
        setNome('');
        setMensagem('');
        setStatus('success');
      } else {
        setErrorMsg(data.error || (res.status === 429 ? 'Muitas mensagens. Aguarde um momento.' : 'Erro ao enviar.'));
        setStatus('error');
      }
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet.');
      setStatus('error');
    }
  }

  return (
    <section id="mensagens" className="py-20 px-4 bg-wedding-sand/30">
      <div className="max-w-xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-wedding-charcoal text-center mb-6">
          Mensagens para os Noivos
        </h2>
        <div className="w-16 h-px bg-wedding-gold mx-auto mb-10" />
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-wedding-charcoal mb-1">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input-field"
              placeholder="Digite seu nome"
              required
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="mensagem" className="block text-sm font-medium text-wedding-charcoal mb-1">
              Sua mensagem
            </label>
            <textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Deixe uma mensagem carinhosa..."
              required
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full disabled:opacity-70"
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
          </button>
          {status === 'success' && (
            <p className="text-green-700 text-center text-sm">Mensagem enviada com sucesso!</p>
          )}
          {status === 'error' && (
            <p className="text-red-600 text-center text-sm">{errorMsg || 'Erro ao enviar. Tente novamente.'}</p>
          )}
        </form>

        {mensagens.length > 0 && (
          <div className="mt-12 pt-10 border-t border-wedding-sand/50">
            <h3 className="font-serif text-xl text-wedding-charcoal text-center mb-6">
              Mensagens recebidas
            </h3>
            <div className="space-y-4">
              {mensagens.map((m) => (
                <article
                  key={m.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-wedding-sand/50"
                >
                  <p className="text-wedding-charcoal/90 whitespace-pre-wrap">{m.mensagem}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-wedding-charcoal/70 font-medium">{m.nome}</span>
                    {m.curtida && (
                      <span className="text-wedding-gold" aria-label="Curtida pelos noivos">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
