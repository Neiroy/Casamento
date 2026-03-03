export default function Loading() {
  return (
    <main className="min-h-screen bg-wedding-cream flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-wedding-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-wedding-charcoal/70 text-sm">Carregando...</p>
      </div>
    </main>
  );
}
