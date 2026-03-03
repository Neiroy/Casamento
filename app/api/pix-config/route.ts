import { NextResponse } from 'next/server';

/** Retorna a chave PIX para exibição (pública) */
export async function GET() {
  const chave = process.env.PIX_CHAVE || '(35) 99707-5707';
  const chaveNumeros = chave.replace(/\D/g, '');
  return NextResponse.json({ chave, chaveNumeros });
}
