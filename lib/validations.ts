import { z } from 'zod';

/** Sanitiza string removendo caracteres perigosos */
export function sanitizeString(str: string, maxLength: number = 500): string {
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export const mensagemSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  mensagem: z.string().min(5, 'Mensagem deve ter pelo menos 5 caracteres').max(1000),
});

export const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuário obrigatório'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export const presenteSchema = z.object({
  nome: z.string().min(2).max(150),
  imagemUrl: z.string().max(500).optional(),
  linkProduto: z.string().max(500).optional().nullable(),
  valor: z.number().positive(),
  ativo: z.boolean().optional(),
});

export const pagamentoSchema = z.object({
  presenteId: z.number().int().positive(),
  nome: z.string().min(2).max(100),
  valor: z.number().positive(),
  metodo: z.enum(['pix', 'cartao']),
  email: z.string().email().optional(),
});

export const contribuicaoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  valor: z.number().min(0).optional(),
  metodo: z.enum(['pix', 'cartao']),
  email: z.string().email().optional(),
});

export type MensagemInput = z.infer<typeof mensagemSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PresenteInput = z.infer<typeof presenteSchema>;
export type PagamentoInput = z.infer<typeof pagamentoSchema>;
