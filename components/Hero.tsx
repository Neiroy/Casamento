'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  nomeNoivo: string;
  nomeNoiva: string;
  dataEvento: string;
  horarioEvento?: string | null;
  localEvento: string;
  enderecoCompleto?: string | null;
  mapsUrl?: string | null;
  fotoUrl: string;
}

export default function Hero({
  nomeNoivo,
  nomeNoiva,
  dataEvento,
  horarioEvento,
  localEvento,
  enderecoCompleto,
  mapsUrl,
  fotoUrl,
}: HeroProps) {
  const dataFormatada = new Date(dataEvento).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasImage = fotoUrl && fotoUrl !== '/placeholder-couple.jpg';

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {hasImage ? (
          <Image
            src={fotoUrl}
            alt="Casal"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={fotoUrl.startsWith('http') ? false : true}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-wedding-charcoal via-wedding-charcoal/95 to-wedding-gold-dark/80" />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="relative z-10 text-center text-white px-4 animate-fade-in">
        <p className="font-serif text-wedding-gold tracking-[0.3em] uppercase text-sm mb-2">
          Convite de Casamento
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-2">
          {nomeNoivo} <span className="text-wedding-gold">&</span> {nomeNoiva}
        </h1>
        <div className="w-24 h-px bg-wedding-gold mx-auto my-6" />
        <p className="font-serif text-xl md:text-2xl capitalize">{dataFormatada}</p>
        {horarioEvento && (
          <p className="mt-1 text-wedding-sand text-lg font-medium">às {horarioEvento.replace(/^às\s*/i, '')}</p>
        )}
        <p className="mt-2 text-wedding-sand text-lg">{localEvento}</p>
        {(enderecoCompleto || mapsUrl) && (
          <div className="mt-4 space-y-1">
            {enderecoCompleto && (
              <p className="text-wedding-sand text-sm max-w-md mx-auto">{enderecoCompleto}</p>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-wedding-gold hover:text-white transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.712-.96 19.58 19.58 0 0 0 2.699-2.266 19.5 19.5 0 0 0 2.288-3.56 19.59 19.59 0 0 0 1.442-4.227 19.41 19.41 0 0 0 .322-4.114 19.5 19.5 0 0 0-1.442-5.213 19.58 19.58 0 0 0-2.288-3.558 19.5 19.5 0 0 0-3.913-2.835 19.41 19.41 0 0 0-4.114-.322 19.59 19.59 0 0 0-4.227 1.442 19.5 19.5 0 0 0-3.56 2.288 19.58 19.58 0 0 0-2.266 2.7 16.975 16.975 0 0 0-.96 1.712l-.041.07-.016.029a.76.76 0 0 0 0 .723l.015.028.041.071a16.975 16.975 0 0 0 .96 1.713 19.58 19.58 0 0 0 2.699 2.266 19.5 19.5 0 0 0 3.56 2.288 19.41 19.41 0 0 0 4.227 1.442 19.59 19.59 0 0 0 4.114.322 19.5 19.5 0 0 0 5.213-1.442 19.58 19.58 0 0 0 3.558-2.288 19.5 19.5 0 0 0 2.835-3.913 19.41 19.41 0 0 0 .322-4.114 19.59 19.59 0 0 0-1.442-4.227 19.5 19.5 0 0 0-2.288-3.56 19.58 19.58 0 0 0-2.266-2.699 16.975 16.975 0 0 0-1.712-.96l-.071-.041-.028-.016a.76.76 0 0 0-.724 0l-.028.015-.071.042a16.975 16.975 0 0 0-1.712.96 19.58 19.58 0 0 0-2.699 2.266 19.5 19.5 0 0 0-2.288 3.56 19.59 19.59 0 0 0-1.442 4.227 19.41 19.41 0 0 0-.322 4.114 19.5 19.5 0 0 0 1.442 5.213 19.58 19.58 0 0 0 2.288 3.558 19.5 19.5 0 0 0 3.913 2.835 19.41 19.41 0 0 0 4.114.322 19.59 19.59 0 0 0 4.227-1.442 19.5 19.5 0 0 0 3.56-2.288 19.58 19.58 0 0 0 2.266-2.7 16.975 16.975 0 0 0 .96-1.712l.041-.07.016-.029a.76.76 0 0 0 0-.723l-.015-.028-.041-.071a16.975 16.975 0 0 0-.96-1.713ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
                Ver no mapa
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
