import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-wedding-cream flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-4xl text-wedding-charcoal mb-2">Página não encontrada</h1>
      <p className="text-wedding-charcoal/70 mb-6">A página que você procura não existe.</p>
      <Link href="/" className="btn-primary">
        Voltar ao início
      </Link>
    </main>
  );
}
