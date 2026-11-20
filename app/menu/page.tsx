'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Flame, 
  Sparkles, 
  Star, 
  Clock, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  MessageSquare, 
  UtensilsCrossed, 
  X, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ProductModifierDrawer, BaseProduct, CustomizedItem } from '../admin/components/ProductModifierDrawer';

interface MenuItem extends BaseProduct {
  category: string;
  badge?: string;
  prepTime: string;
  rating: number;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'broaster-pecho',
    name: 'Broaster Pecho Clásico',
    description: 'Crujiente presa de pecho marinada con receta secreta, acompañada de abundantes papas fritas artesanales y ensalada fresca.',
    price: 18.50,
    category: 'Broasters Crujientes',
    badge: 'Más Vendido',
    prepTime: '15-20 min',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ0QRDEDelDQCPOmkIoMfHohdc_ohdM5F1SUeo4eBcD6oixjvDL_pDJnFcm3ctb7NxXaE_450rc_2LI1tFfj5o2qJfXW9mLlB_p-iIa6KcGEHLmsXJe4-gH5ftgn6-vvsQiliD5HnrvuRP0cH4_R5zQ0GbLjjr9DA7LV4jcw1SXmf6rlu_BXhrSyLvfPb2WzoL7uctiYaYqaYhWe1SulzNK5aZEi8F5a8VjEZmgnsz',
  },
  {
    id: 'mostrito-especial',
    name: 'Mostrito Churu\'s Especial',
    description: 'La combinación reina: crujiente presa broaster montada sobre una generosa porción de arroz chaufa al wok y papas fritas doradas.',
    price: 22.00,
    category: 'Combos Familiares',
    badge: 'Favorito',
    prepTime: '20-25 min',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqtna8vMw9z0Q9RyrdQpwiEP3Q8FFS9FWcAv_lhKR12BU_f6kgDiOVmY7jNN05P6eGHBjqo_752tcUsJ3P0CwaoFmtK_I4wSi1mYnRWGKSeUNHXpuC0mmtkViDYkA4phnZPdRn80kitHt-IKjDn0DbXfqngJ8g1leXdagvzBDjvZs1kxhzQ5tNlJolk11KsT3e6X7r8nEfQKL04tyyfj5en-gKWCyJL-1SLwX6yFE',
  },
  {
    id: 'alitas-crispy',
    name: 'Alitas Broaster Crispy (6 und)',
    description: '6 alitas extra crujientes doradas al punto exacto con papas fritas y dúo de salsas a elección.',
    price: 16.50,
    category: 'Broasters Crujientes',
    badge: 'Para Picar',
    prepTime: '15 min',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDA9Z5_4b9mAxHzlV4kS5yvR1I96PQ4JbVQyyO0_T8wrT4fvKfeqia4jAQj-eOeEzXblgwBAVL4L0qd0AG49bw_Figi97oMlTVFzQCvrf8bi_-X0LimcYeExN_BiHKrWJdM_ORGt9YFU_44wEJg5UlatUtXtbz05Xpgk2orEzZeXr-9cne1GOOB3vjMUKVIJ61Ov8tW-17N2tx2dJ5vF9qIFy5MxTX-MlTJwPCZB6-4',
  },
  {
    id: 'salchipapa-parrillera',
    name: 'Salchipapa Parrillera Churu\'s',
    description: 'Papas fritas artesanales crujientes cubiertas con rodajas doradas de salchicha frankfurter y chorizo parrillero al jugo.',
    price: 15.00,
    category: 'Salchipapas',
    badge: 'Promoción',
    prepTime: '10-15 min',
    rating: 4.7,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ0QRDEDelDQCPOmkIoMfHohdc_ohdM5F1SUeo4eBcD6oixjvDL_pDJnFcm3ctb7NxXaE_450rc_2LI1tFfj5o2qJfXW9mLlB_p-iIa6KcGEHLmsXJe4-gH5ftgn6-vvsQiliD5HnrvuRP0cH4_R5zQ0GbLjjr9DA7LV4jcw1SXmf6rlu_BXhrSyLvfPb2WzoL7uctiYaYqaYhWe1SulzNK5aZEi8F5a8VjEZmgnsz',
  },
  {
    id: 'combo-duo',
    name: 'Combo Dúo Crujiente',
    description: '2 Presas broaster (pecho + pierna) + porción doble de papas fritas + ensalada fresca + 2 Gaseosas Inca Kola 500ml.',
    price: 34.00,
    category: 'Promociones',
    badge: 'Ahorra S/. 6.00',
    prepTime: '20 min',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwXr2lKubOLbLFACWDELZa0bfK9iCAb3K9l8BElM25VADzSCT7gTFO-eJwZQ7dmRxvjtnokG6RQc19V-JtpCmenV_pySiUchlbD0G6be2lvsMYAhc0YORb-pv8NX4zRzw4wCXOgiBgVEP5HAAXJZOL5XwfGALfLx2QawhcaR9EGWFvGYPoYh8Tqs-31pxv5bv61H5vXS78qsJTrZikLu1Q8UoGgqxtiYkxqv_115z0',
  },
  {
    id: 'tequenos-pollo',
    name: 'Tequeños de Pollo (6 und)',
    description: '6 tequeños crocantes rellenos de jugoso pollo braseado, acompañados de crema de palta guacamole.',
    price: 12.00,
    category: 'Promociones',
    badge: 'Entrada',
    prepTime: '10 min',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwXr2lKubOLbLFACWDELZa0bfK9iCAb3K9l8BElM25VADzSCT7gTFO-eJwZQ7dmRxvjtnokG6RQc19V-JtpCmenV_pySiUchlbD0G6be2lvsMYAhc0YORb-pv8NX4zRzw4wCXOgiBgVEP5HAAXJZOL5XwfGALfLx2QawhcaR9EGWFvGYPoYh8Tqs-31pxv5bv61H5vXS78qsJTrZikLu1Q8UoGgqxtiYkxqv_115z0',
  },
  {
    id: 'incakola-500',
    name: 'Gaseosa Inca Kola 500ml',
    description: 'Botella personal bien helada, el sabor de la comida peruana.',
    price: 4.50,
    category: 'Bebidas',
    prepTime: 'Listo',
    rating: 5.0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKdm77gWGqUV8m4ccp6zS-o__3TDkV19sw4C0pzsYax_mZDKIWuqx-XP7Sf8hlldZV7zwcq9unXwRCjw_dwNfQfug8dXXHSKnSG3d6WBFPGBHGCphmMve7Qnpe3s0K2s46B5KTFJygbsGCWk1MOISNatJOlBiszhEHKj51Ev3q2UW1LOZZeTgJhTeCf8H51ehT9iFV47ovgdUJxD7tUb4OWC8-AUin3YvNw-rDiDyV',
  },
  {
    id: 'chicha-morada-1l',
    name: 'Chicha Morada Artesanal 1L',
    description: 'Elaborada diariamente con maíz morado, piña, manzana, canela, clavo de olor y toque de limón fresco.',
    price: 8.50,
    category: 'Bebidas',
    badge: '100% Casera',
    prepTime: 'Listo',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKdm77gWGqUV8m4ccp6zS-o__3TDkV19sw4C0pzsYax_mZDKIWuqx-XP7Sf8hlldZV7zwcq9unXwRCjw_dwNfQfug8dXXHSKnSG3d6WBFPGBHGCphmMve7Qnpe3s0K2s46B5KTFJygbsGCWk1MOISNatJOlBiszhEHKj51Ev3q2UW1LOZZeTgJhTeCf8H51ehT9iFV47ovgdUJxD7tUb4OWC8-AUin3YvNw-rDiDyV',
  },
];

const CATEGORIES = ['Todos', 'Broasters Crujientes', 'Combos Familiares', 'Salchipapas', 'Promociones', 'Bebidas'];

export default function PublicMenuPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customizer Drawer State
  const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Cart State (Array of customized items)
  const [cartItems, setCartItems] = useState<CustomizedItem[]>([
    {
      productId: 'broaster-pecho',
      productName: 'Broaster Pecho Clásico',
      quantity: 1,
      unitBasePrice: 18.50,
      totalPrice: 28.00,
      baseSauces: ['Tártara casera', 'Ají pollero', 'Mayonesa'],
      premiumSauces: [],
      isSalchibroaster: true,
      extras: [{ name: 'Gaseosa Inca Kola 500ml', quantity: 1, unitPrice: 4.50 }],
      kitchenNotes: 'Papas bien doradas',
    }
  ]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart summary calculations
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Add customized item to cart
  const handleAddToCart = (customized: CustomizedItem) => {
    setCartItems(prev => [...prev, customized]);
  };

  // Remove item from cart
  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Build WhatsApp pre-filled message
  const handleOrderViaWhatsApp = () => {
    let text = `*¡Hola Churu's! Quiero realizar un pedido:* 🍗🔥\n\n`;
    cartItems.forEach((item, idx) => {
      text += `*${item.quantity}x ${item.productName}* - S/. ${item.totalPrice.toFixed(2)}\n`;
      if (item.isSalchibroaster) text += `  🌭 Con Salchibroaster (+S/. 5.00)\n`;
      if (item.baseSauces.length > 0) text += `  🥣 Cremas: ${item.baseSauces.join(', ')}\n`;
      if (item.premiumSauces.length > 0) text += `  ✨ Gourmet: ${item.premiumSauces.join(', ')}\n`;
      if (item.extras.length > 0) {
        text += `  ➕ Extras: ${item.extras.map(e => `${e.name} (${e.quantity}x)`).join(', ')}\n`;
      }
      if (item.kitchenNotes) text += `  📝 Nota: "${item.kitchenNotes}"\n`;
      text += `\n`;
    });
    text += `*TOTAL ESTIMADO: S/. ${cartSubtotal.toFixed(2)}*\n\n`;
    text += `¿Me confirman disponibilidad y tiempo de entrega? ¡Gracias!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/51922931433?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#141312] text-slate-900 dark:text-[#e6e1df] font-sans selection:bg-orange-500 selection:text-white pb-36 transition-colors duration-200">
      
      {/* 1. Header Comercial */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-orange-600/30">
                C
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Churu&apos;s Comida Rápida
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-[#84cc16]/15 dark:bg-[#94de2d]/15 text-[#84cc16] dark:text-[#94de2d] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-pulse" />
                    Abierto
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-500" /> 30-45 min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-500" /> 4.9 (500+ reseñas)
                  </span>
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="relative p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              title="Ver Carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs animate-in zoom-in">
                  {totalItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar broasters, combos, salchipapas, bebidas..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-100 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal Category Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 scroll-smooth">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-slate-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* 2. Products Grid */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* Category Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{selectedCategory}</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-stone-400 font-semibold">
            {filteredItems.length} {filteredItems.length === 1 ? 'plato' : 'platos'}
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image and Badges */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-3">
                  <img 
                    src={item.imageUrl || ''} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  
                  {item.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-bold">
                    <span className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px]">
                      <Clock className="w-3 h-3 text-amber-400" /> {item.prepTime}
                    </span>
                    <span className="flex items-center gap-1 bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-md text-[11px]">
                      <Star className="w-3 h-3 fill-stone-950" /> {item.rating}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-stone-300 line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Precio base</span>
                  <span className="text-base sm:text-lg font-black text-[#84cc16] dark:text-[#94de2d]">
                    S/. {item.price.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(item);
                    setIsDrawerOpen(true);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Personalizar</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>

      {/* 3. Sticky Floating Cart Bar */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={() => setIsCartModalOpen(true)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-[#84cc16] text-white font-black text-xs sm:text-sm flex items-center justify-between px-5 shadow-xl shadow-orange-600/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-black">Ver mi Pedido ({totalItemCount} {totalItemCount === 1 ? 'plato' : 'platos'})</span>
                <span className="text-[10px] text-amber-200 font-semibold">Toca para revisar y confirmar</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="bg-black/25 px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm">
                S/. {cartSubtotal.toFixed(2)}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* 4. Product Modifier Bottom-Sheet (Punto B) */}
      <ProductModifierDrawer 
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* 5. Cart Drawer Modal (Acción Rápida Dual) */}
      {isCartModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsCartModalOpen(false)}
        >
          <div 
            className="w-full sm:max-w-lg bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Mi Pedido Churu&apos;s
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400">
                    {totalItemCount} {totalItemCount === 1 ? 'plato seleccionado' : 'platos seleccionados'}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsCartModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {cartItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.quantity}x {item.productName}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#84cc16] dark:text-[#94de2d] mt-0.5 block">
                        S/. {item.totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modifiers tags */}
                  <div className="text-[11px] text-slate-600 dark:text-stone-300 space-y-0.5 pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
                    {item.isSalchibroaster && (
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                        <span>🌭 Con Salchibroaster (+S/. 5.00)</span>
                      </div>
                    )}
                    {item.baseSauces.length > 0 && (
                      <div>🥣 Cremas: <span className="font-semibold text-slate-800 dark:text-stone-200">{item.baseSauces.join(', ')}</span></div>
                    )}
                    {item.premiumSauces.length > 0 && (
                      <div>✨ Gourmet: <span className="font-semibold text-slate-800 dark:text-stone-200">{item.premiumSauces.join(', ')}</span></div>
                    )}
                    {item.extras.length > 0 && (
                      <div>➕ Extras: <span className="font-semibold text-slate-800 dark:text-stone-200">{item.extras.map(e => `${e.name} (${e.quantity}x)`).join(', ')}</span></div>
                    )}
                    {item.kitchenNotes && (
                      <div>📝 Nota: &quot;<span className="italic">{item.kitchenNotes}</span>&quot;</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dual Action Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-1">
                <span className="text-slate-600 dark:text-stone-400">Total acumulado:</span>
                <span className="text-base sm:text-lg text-slate-900 dark:text-white">
                  S/. {cartSubtotal.toFixed(2)}
                </span>
              </div>

              {/* Action 1: Direct to /checkout */}
              <button
                type="button"
                onClick={() => {
                  setIsCartModalOpen(false);
                  router.push('/checkout');
                }}
                className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 active:scale-98 transition-all"
              >
                <span>Continuar a Pagar (Checkout)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Action 2: Direct WhatsApp Order */}
              <button
                type="button"
                onClick={handleOrderViaWhatsApp}
                className="w-full h-12 rounded-xl bg-[#84cc16] hover:bg-[#72b513] dark:bg-[#94de2d] dark:hover:bg-[#83c923] text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-stone-950" />
                <span>Pedir directo por WhatsApp 💬</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
