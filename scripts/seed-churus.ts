import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChurus() {
  console.log("--- Configurando Perfil de Churu's Fast Food ---");
  await prisma.businessProfile.upsert({
    where: { id: 'default' },
    update: {
      name: "Churu's Comida Rápida",
      industry: 'Comida Rápida / Fast Food',
      description: 'Especialistas en broaster, alitas con salsas exclusivas, hamburguesas artesanales, salchipapas, enchiladas y complementos.',
      address: 'Servicio en local, Delivery y Recojo',
      phone: '+56 9 6541 9765',
      currency: 'PEN',
      currencySymbol: 'S/.',
      policies: 'Pedidos por delivery o recojo en tienda. Pagos vía Yape, Plin o contraentrega. Indicar dirección exacta y salsas al ordenar.',
      allowReservations: true,
      customPrompt: "Eres el asistente virtual oficial de Churu's, comida rápida. Tu trato es cálido, ágil, entusiasta y muy eficiente. Conoces a la perfección el menú (Broaster, Alitas, Hamburguesas, Salchipapas, Enchiladas, Especiales, Complementos y Bebidas). Cuando el cliente pida alitas, recuérdale elegir su salsa (BBQ, Acevichada, Buffalo, BBQ Picante, Oriental dulce/salado o Charapitas). Si piden broaster, ofrece convertirlo a salchibroaster por +5 soles. Toma el pedido con claridad, confirma dirección y método de pago (Yape/Plin/Efectivo) y genera la reserva formal con su código."
    },
    create: {
      id: 'default',
      name: "Churu's Comida Rápida",
      industry: 'Comida Rápida / Fast Food',
      description: 'Especialistas en broaster, alitas con salsas exclusivas, hamburguesas artesanales, salchipapas, enchiladas y complementos.',
      address: 'Servicio en local, Delivery y Recojo',
      phone: '+56 9 6541 9765',
      currency: 'PEN',
      currencySymbol: 'S/.',
      policies: 'Pedidos por delivery o recojo en tienda. Pagos vía Yape, Plin o contraentrega. Indicar dirección exacta y salsas al ordenar.',
      allowReservations: true,
      customPrompt: "Eres el asistente virtual oficial de Churu's, comida rápida. Tu trato es cálido, ágil, entusiasta y muy eficiente. Conoces a la perfección el menú (Broaster, Alitas, Hamburguesas, Salchipapas, Enchiladas, Especiales, Complementos y Bebidas). Cuando el cliente pida alitas, recuérdale elegir su salsa (BBQ, Acevichada, Buffalo, BBQ Picante, Oriental dulce/salado o Charapitas). Si piden broaster, ofrece convertirlo a salchibroaster por +5 soles. Toma el pedido con claridad, confirma dirección y método de pago (Yape/Plin/Efectivo) y genera la reserva formal con su código."
    }
  });

  // Limpiar productos viejos para dejar la carta oficial limpia
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  const categoriesData = [
    { name: 'Broaster', description: 'Pollo crispy con papas huayro y ensalada' },
    { name: 'Hamburguesas', description: 'Carne artesanal de 125g o pollo crispy con queso cheddar, papas huayro y ensalada' },
    { name: 'Alitas', description: 'Alitas crispy bañadas en salsa favorita, papas huayro y ensalada' },
    { name: 'Salchipapas', description: 'Hot dog frankfurter con papas huayro y ensalada' },
    { name: 'Enchiladas', description: 'Masa de trigo con queso cheddar, papas al hilo y ensalada' },
    { name: 'Especiales', description: 'Platos especiales de la casa con combinaciones únicas' },
    { name: 'Complementos', description: 'Adicionales para acompañar tus platos' },
    { name: 'Bebidas', description: 'Gaseosas y bebidas frías' },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    catMap[cat.name] = created.id;
  }

  const productsData = [
    // BROASTER
    { name: 'Broaster Pierna', price: 14.00, stock: 50, categoryId: catMap['Broaster'], description: 'Delicioso pollo crispy (pierna), papas huayro, ensalada.' },
    { name: 'Broaster Encuentro', price: 15.50, stock: 50, categoryId: catMap['Broaster'], description: 'Delicioso pollo crispy (encuentro), papas huayro, ensalada.' },
    { name: 'Broaster Ala', price: 14.50, stock: 50, categoryId: catMap['Broaster'], description: 'Delicioso pollo crispy (ala), papas huayro, ensalada.' },
    { name: 'Broaster Pecho', price: 18.50, stock: 50, categoryId: catMap['Broaster'], description: 'Delicioso pollo crispy (pecho), papas huayro, ensalada.' },
    { name: 'Adicional Salchibroaster', price: 5.00, stock: 99, categoryId: catMap['Broaster'], description: 'Convierte tu broaster en salchibroaster agregando hot dog frankfurter.' },

    // HAMBURGUESAS
    { name: 'Hamburguesa Clásica', price: 17.50, stock: 40, categoryId: catMap['Hamburguesas'], description: '125 gr de carne artesanal, queso cheddar, papa huayro, ensalada.' },
    { name: 'Hamburguesa Doble', price: 24.50, stock: 40, categoryId: catMap['Hamburguesas'], description: 'Dos medallones de 125gr de carne artesanal, doble queso cheddar, papa huayro, ensalada.' },
    { name: 'Hamburguesa Royal', price: 23.00, stock: 40, categoryId: catMap['Hamburguesas'], description: '125 gr de carne artesanal, queso cheddar, jamón, huevo, papa huayro, ensalada.' },
    { name: 'Hamburguesa Crispy', price: 23.00, stock: 40, categoryId: catMap['Hamburguesas'], description: 'Delicioso pollo crispy, queso cheddar, papa huayro, ensalada.' },
    { name: 'Hamburguesa Bacon', price: 23.00, stock: 40, categoryId: catMap['Hamburguesas'], description: '125 gr de carne artesanal, tocino, salsa BBQ, queso cheddar, papa huayro, ensalada.' },
    { name: 'Hamburguesa La BBQ', price: 22.00, stock: 40, categoryId: catMap['Hamburguesas'], description: '125 gr de carne artesanal, salsa BBQ, queso cheddar, papa huayro, ensalada.' },

    // ALITAS
    { name: 'Alitas Salsa BBQ (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 6 alitas crispy en salsa BBQ, papas huayro, ensalada.' },
    { name: 'Alitas Acevichadas (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 6 alitas crispy en salsa acevichada, papas huayro, ensalada.' },
    { name: 'Alitas Buffalo (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 6 alitas crispy en salsa buffalo, papas huayro, ensalada.' },
    { name: 'Alitas Salsa BBQ Picante (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 6 alitas crispy en salsa BBQ picante, papas huayro, ensalada.' },
    { name: 'Alitas Oriental (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 6 alitas crispy en salsa oriental dulce o salado, papas huayro, ensalada.' },
    { name: 'Docena de Alitas (12 unidades)', price: 37.00, stock: 50, categoryId: catMap['Alitas'], description: 'Deliciosas 12 alitas crispy en tu salsa favorita, papas huayro, ensalada (dos opciones de salsas a escoger).' },
    { name: 'Alitas Charapitas (6 unidades)', price: 20.00, stock: 50, categoryId: catMap['Alitas'], description: '6 alitas crispy, papas huayro, ensalada de la casa y salsa charapita.' },

    // SALCHIPAPAS
    { name: 'Salchipapa Clásica', price: 15.50, stock: 60, categoryId: catMap['Salchipapas'], description: 'Hot dog frankfurter, papa huayro, ensalada.' },
    { name: 'Salchipapa Salchi Huevo', price: 17.50, stock: 60, categoryId: catMap['Salchipapas'], description: 'Hot dog frankfurter, huevo, papa huayro, ensalada.' },
    { name: 'Polli Papa', price: 19.50, stock: 50, categoryId: catMap['Salchipapas'], description: 'Hot dog frankfurter, filete de pollo, papa huayro, ensalada.' },
    { name: 'Salchi Carne', price: 20.00, stock: 50, categoryId: catMap['Salchipapas'], description: 'Hot dog frankfurter, carne, papa huayro, ensalada.' },
    { name: 'Salchimixta', price: 22.00, stock: 50, categoryId: catMap['Salchipapas'], description: 'Hot dog frankfurter, chorizo parrillero, chorizo finas hierbas, papas huayro, ensalada.' },
    { name: 'La Salchicharapa', price: 21.00, stock: 50, categoryId: catMap['Salchipapas'], description: 'Cecina, chorizo de la selva, patacones, ensalada de la casa acompañado de su salsa picante de cocona.' },

    // ENCHILADAS
    { name: 'Enchilada Mixta', price: 18.00, stock: 40, categoryId: catMap['Enchiladas'], description: 'Hot dog frankfurter, chorizo parrillero, chorizo ahumado, papas al hilo, queso cheddar, masa de trigo, ensalada.' },
    { name: 'Enchilada de Pollo', price: 17.00, stock: 40, categoryId: catMap['Enchiladas'], description: 'Delicioso pollo crispy, papas al hilo, queso cheddar, masa de trigo, ensalada.' },
    { name: 'Enchilada de Carne', price: 17.00, stock: 40, categoryId: catMap['Enchiladas'], description: '125 gr de carne artesanal, papas al hilo, queso cheddar, masa de trigo, ensalada.' },
    { name: 'Enchilada de Pollo Deshilachado', price: 18.00, stock: 40, categoryId: catMap['Enchiladas'], description: 'Pollo deshilachado, papas al hilo, queso cheddar, masa de trigo, ensalada.' },
    { name: 'Enchilada La Charapa', price: 18.00, stock: 40, categoryId: catMap['Enchiladas'], description: 'Cecina, chorizo de la selva, patacones, ensalada de la casa, papas al hilo y salsa picante de cocona.' },

    // ESPECIALES
    { name: 'Salchi Alitas', price: 25.00, stock: 35, categoryId: catMap['Especiales'], description: 'Deliciosas 6 alitas crispy en tu salsa favorita, hot dog frankfurter, papas huayro, ensalada.' },
    { name: 'Chicharrón de Pollo', price: 21.00, stock: 40, categoryId: catMap['Especiales'], description: 'Deliciosos 6 trozos de pollo crujiente, papas huayro, ensalada.' },
    { name: 'Mollejitas a la Parrilla', price: 15.50, stock: 30, categoryId: catMap['Especiales'], description: 'Deliciosas mollejitas a la parrilla, papas huayro, ensalada.' },
    { name: 'Especial de Churu', price: 30.00, stock: 30, categoryId: catMap['Especiales'], description: 'Hot dog frankfurter, 125gr de carne artesanal, tocino, filete de pollo, jamón, chorizo en finas hierbas, papas huayro, ensalada.' },
    { name: 'La Churu', price: 25.00, stock: 30, categoryId: catMap['Especiales'], description: 'Hot dog frankfurter, 125gr de carne artesanal, tocino, papa huayro, ensalada.' },

    // COMPLEMENTOS
    { name: 'Complemento Hotdog', price: 6.00, stock: 99, categoryId: catMap['Complementos'], description: 'Porción extra de hot dog frankfurter.' },
    { name: 'Complemento Huevo', price: 2.50, stock: 99, categoryId: catMap['Complementos'], description: 'Porción extra de huevo frito.' },
    { name: 'Complemento Carne', price: 7.00, stock: 99, categoryId: catMap['Complementos'], description: 'Porción extra de medallón de carne artesanal.' },
    { name: 'Porción de Papa Huayro', price: 10.00, stock: 99, categoryId: catMap['Complementos'], description: 'Porción generosa de papas huayro fritas.' },

    // BEBIDAS
    { name: 'Coca Cola', price: 4.50, stock: 80, categoryId: catMap['Bebidas'], description: 'Gaseosa Coca Cola personal bien helada.' },
    { name: 'Inka Cola', price: 4.50, stock: 80, categoryId: catMap['Bebidas'], description: 'Gaseosa Inka Cola personal bien helada.' },
    { name: 'Fanta', price: 4.50, stock: 80, categoryId: catMap['Bebidas'], description: 'Gaseosa Fanta personal bien helada.' }
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  const totalProds = await prisma.product.count();
  const totalCats = await prisma.category.count();
  console.log("✅ Churu's Fast Food configurado exitosamente.");
  console.log('Categorías registradas:', totalCats);
  console.log('Productos en carta:', totalProds);
}

seedChurus()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
