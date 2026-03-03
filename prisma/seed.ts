import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash('admin123', 12);
  const admin = await prisma.admin.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      usuario: 'admin',
      senha,
    },
  });
  console.log('Admin criado/atualizado:', admin.usuario);

  // Presente "Contribuição" para contribuições gerais (PIX/Cartão)
  let contribuicao = await prisma.presente.findFirst({ where: { nome: 'Contribuição' } });
  if (!contribuicao) {
    contribuicao = await prisma.presente.create({
      data: { nome: 'Contribuição', imagemUrl: '', linkProduto: null, valor: 0, ativo: true },
    });
    console.log('Presente Contribuição criado.');
  }

  // Criar ou atualizar casal padrão
  let casal = await prisma.casal.findFirst();
  const dadosCasal = {
    nomeNoivo: 'João Paulo',
    nomeNoiva: 'Sabrina',
    dataEvento: new Date(),
    horarioEvento: '18h',
    localEvento: 'Salão de Eventos',
    enderecoCompleto: 'Rua Exemplo, 123 - Centro - Sua Cidade',
    mapsUrl: null as string | null,
    fotoUrl: '',
    historiaCasal:
      'Um dia nos encontramos e a vida ganhou um novo sentido. Cada momento compartilhado nos aproximou e hoje celebramos a decisão de seguir juntos para sempre. Agradecemos por fazer parte desta história e convidamos você para celebrar conosco este dia tão especial.',
  };
  if (casal) {
    casal = await prisma.casal.update({
      where: { id: casal.id },
      data: dadosCasal,
    });
    console.log('Casal atualizado:', casal.nomeNoivo, '&', casal.nomeNoiva);
  } else {
    casal = await prisma.casal.create({
      data: dadosCasal,
    });
    console.log('Casal criado:', casal.nomeNoivo, '&', casal.nomeNoiva);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
