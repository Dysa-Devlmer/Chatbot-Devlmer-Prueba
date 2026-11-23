/**
 * Seed Dinámico para Nuevos Tenants SaaS
 * Ejecuta la inicialización de AdminProfile, BusinessProfile y Catálogo Template.
 * Uso: node scripts/seed-tenant.js <tenant_id> <business_name> <template> <currency_symbol>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

const tenantId = process.argv[2];
const businessName = process.argv[3] || 'Mi Negocio SaaS';
const template = process.argv[4] || 'fast_food';
const currency = process.argv[5] || 'S/.';

if (!tenantId) {
  console.error('❌ Error: Falta el parámetro tenant_id. Uso: node scripts/seed-tenant.js <tenant_id> [nombre] [template] [currency]');
  process.exit(1);
}

process.env.DATABASE_URL = `file:./prisma/tenants/${tenantId}.db`;

console.log(`🌱 Sembrando tenant: ${tenantId}`);
console.log(`📁 Base de datos: ${process.env.DATABASE_URL}`);

const prisma = new PrismaClient();

async function main() {
  // 1. Password default seguro
  const defaultPasswordHash = await bcrypt.hash('pithy2024', 12);

  // 2. Admin Profile
  const admin = await prisma.adminProfile.upsert({
    where: { username: 'admin' },
    update: {
      company: businessName,
      name: `Admin ${businessName}`,
    },
    create: {
      username: 'admin',
      password: defaultPasswordHash,
      name: `Admin ${businessName}`,
      email: `admin@${tenantId}.zgamersa.com`,
      company: businessName,
      role: 'SuperAdmin',
      timezone: 'America/Lima',
      language: 'es',
      theme: 'dark',
      accentColor: '#f97316',
    },
  });
  console.log(`✅ Admin Profile creado: ${admin.username} (password: pithy2024)`);

  // 3. Business Profile
  let industry = 'Comida Rápida';
  if (template === 'pizzeria') industry = 'Pizzería & Trattoria';
  if (template === 'retail') industry = 'Retail & Comercio';

  const business = await prisma.businessProfile.upsert({
    where: { id: 'default-business' },
    update: {
      name: businessName,
      currencySymbol: currency,
    },
    create: {
      id: 'default-business',
      name: businessName,
      phone: '+51 900 000 000',
      address: 'Av. Principal 123, Local Comercial',
      email: `contacto@${tenantId}.zgamersa.com`,
      industry,
      description: `Los mejores productos de ${industry} con atención digital y delivery en vivo.`,
      currencySymbol: currency,
      currency: 'PEN',
      allowReservations: true,
    },
  });
  console.log(`✅ Business Profile configurado: "${business.name}" (${business.currencySymbol})`);

  // 4. Catálogo según template
  if (template === 'fast_food') {
    const catBroaster = await prisma.category.create({
      data: { name: 'Pollo Broaster', description: 'Pollo crujiente con papas y ensalada' },
    });
    const catBurgers = await prisma.category.create({
      data: { name: 'Hamburguesas', description: 'Carne artesanal a la parrilla' },
    });
    const catBebidas = await prisma.category.create({
      data: { name: 'Bebidas', description: 'Gaseosas y refrescos helados' },
    });

    await prisma.product.createMany({
      data: [
        { name: '1/4 Pollo Broaster', description: 'Pierna o encuentro con papas y salsas', price: 18.50, stock: 50, categoryId: catBroaster.id },
        { name: '1/2 Pollo Broaster Familiar', description: 'Dos presas grandes con papas familiares', price: 34.00, stock: 30, categoryId: catBroaster.id },
        { name: 'Hamburguesa Clásica', description: 'Carne artesanal 120g con queso y papas', price: 15.00, stock: 40, categoryId: catBurgers.id },
        { name: 'Hamburguesa Doble Queso', description: 'Doble carne con doble queso cheddar fundido', price: 22.00, stock: 35, categoryId: catBurgers.id },
        { name: 'Gaseosa 500ml', description: 'Gaseosa personal bien helada', price: 4.50, stock: 100, categoryId: catBebidas.id },
      ],
    });
    console.log('✅ Catálogo Fast Food precargado (5 platos listos)');
  } else if (template === 'pizzeria') {
    const catPizzas = await prisma.category.create({
      data: { name: 'Pizzas Artesanales', description: 'Masa madre a la piedra con queso mozzarella' },
    });
    const catBebidas = await prisma.category.create({
      data: { name: 'Bebidas', description: 'Gaseosas y bebidas refrescantes' },
    });

    await prisma.product.createMany({
      data: [
        { name: 'Pizza Americana Familiar', description: 'Salsa pomodoro, mozzarella y jamón inglés', price: 32.00, stock: 40, categoryId: catPizzas.id },
        { name: 'Pizza Pepperoni Suprema', description: 'Abundante pepperoni americano y orégano fresco', price: 36.00, stock: 35, categoryId: catPizzas.id },
        { name: 'Pizza Hawaiana', description: 'Jamón seleccionado con piña caramelizada', price: 34.00, stock: 30, categoryId: catPizzas.id },
        { name: 'Gaseosa 1.5L Familiar', description: 'Gaseosa para compartir bien helada', price: 9.00, stock: 60, categoryId: catBebidas.id },
      ],
    });
    console.log('✅ Catálogo Pizzería precargado (4 productos listos)');
  } else {
    await prisma.category.create({
      data: { name: 'General', description: 'Productos principales del negocio' },
    });
    console.log('✅ Categoría General creada (Catálogo limpio)');
  }

  console.log(`🎉 ¡Tenant "${tenantId}" sembrado e inicializado al 100%!`);
}

main()
  .catch((err) => {
    console.error('❌ Error al sembrar tenant:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
