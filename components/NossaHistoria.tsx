const HISTORIA_PADRAO =
  'Um dia nos encontramos e a vida ganhou um novo sentido. Cada momento compartilhado nos aproximou e hoje celebramos a decisão de seguir juntos para sempre. Agradecemos por fazer parte desta história e convidamos você para celebrar conosco este dia tão especial.';

interface NossaHistoriaProps {
  historia?: string | null;
}

export default function NossaHistoria({ historia }: NossaHistoriaProps) {
  const texto = historia?.trim() || HISTORIA_PADRAO;

  return (
    <section id="nossa-historia" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-wedding-charcoal mb-6">
          Nossa História
        </h2>
        <div className="w-16 h-px bg-wedding-gold mx-auto mb-10" />
        <p className="text-wedding-charcoal/90 leading-relaxed text-lg whitespace-pre-wrap">
          {texto}
        </p>
      </div>
    </section>
  );
}
