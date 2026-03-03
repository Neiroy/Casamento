'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(
          res.status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos.'
            : data.error || 'Usuário ou senha inválidos'
        );
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-wedding-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-wedding-sand p-8">
          <h1 className="font-serif text-2xl text-wedding-charcoal text-center mb-6">
            Área Administrativa
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-wedding-charcoal mb-1">
                Usuário
              </label>
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="input-field"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-wedding-charcoal mb-1">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center mt-4 text-wedding-charcoal/70 text-sm">
          <a href="/" className="text-wedding-gold hover:underline">
            Voltar ao site
          </a>
        </p>
      </div>
    </main>
  );
}
