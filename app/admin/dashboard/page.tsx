'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatBRL } from '@/lib/formatBRL';

interface Mensagem {
  id: number;
  nome: string;
  mensagem: string;
  status: string;
  curtida: boolean;
  createdAt: string;
}

interface Pagamento {
  id: number;
  nome: string;
  valor: number;
  metodo: string;
  status: string;
  createdAt: string;
  presente: { nome: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'casal' | 'mensagens' | 'pagamentos'>('casal');
  const [casal, setCasal] = useState<{
    nomeNoivo: string;
    nomeNoiva: string;
    dataEvento: string;
    horarioEvento: string;
    localEvento: string;
    enderecoCompleto: string;
    mapsUrl: string;
    fotoUrl: string;
    historiaCasal: string;
  } | null>(null);
  const [casalSaving, setCasalSaving] = useState(false);
  const [casalSaved, setCasalSaved] = useState(false);

  async function loadData() {
    try {
      const [msgRes, pagRes, casalRes] = await Promise.all([
        fetch('/api/mensagens'),
        fetch('/api/admin/pagamentos'),
        fetch('/api/admin/casal'),
      ]);
      if (msgRes.status === 401 || pagRes.status === 401 || casalRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      const msgData = await msgRes.json();
      const pagData = await pagRes.json();
      const casalData = await casalRes.json();
      setMensagens(Array.isArray(msgData) ? msgData : []);
      setPagamentos(Array.isArray(pagData) ? pagData : []);
      if (casalData) {
        setCasal({
          nomeNoivo: casalData.nomeNoivo || '',
          nomeNoiva: casalData.nomeNoiva || '',
          dataEvento: casalData.dataEvento ? casalData.dataEvento.slice(0, 16) : '',
          horarioEvento: casalData.horarioEvento || '',
          localEvento: casalData.localEvento || '',
          enderecoCompleto: casalData.enderecoCompleto || '',
          mapsUrl: casalData.mapsUrl || '',
          fotoUrl: casalData.fotoUrl || '',
          historiaCasal: casalData.historiaCasal || '',
        });
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  async function excluirMensagem(id: number) {
    if (!confirm('Excluir esta mensagem? Ela será removida do site.')) return;
    await fetch(`/api/admin/mensagens/${id}`, { method: 'DELETE' });
    loadData();
  }

  async function publicarMensagem(id: number) {
    await fetch(`/api/admin/mensagens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'aprovado' }),
    });
    loadData();
  }

  async function curtirMensagem(id: number, curtida: boolean) {
    await fetch(`/api/admin/mensagens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curtida }),
    });
    loadData();
  }

  async function salvarCasal(e: React.FormEvent) {
    e.preventDefault();
    if (!casal) return;
    setCasalSaving(true);
    setCasalSaved(false);
    try {
      const res = await fetch('/api/admin/casal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casal),
      });
      if (res.ok) {
        setCasalSaved(true);
        setTimeout(() => setCasalSaved(false), 3000);
      }
    } finally {
      setCasalSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-wedding-cream flex items-center justify-center">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-wedding-cream">
      <header className="bg-wedding-charcoal text-white py-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-xl">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-wedding-gold hover:underline text-sm">
            Ver site
          </Link>
          <button type="button" onClick={handleLogout} className="text-wedding-sand hover:underline text-sm">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex gap-2 mb-8 border-b border-wedding-sand">
          {(['casal', 'mensagens', 'pagamentos'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium capitalize ${
                tab === t
                  ? 'text-wedding-gold border-b-2 border-wedding-gold'
                  : 'text-wedding-charcoal/70 hover:text-wedding-charcoal'
              }`}
            >
              {t === 'casal' ? 'Dados do Casal' : t}
            </button>
          ))}
        </div>

        {tab === 'casal' && (
          casal ? (
          <div className="bg-white rounded-xl shadow border border-wedding-sand overflow-hidden">
            <form onSubmit={salvarCasal} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">Nome do noivo</label>
                  <input
                    type="text"
                    value={casal.nomeNoivo}
                    onChange={(e) => setCasal({ ...casal, nomeNoivo: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">Nome da noiva</label>
                  <input
                    type="text"
                    value={casal.nomeNoiva}
                    onChange={(e) => setCasal({ ...casal, nomeNoiva: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">Data do evento</label>
                  <input
                    type="datetime-local"
                    value={casal.dataEvento}
                    onChange={(e) => setCasal({ ...casal, dataEvento: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-charcoal mb-1">Horário (ex: 18h)</label>
                  <input
                    type="text"
                    value={casal.horarioEvento}
                    onChange={(e) => setCasal({ ...casal, horarioEvento: e.target.value })}
                    className="input-field"
                    placeholder="18h"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-wedding-charcoal mb-1">Nome do local</label>
                <input
                  type="text"
                  value={casal.localEvento}
                  onChange={(e) => setCasal({ ...casal, localEvento: e.target.value })}
                  className="input-field"
                  placeholder="Salão de Eventos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wedding-charcoal mb-1">Endereço completo</label>
                <input
                  type="text"
                  value={casal.enderecoCompleto}
                  onChange={(e) => setCasal({ ...casal, enderecoCompleto: e.target.value })}
                  className="input-field"
                  placeholder="Rua, número - Bairro - Cidade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wedding-charcoal mb-1">Link do Google Maps ou Waze</label>
                <input
                  type="url"
                  value={casal.mapsUrl}
                  onChange={(e) => setCasal({ ...casal, mapsUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wedding-charcoal mb-1">URL da foto do casal</label>
                <input
                  type="url"
                  value={casal.fotoUrl}
                  onChange={(e) => setCasal({ ...casal, fotoUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-wedding-charcoal mb-1">Nossa História</label>
                <textarea
                  value={casal.historiaCasal}
                  onChange={(e) => setCasal({ ...casal, historiaCasal: e.target.value })}
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Texto exibido na seção Nossa História..."
                />
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={casalSaving} className="btn-primary disabled:opacity-70">
                  {casalSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                {casalSaved && <span className="text-green-600 text-sm">Salvo com sucesso!</span>}
              </div>
            </form>
          </div>
          ) : (
          <div className="bg-white rounded-xl shadow border border-wedding-sand p-6">
            <p className="text-wedding-charcoal/70">
              Nenhum dado do casal encontrado. Execute <code className="bg-wedding-sand/50 px-2 py-1 rounded">npm run db:seed</code> para criar os dados iniciais.
            </p>
          </div>
          )
        )}

        {tab === 'mensagens' && (
          <div className="bg-white rounded-xl shadow border border-wedding-sand overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-wedding-sand/50">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Mensagem</th>
                    <th className="p-3">Curtir</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {mensagens.map((m) => (
                    <tr key={m.id} className="border-t border-wedding-sand">
                      <td className="p-3">{m.nome}</td>
                      <td className="p-3 max-w-xs truncate">{m.mensagem}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => curtirMensagem(m.id, !m.curtida)}
                          className={`transition-transform hover:scale-110 ${m.curtida ? 'text-red-500' : 'text-wedding-sand hover:text-wedding-gold'}`}
                          title={m.curtida ? 'Descurtir' : 'Curtir'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={m.curtida ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                        </button>
                      </td>
                      <td className="p-3">
                        {m.status === 'pendente' && (
                          <button
                            type="button"
                            onClick={() => publicarMensagem(m.id)}
                            className="text-green-600 hover:underline mr-2"
                          >
                            Publicar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => excluirMensagem(m.id)}
                          className="text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mensagens.length === 0 && (
              <p className="p-6 text-wedding-charcoal/70 text-center">Nenhuma mensagem.</p>
            )}
          </div>
        )}

        {tab === 'pagamentos' && (
          <div className="bg-white rounded-xl shadow border border-wedding-sand overflow-hidden">
            <p className="p-4 text-sm text-wedding-charcoal/70 border-b border-wedding-sand">
              Apenas pagamentos confirmados automaticamente pelo webhook do Mercado Pago.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-wedding-sand/50">
                  <tr>
                    <th className="p-3">Presente</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p) => (
                    <tr key={p.id} className="border-t border-wedding-sand">
                      <td className="p-3">{p.presente?.nome}</td>
                      <td className="p-3">{p.nome}</td>
                      <td className="p-3">{formatBRL(p.valor)}</td>
                      <td className="p-3">{p.metodo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagamentos.length === 0 && (
              <p className="p-6 text-wedding-charcoal/70 text-center">Nenhum pagamento confirmado.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
