import Hero from '@/components/Hero';
import NossaHistoria from '@/components/NossaHistoria';
import MensagensForm from '@/components/MensagensForm';
import Link from 'next/link';
import { Suspense } from 'react';
import PagamentoFeedback from '@/components/PagamentoFeedback';
import { prisma } from '@/lib/prisma';

const DEFAULT_CASAL = {
  nomeNoivo: 'João Paulo',
  nomeNoiva: 'Sabrina',
  dataEvento: new Date().toISOString(),
  horarioEvento: null as string | null,
  localEvento: 'Salão de Eventos',
  enderecoCompleto: null as string | null,
  mapsUrl: null as string | null,
  fotoUrl: '',
  historiaCasal: null as string | null,
};

async function getCasal() {
  try {
    const casal = await prisma.casal.findFirst({ orderBy: { id: 'desc' } });
    if (casal) {
      return {
        nomeNoivo: casal.nomeNoivo,
        nomeNoiva: casal.nomeNoiva,
        dataEvento: casal.dataEvento.toISOString(),
        horarioEvento: casal.horarioEvento ?? null,
        localEvento: casal.localEvento,
        enderecoCompleto: casal.enderecoCompleto ?? null,
        mapsUrl: casal.mapsUrl ?? null,
        fotoUrl: casal.fotoUrl,
        historiaCasal: casal.historiaCasal ?? null,
      };
    }
    return { ...DEFAULT_CASAL };
  } catch {
    return { ...DEFAULT_CASAL };
  }
}

export async function generateMetadata() {
  const casal = await getCasal();
  const title = `Casamento ${casal.nomeNoivo} & ${casal.nomeNoiva} | Convite Digital`;
  const description = `Celebre conosco o casamento de ${casal.nomeNoivo} e ${casal.nomeNoiva}. Confira nossa história e deixe sua mensagem.`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: baseUrl,
    },
  };
}

export default async function Home() {
  const casal = await getCasal();

  return (
    <main>
      <Suspense fallback={null}>
        <PagamentoFeedback />
      </Suspense>
      <Hero
        nomeNoivo={casal.nomeNoivo}
        nomeNoiva={casal.nomeNoiva}
        dataEvento={casal.dataEvento}
        horarioEvento={casal.horarioEvento}
        localEvento={casal.localEvento}
        enderecoCompleto={casal.enderecoCompleto}
        mapsUrl={casal.mapsUrl}
        fotoUrl={casal.fotoUrl || '/placeholder-couple.jpg'}
      />
      <NossaHistoria historia={casal.historiaCasal} />
      <MensagensForm />
      <section id="contribuicao" className="py-16 px-4 bg-wedding-charcoal text-white text-center">
        <h2 className="font-serif text-2xl md:text-3xl mb-4">Contribuição</h2>
        <p className="text-wedding-sand mb-8 max-w-md mx-auto">
          Se desejar nos presentear, sua contribuição ajuda a realizar nossa lua de mel.
        </p>
        <Link
          href="/presentes"
          className="btn-outline border-white text-white hover:bg-white hover:text-wedding-charcoal inline-block"
        >
          Contribuir
        </Link>
      </section>
      <footer className="py-10 text-center text-wedding-charcoal/70 text-sm border-t border-wedding-sand/30">
        <p className="font-serif text-wedding-charcoal/80">{casal.nomeNoivo} & {casal.nomeNoiva}</p>
        <p className="mt-1 text-wedding-charcoal/60">Com amor, para sempre</p>
        <Link href="/admin/login" className="block mt-4 text-wedding-charcoal/40 hover:text-wedding-gold text-xs transition-colors">
          Acesso restrito
        </Link>
      </footer>
    </main>
  );
}
