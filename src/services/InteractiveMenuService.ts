import { prisma } from '@/lib/prisma';
import {
  sendWhatsAppList,
  sendWhatsAppButtons,
  WhatsAppListSection
} from '@/lib/whatsapp';
import { whatsappLogger } from '@/lib/logger';

export class InteractiveMenuService {
  /**
   * Envía la lista interactiva de categorías principales de Churu's Fast Food
   */
  static async sendCategoriesMenu(phoneNumber: string, greetingName?: string) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          products: {
            where: { isActive: true },
            select: { id: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      const profile = await prisma.businessProfile.findUnique({
        where: { id: 'default' }
      });

      const businessName = profile?.name || "Churu's Fast Food";
      const currency = profile?.currencySymbol || 'S/.';

      const rows = categories
        .filter(c => c.products.length > 0)
        .slice(0, 10)
        .map(c => ({
          id: `cat_${c.id}`,
          title: c.name.slice(0, 24),
          description: (c.description || `${c.products.length} platos disponibles`).slice(0, 72)
        }));

      const sections: WhatsAppListSection[] = [
        {
          title: 'Categorías de la Carta',
          rows
        }
      ];

      const welcomeText = greetingName
        ? `¡Hola ${greetingName}! 👋 Te damos la bienvenida a *${businessName}* 🍔🍟`
        : `¡Bienvenido a *${businessName}*! 🍔🍟`;

      const bodyText = `${welcomeText}\n\nSelecciona una categoría de nuestra carta para ver los platos disponibles y sus precios en ${currency}.`;

      return await sendWhatsAppList(
        phoneNumber,
        bodyText,
        'Ver Carta / Menú',
        sections,
        businessName,
        'Toca una categoría para explorar'
      );
    } catch (error) {
      whatsappLogger.error('Error enviando categorías interactivas:', error);
      throw error;
    }
  }

  /**
   * Envía la lista de platos de una categoría específica
   */
  static async sendProductsByCategory(phoneNumber: string, categoryId: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
          }
        }
      });

      if (!category || category.products.length === 0) {
        return false;
      }

      const profile = await prisma.businessProfile.findUnique({
        where: { id: 'default' }
      });
      const currency = profile?.currencySymbol || 'S/.';

      const rows = category.products.slice(0, 10).map(p => ({
        id: `prod_${p.id}`,
        title: p.name.slice(0, 24),
        description: `${currency} ${p.price.toFixed(2)} - Toca para ver detalle`
      }));

      const sections: WhatsAppListSection[] = [
        {
          title: category.name.slice(0, 24),
          rows
        }
      ];

      const bodyText = `Platos en *${category.name}*:\nElige un plato para ver su descripción completa o pedirlo directamente:`;

      await sendWhatsAppList(
        phoneNumber,
        bodyText,
        'Ver Platos',
        sections,
        category.name,
        'Churu\'s Comida Rápida'
      );
      return true;
    } catch (error) {
      whatsappLogger.error('Error enviando productos de categoría:', error);
      throw error;
    }
  }

  /**
   * Muestra la ficha detallada de un producto con botones de acción directa
   */
  static async sendProductDetail(phoneNumber: string, productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      });

      if (!product) return false;

      const profile = await prisma.businessProfile.findUnique({
        where: { id: 'default' }
      });
      const currency = profile?.currencySymbol || 'S/.';

      const detailText = `🍽️ *${product.name}*\n` +
        `📂 Categoría: ${product.category?.name || 'General'}\n` +
        `💰 Precio: *${currency} ${product.price.toFixed(2)}*\n\n` +
        `📝 *Descripción:*\n${product.description || 'Preparado fresco al momento con ingredientes de calidad.'}\n\n` +
        `¿Deseas pedir este plato ahora o ver otras opciones?`;

      // Botones de respuesta rápida
      await sendWhatsAppButtons(
        phoneNumber,
        detailText,
        [
          { id: `order_${product.id}`, title: 'Pedir este plato 🛍️' },
          { id: 'menu_principal', title: 'Ver Carta Completa 📋' }
        ],
        'Churu\'s Fast Food'
      );
      return true;
    } catch (error) {
      whatsappLogger.error('Error enviando detalle de producto:', error);
      throw error;
    }
  }
}
