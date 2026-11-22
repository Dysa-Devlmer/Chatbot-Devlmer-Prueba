import { prisma } from './prisma';

export interface MultiCurrencyPrices {
  PEN: number;
  CLP: number;
  ARS: number;
}

export const PRODUCT_PRICES: Record<string, MultiCurrencyPrices> = {
  // Broaster
  "Broaster Pierna": { PEN: 14.00, CLP: 4900, ARS: 7500 },
  "Broaster Encuentro": { PEN: 15.50, CLP: 5200, ARS: 8000 },
  "Broaster Ala": { PEN: 14.50, CLP: 4900, ARS: 7500 },
  "Broaster Pecho": { PEN: 18.50, CLP: 5900, ARS: 9000 },
  "Adicional Salchibroaster": { PEN: 5.00, CLP: 1800, ARS: 2800 },

  // Hamburguesas
  "Hamburguesa Clásica": { PEN: 17.50, CLP: 5500, ARS: 8500 },
  "Hamburguesa Doble": { PEN: 24.50, CLP: 7500, ARS: 12000 },
  "Hamburguesa Royal": { PEN: 23.00, CLP: 6900, ARS: 11000 },
  "Hamburguesa Crispy": { PEN: 23.00, CLP: 6900, ARS: 11000 },
  "Hamburguesa Bacon": { PEN: 23.00, CLP: 6900, ARS: 11000 },
  "Hamburguesa La BBQ": { PEN: 22.00, CLP: 6500, ARS: 10500 },

  // Alitas
  "Alitas Salsa BBQ (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Alitas Acevichadas (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Alitas Buffalo (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Alitas Salsa BBQ Picante (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Alitas Oriental (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Docena de Alitas (12 unidades)": { PEN: 37.00, CLP: 10900, ARS: 16500 },
  "Alitas Charapitas (6 unidades)": { PEN: 20.00, CLP: 5900, ARS: 9000 },

  // Salchipapas
  "Salchipapa Clásica": { PEN: 15.50, CLP: 4500, ARS: 7000 },
  "Salchipapa Salchi Huevo": { PEN: 17.50, CLP: 4900, ARS: 7500 },
  "Polli Papa": { PEN: 19.50, CLP: 5500, ARS: 8500 },
  "Salchi Carne": { PEN: 20.00, CLP: 5900, ARS: 9000 },
  "Salchimixta": { PEN: 22.00, CLP: 6500, ARS: 10000 },
  "La Salchicharapa": { PEN: 21.00, CLP: 6200, ARS: 9500 },

  // Enchiladas
  "Enchilada Mixta": { PEN: 18.00, CLP: 5500, ARS: 8500 },
  "Enchilada de Pollo": { PEN: 17.00, CLP: 5200, ARS: 8000 },
  "Enchilada de Carne": { PEN: 17.00, CLP: 5200, ARS: 8000 },
  "Enchilada de Pollo Deshilachado": { PEN: 18.00, CLP: 5500, ARS: 8500 },
  "Enchilada La Charapa": { PEN: 18.00, CLP: 5500, ARS: 8500 },

  // Especiales
  "Salchi Alitas": { PEN: 25.00, CLP: 7500, ARS: 12000 },
  "Chicharrón de Pollo": { PEN: 21.00, CLP: 6500, ARS: 10000 },
  "Mollejitas a la Parrilla": { PEN: 15.50, CLP: 4900, ARS: 7500 },
  "Especial de Churu": { PEN: 30.00, CLP: 8900, ARS: 14000 },
  "La Churu": { PEN: 25.00, CLP: 7500, ARS: 12000 },

  // Complementos
  "Complemento Hotdog": { PEN: 6.00, CLP: 1500, ARS: 2500 },
  "Complemento Huevo": { PEN: 2.50, CLP: 1000, ARS: 1500 },
  "Complemento Carne": { PEN: 7.00, CLP: 2200, ARS: 3500 },
  "Porción de Papa Huayro": { PEN: 10.00, CLP: 3500, ARS: 5000 },

  // Bebidas
  "Coca Cola": { PEN: 4.50, CLP: 1500, ARS: 2500 },
  "Inka Cola": { PEN: 4.50, CLP: 1500, ARS: 2500 },
  "Fanta": { PEN: 4.50, CLP: 1500, ARS: 2500 }
};

/**
 * Sincroniza todos los productos del catálogo a la moneda elegida
 */
export async function syncCatalogPricesToCurrency(currency: string): Promise<number> {
  const targetCurrency = (currency.toUpperCase() as 'PEN' | 'CLP' | 'ARS') || 'CLP';
  let updatedCount = 0;

  for (const [name, prices] of Object.entries(PRODUCT_PRICES)) {
    const targetPrice = prices[targetCurrency] ?? prices.PEN;
    const res = await prisma.product.updateMany({
      where: { name },
      data: { price: targetPrice }
    });
    updatedCount += res.count;
  }

  return updatedCount;
}
