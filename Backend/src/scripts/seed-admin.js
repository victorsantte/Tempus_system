/**
 * Cria o primeiro usuário administrador no banco.
 * Uso: node src/scripts/seed-admin.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@tempus.com';
  const senha = process.env.ADMIN_SENHA || 'Admin@123';
  const nome  = process.env.ADMIN_NOME  || 'Administrador';

  const hash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { senha: hash, perfil: 'administrador' },
    create: { nome, email, senha: hash, perfil: 'administrador' },
  });

  console.log(`✅ Usuário admin criado/atualizado: ${usuario.email}`);
  console.log(`   Senha: ${senha}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
