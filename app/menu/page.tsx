'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Flame, 
  Star, 
  Clock, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ChevronRight, 
  MessageSquare, 
  X, 
  ArrowRight,
  Loader2,
  Store,
  AlertCircle,
  Lock
} from 'lucide-react';
import { ProductModifierDrawer, BaseProduct, CustomizedItem } from '../admin/components/ProductModifierDrawer';

interface BusinessInfo {
  name: string;
  industry: string;
  currency: string;
  currencySymbol: string;
  phone: string;
  address: string;
  description: string;
  policies: string;
  isOpen?: boolean;
  todayHours?: string;
  statusMode?: string;
  statusMessage?: string;
}

interface MenuItem extends BaseProduct {
  category: string;
  badge?: string;
  prepTime?: string;
  rating?: number;
  stock: number;
}

export default function PublicMenuPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo>({
    name: "Churu's Comida Rápida",
    industry: 'fast_food',
    currency: 'PEN',
    currencySymbol: 'S/.',
    phone: '+51 987 654 321',
    address: 'Av. Los Próceres 458',
    description: '',
    policies: '',
  });

  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Customizer Drawer State
  const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cart State (Array of customized items, starts empty)
  const [cartItems, setCartItems] = useState<CustomizedItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Fetch real menu and business profile from database
  useEffect(() => {
    async function fetchMenuData() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/menu', { cache: 'no-store' });
        const data = await res.json();

        if (data.success) {
          if (data.business) {
            setBusiness(data.business);
          }
          if (Array.isArray(data.categories)) {
            setCategories(['Todos', ...data.categories]);
          }
          if (Array.isArray(data.products)) {
            const mappedProducts: MenuItem[] = data.products.map((p: any, idx: number) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              price: Number(p.price) || 0,
              imageUrl: p.imageUrl || null,
              category: p.category || 'Varios',
              stock: p.stock ?? 10,
              prepTime: '15-20 min',
              rating: Number((4.7 + (idx % 4) * 0.1).toFixed(1)),
              badge: idx === 0 ? 'Más Vendido' : idx === 1 ? 'Favorito' : undefined,
            }));
            setProducts(mappedProducts);
          }
        } else {
          setFetchError('No se pudo cargar la carta digital');
        }
      } catch (err) {
        console.error('Error fetching menu:', err);
        setFetchError('Error de conexión con el catálogo');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenuData();
  }, []);

  // Load saved cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pithy_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pithy_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

  // Format price dynamically according to active country/currency
  const formatPrice = (val: number) => {
    const sym = business.currencySymbol || (business.currency === 'PEN' ? 'S/.' : '$');
    const curr = (business.currency || 'PEN').toUpperCase();
    if (curr === 'PEN') {
      return `${sym} ${val.toFixed(2)}`;
    }
    return `${sym} ${Math.round(val).toLocaleString('es-CL')}`;
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return products.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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

  // Build WhatsApp pre-filled message with real business phone
  const handleOrderViaWhatsApp = () => {
    let text = `*¡Hola ${business.name}! Quiero realizar un pedido:* 🛍️✨\n\n`;
    cartItems.forEach((item) => {
      text += `*${item.quantity}x ${item.productName}* - ${formatPrice(item.totalPrice)}\n`;
      if (item.isSalchibroaster) text += `  🌭 Con Salchibroaster (+${formatPrice(5)})\n`;
      if (item.baseSauces.length > 0) text += `  🥣 Cremas: ${item.baseSauces.join(', ')}\n`;
      if (item.premiumSauces.length > 0) text += `  ✨ Gourmet: ${item.premiumSauces.join(', ')}\n`;
      if (item.extras.length > 0) {
        text += `  ➕ Extras: ${item.extras.map(e => `${e.name} (${e.quantity}x)`).join(', ')}\n`;
      }
      if (item.kitchenNotes) text += `  📝 Nota: "${item.kitchenNotes}"\n`;
      text += `\n`;
    });
    text += `*TOTAL ESTIMADO: ${formatPrice(cartSubtotal)}*\n\n`;
    text += `¿Me confirman disponibilidad y tiempo de entrega? ¡Muchas gracias!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = (business.phone || '56912345678').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
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
                {business.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {business.name}
                  </h1>
                  {business.isOpen !== false ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-[#94de2d] px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#94de2d] animate-pulse" />
                      Abierto {business.todayHours ? `• ${business.todayHours}` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Cerrado Ahora {business.todayHours ? `• ${business.todayHours}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-500" /> 30-45 min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-500" /> 4.9 (500+ reseñas)
                  </span>
                  <span>•</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {business.currency} ({business.currencySymbol})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="p-2 sm:p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white transition-colors"
                title="Acceso Administración / Negocio"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <Link
                href="/checkout"
                className="relative p-2 sm:p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                title="Ver Carrito"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs animate-in zoom-in">
                    {totalItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar platos, ingredientes, bebidas..."
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
            {categories.map((cat) => (
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

        {/* Closed Business Notice Banner */}
        {business.isOpen === false && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-2xs animate-in fade-in duration-200">
            <Clock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs sm:text-sm font-black block">
                Local Actualmente Cerrado • Horario de Atención: {business.todayHours || 'Revisa nuestros horarios'}
              </span>
              <span className="text-[11px] text-rose-700/80 dark:text-rose-300/80 block mt-0.5 leading-relaxed">
                ¡Puedes navegar por la carta y armar tu carrito libremente! Las comandas y despachos se procesarán en cuanto abra la cocina.
              </span>
            </div>
          </div>
        )}
        
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

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm font-semibold">Cargando carta actualizada...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && fetchError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{fetchError}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && filteredItems.length === 0 && (
          <div className="py-16 text-center text-stone-400">
            <Store className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold">No se encontraron platos en esta categoría.</p>
            <p className="text-xs mt-1">Prueba con otra búsqueda o categoría.</p>
          </div>
        )}

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
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800/40 text-stone-500">
                      <Store className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-xs font-semibold">{business.name}</span>
                    </div>
                  )}
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
                  {item.description || 'Preparado fresco al momento con ingredientes seleccionados de primera calidad.'}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Precio base</span>
                  <span className="text-base sm:text-lg font-black text-[#84cc16] dark:text-[#94de2d]">
                    {formatPrice(item.price)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(item);
                    setIsDrawerOpen(true);
                  }}
                  className="group/btn relative overflow-hidden py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-orange-600/25 hover:shadow-orange-600/40 active:scale-90 hover:scale-105 active:ring-2 active:ring-orange-400 active:ring-offset-2 dark:active:ring-offset-[#141312] transition-all duration-200 cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4 stroke-[3] transition-transform duration-200 group-hover/btn:rotate-90" />
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
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-[#84cc16] text-white font-black text-xs sm:text-sm flex items-center justify-between px-5 shadow-xl shadow-orange-600/35 hover:shadow-orange-600/50 hover:scale-[1.01] active:scale-[0.97] transition-all duration-200 cursor-pointer"
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
                {formatPrice(cartSubtotal)}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* 4. Product Modifier Bottom-Sheet */}
      <ProductModifierDrawer 
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
        currencySymbol={business.currencySymbol}
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
                    Mi Pedido • {business.name}
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
                        {formatPrice(item.totalPrice)}
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
                        <span>🌭 Con Salchibroaster (+{formatPrice(5)})</span>
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
                  {formatPrice(cartSubtotal)}
                </span>
              </div>

              {/* Action 1: Direct to /checkout */}
              <button
                type="button"
                onClick={() => {
                  setIsCartModalOpen(false);
                  router.push('/checkout');
                }}
                className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 active:scale-98 transition-all cursor-pointer"
              >
                <span>Continuar a Pagar (Checkout)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Action 2: Direct WhatsApp Order */}
              <button
                type="button"
                onClick={handleOrderViaWhatsApp}
                className="w-full h-12 rounded-xl bg-[#84cc16] hover:bg-[#72b513] dark:bg-[#94de2d] dark:hover:bg-[#83c923] text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
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
