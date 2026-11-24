'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Flame, 
  Check, 
  Sparkles, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export interface BaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string | { id?: string; name?: string } | null;
  categoryName?: string;
}

interface ProductModifierDrawerProps {
  product: BaseProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (customizedItem: CustomizedItem) => void;
  currencySymbol?: string;
  currency?: string;
}

export interface CustomizedItem {
  productId: string;
  productName: string;
  quantity: number;
  unitBasePrice: number;
  totalPrice: number;
  baseSauces: string[];
  premiumSauces: string[];
  isSalchibroaster: boolean;
  extras: { name: string; quantity: number; unitPrice: number }[];
  kitchenNotes: string;
}

const BASE_SAUCES = [
  { id: 'tartara', name: 'Tártara casera', desc: 'Receta Churu\'s', emoji: '🥣' },
  { id: 'aji', name: 'Ají pollero', desc: 'Picantito sabroso', emoji: '🌶️' },
  { id: 'mayo', name: 'Mayonesa', desc: 'Cremosa clásica', emoji: '🥚' },
  { id: 'ketchup', name: 'Kétchup', desc: 'Tomate dulce', emoji: '🍅' },
  { id: 'aceituna', name: 'Aceituna botija', desc: 'Toque morado', emoji: '🫒' },
  { id: 'golf', name: 'Salsa Golf', desc: 'Mayo + kétchup', emoji: '✨' },
];

const PREMIUM_SAUCES = [
  { id: 'acevichada', name: 'Salsa Acevichada', desc: 'Toque nikkei cítrico', emoji: '🐟' },
  { id: 'bbq', name: 'BBQ Artesanal', desc: 'Ahumada a la leña', emoji: '🔥' },
];

const EXTRAS_LIST = [
  { id: 'papas', name: 'Porción de papas extra', emoji: '🍟' },
  { id: 'incakola', name: 'Gaseosa Inca Kola 500ml', emoji: '🥤' },
  { id: 'queso', name: 'Extra Queso derretido', emoji: '🧀' },
  { id: 'huevo', name: 'Huevo frito a la inglesa', emoji: '🍳' },
];

export function ProductModifierDrawer({
  product,
  isOpen,
  onClose,
  onAddToCart,
  currencySymbol = '$',
  currency = 'PEN',
}: ProductModifierDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedBaseSauces, setSelectedBaseSauces] = useState<string[]>(['tartara', 'aji']);
  const [selectedPremiumSauces, setSelectedPremiumSauces] = useState<string[]>([]);
  const [isSalchibroaster, setIsSalchibroaster] = useState(false);
  const [extrasQuantities, setExtrasQuantities] = useState<Record<string, number>>({});
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [animateLimit, setAnimateLimit] = useState(false);

  // Determinar categoría y tipo de producto
  const categoryStr = typeof product?.category === 'string' 
    ? product.category 
    : (product?.category?.name || product?.categoryName || '');
  const catLower = categoryStr.toLowerCase();
  const nameLower = (product?.name || '').toLowerCase();

  const isDrink = catLower.includes('bebida') || catLower.includes('trago') || catLower.includes('gaseosa') || catLower.includes('jugo') || catLower.includes('refresco') || nameLower.includes('coca cola') || nameLower.includes('inka cola') || nameLower.includes('fanta');
  const isComplemento = catLower.includes('complemento') || catLower.includes('extra') || catLower.includes('postre') || nameLower.includes('complemento');
  const isNonCustomizable = isDrink || isComplemento;

  // Solo pollo broaster tiene la opción de Salchibroaster
  const isBroasterProduct = !isNonCustomizable && (catLower.includes('broaster') || nameLower.includes('broaster'));
  // Salsas solo para comida caliente
  const allowsSauces = !isNonCustomizable;
  // Acompañamientos extras solo para platos principales
  const allowsExtras = !isNonCustomizable;

  // Reset states when opening a new product
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setKitchenNotes('');
      setExtrasQuantities({});
      setIsSalchibroaster(false);
      setSelectedPremiumSauces([]);
      setSelectedBaseSauces(allowsSauces ? ['tartara', 'aji'] : []);
    }
  }, [product?.id, allowsSauces]);

  const curr = (currency || 'PEN').toUpperCase();
  const isCLP = curr === 'CLP' || currencySymbol === '$';
  const isARS = curr === 'ARS';

  const formatPrice = (val: number) => {
    const sym = currencySymbol || (curr === 'PEN' ? 'S/.' : '$');
    if (isCLP || isARS || curr === 'COP') {
      return `${sym} ${Math.round(val).toLocaleString('es-CL')}`;
    }
    return `${sym} ${val.toFixed(2)}`;
  };

  // Precios dinámicos por divisa para extras
  const getGourmetPrice = () => (isCLP ? 600 : (isARS ? 1000 : 2.00));
  const getSalchibroasterPrice = () => (isCLP ? 1800 : (isARS ? 2800 : 5.00));
  const getExtraPrice = (id: string) => {
    if (id === 'papas') return isCLP ? 1800 : (isARS ? 2800 : 6.00);
    if (id === 'incakola') return isCLP ? 1500 : (isARS ? 2500 : 4.50);
    if (id === 'queso') return isCLP ? 1000 : (isARS ? 1500 : 3.00);
    if (id === 'huevo') return isCLP ? 800 : (isARS ? 1200 : 2.50);
    return 0;
  };

  if (!isOpen || !product) return null;

  // Salsas base selection toggle (max 3)
  const toggleBaseSauce = (id: string) => {
    if (selectedBaseSauces.includes(id)) {
      setSelectedBaseSauces(prev => prev.filter(s => s !== id));
    } else {
      if (selectedBaseSauces.length < 3) {
        setSelectedBaseSauces(prev => [...prev, id]);
      } else {
        setAnimateLimit(true);
        setTimeout(() => setAnimateLimit(false), 600);
      }
    }
  };

  const togglePremiumSauce = (id: string) => {
    setSelectedPremiumSauces(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExtraDelta = (id: string, delta: number) => {
    setExtrasQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const basePrice = product.price || 0;
  const salchibroasterPrice = (isSalchibroaster && isBroasterProduct) ? getSalchibroasterPrice() : 0;
  const premiumSaucesTotal = allowsSauces ? selectedPremiumSauces.length * getGourmetPrice() : 0;
  const extrasTotal = allowsExtras ? Object.entries(extrasQuantities).reduce((acc, [id, qty]) => {
    return acc + (getExtraPrice(id) * qty);
  }, 0) : 0;

  const unitTotal = basePrice + salchibroasterPrice + premiumSaucesTotal + extrasTotal;
  const grandTotal = unitTotal * quantity;

  const handleConfirm = () => {
    const finalNotes = kitchenNotes.trim();

    const customized: CustomizedItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitBasePrice: basePrice,
      totalPrice: grandTotal,
      baseSauces: allowsSauces ? selectedBaseSauces.map(id => BASE_SAUCES.find(s => s.id === id)?.name || id) : [],
      premiumSauces: allowsSauces ? selectedPremiumSauces.map(id => PREMIUM_SAUCES.find(s => s.id === id)?.name || id) : [],
      isSalchibroaster: isBroasterProduct ? isSalchibroaster : false,
      extras: allowsExtras ? Object.entries(extrasQuantities).map(([id, qty]) => {
        const item = EXTRAS_LIST.find(e => e.id === id);
        return {
          name: item?.name || id,
          quantity: qty,
          unitPrice: getExtraPrice(id)
        };
      }) : [],
      kitchenNotes: finalNotes
    };

    if (onAddToCart) {
      onAddToCart(customized);
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-orange-500/20 dark:border-stone-800 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Pill Handle & Header */}
        <div className="pt-3 pb-2 px-5 flex flex-col items-center relative shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-2 cursor-grab" />
          
          <div className="w-full flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              {categoryStr || 'Churu\'s'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-6 pt-1 scrollbar-none">
          
          {/* 1. Hero Product Card */}
          <div className="space-y-3">
            <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-stone-800 shadow-md group">
              <img 
                src={product.imageUrl || "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80"} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                    {categoryStr || 'Especialidad'}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-stone-200 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-300" />
                    {isDrink ? 'Instantáneo' : '15-20 min'}
                  </span>
                </div>
                <div className="bg-black/60 backdrop-blur-md text-amber-300 font-bold text-xs px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Original
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white leading-tight">
                  {product.name}
                </h2>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-[#84cc16] dark:text-[#94de2d]">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="block text-[10px] text-stone-400 font-semibold">Precio base</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                {product.description || 'Preparado fresco al momento con la receta y calidad de Churu\'s.'}
              </p>
            </div>
          </div>

          {/* 2. Feature Card: CONVIÉRTELO EN SALCHIBROASTER (Exclusivo categoría Broaster) */}
          {isBroasterProduct && (
            <>
              <div className="h-px bg-stone-200 dark:bg-stone-800/80 w-full" />
              <div 
                onClick={() => setIsSalchibroaster(!isSalchibroaster)}
                className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-2 transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isSalchibroaster 
                    ? 'border-orange-500 bg-orange-500/15 shadow-md' 
                    : 'border-orange-500/30 dark:border-orange-500/40 hover:border-orange-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-600/30">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm sm:text-base text-stone-900 dark:text-white leading-snug">
                          ¿Conviértelo en Salchibroaster?
                        </span>
                        <span className="inline-flex items-center text-[9px] font-black uppercase bg-red-500 text-white px-1.5 py-0.5 rounded-md tracking-wider">
                          PROMO
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                        Añade abundantes rodajas de salchicha parrillera doradita sobre tus papas.
                      </p>
                      <span className="inline-block mt-1 font-black text-xs text-orange-600 dark:text-orange-400">
                        + {formatPrice(getSalchibroasterPrice())}
                      </span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <div className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                    isSalchibroaster ? 'bg-orange-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      isSalchibroaster ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 3. Salsas y Cremas Base (Solo para comida caliente) */}
          {allowsSauces && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">Salsas y Cremas</h3>
                    <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Incluidas
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Elige hasta 3 cremas tradicionales incluidas</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all ${
                  animateLimit ? 'scale-110 ring-2 ring-orange-500' : ''
                } ${
                  selectedBaseSauces.length === 3 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                    : 'bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400'
                }`}>
                  {selectedBaseSauces.length}/3 seleccionadas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {BASE_SAUCES.map((sauce) => {
                  const isSelected = selectedBaseSauces.includes(sauce.id);
                  return (
                    <button
                      key={sauce.id}
                      type="button"
                      onClick={() => toggleBaseSauce(sauce.id)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left min-h-[54px] active:scale-[0.98] ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-stone-100/70 dark:hover:bg-stone-800/80'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500 text-white' 
                          : 'border-stone-400 dark:border-stone-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-xs truncate ${
                          isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-stone-800 dark:text-stone-200'
                        }`}>
                          {sauce.name}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">{sauce.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Salsas Especiales Gourmet (Opcionales para comida caliente) */}
          {allowsSauces && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">Salsas Especiales Gourmet</h3>
                <span className="text-xs text-stone-400 font-medium">Opcional</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {PREMIUM_SAUCES.map((sauce) => {
                  const isSelected = selectedPremiumSauces.includes(sauce.id);
                  return (
                    <button
                      key={sauce.id}
                      type="button"
                      onClick={() => togglePremiumSauce(sauce.id)}
                      className={`relative flex items-center justify-between p-3 rounded-xl border transition-all text-left min-h-[54px] active:scale-[0.98] ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs' 
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-500 text-white' 
                            : 'border-stone-400 dark:border-stone-600'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`block font-bold text-xs truncate ${
                            isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-stone-800 dark:text-stone-200'
                          }`}>
                            {sauce.name}
                          </span>
                          <span className="text-[11px] font-black text-orange-600 dark:text-orange-400">
                            + {formatPrice(getGourmetPrice())}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Acompañamientos y Extras (Steppers, solo para platos principales) */}
          {allowsExtras && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">Acompañamientos Extras</h3>
                <span className="text-xs text-stone-400 font-medium">Agrega a tu gusto</span>
              </div>

              <div className="space-y-2">
                {EXTRAS_LIST.map((extra) => {
                  const qty = extrasQuantities[extra.id] || 0;
                  const itemPrice = getExtraPrice(extra.id);
                  return (
                    <div 
                      key={extra.id} 
                      className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 min-h-[54px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                          {extra.emoji}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                            {extra.name}
                          </h4>
                          <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            + {formatPrice(itemPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-2 bg-stone-200/80 dark:bg-stone-700/80 rounded-xl p-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => handleExtraDelta(extra.id, -1)} 
                          disabled={qty <= 0}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 disabled:opacity-40 flex items-center justify-center text-stone-700 dark:text-stone-200 transition-colors shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="w-6 text-center font-black text-sm text-stone-900 dark:text-stone-100">
                          {qty}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleExtraDelta(extra.id, 1)} 
                          className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 flex items-center justify-center text-stone-700 dark:text-stone-200 transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Indicaciones Especiales de Cocina */}
          <div className="space-y-2">
            <label htmlFor="kitchen-notes" className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              {isDrink ? 'Instrucciones para la Bebida' : 'Indicaciones Especiales para Cocina'}
            </label>
            <textarea 
              id="kitchen-notes" 
              rows={2} 
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              placeholder={isDrink ? "Ej: Enviar con vaso descartable y hielo..." : "Ej: Papas bien crocantes, sin ensalada, ají aparte..."}
              className="w-full rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

        </div>

        {/* 7. STICKY BOTTOM ACTION BAR */}
        <div className="p-3.5 sm:p-4 pb-6 sm:pb-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex items-center gap-3 shrink-0 shadow-2xl relative z-20">
          
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-800 rounded-2xl p-1.5 border border-stone-200 dark:border-stone-700 h-[52px]">
            <button 
              type="button" 
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-40 flex items-center justify-center text-stone-800 dark:text-stone-100 font-bold transition-transform active:scale-90 shadow-2xs"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-8 text-center font-black text-base text-stone-900 dark:text-white">
              {quantity}
            </span>
            <button 
              type="button" 
              onClick={() => setQuantity(prev => prev + 1)}
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 flex items-center justify-center text-stone-800 dark:text-stone-100 font-bold transition-transform active:scale-90 shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Primary Action Button */}
          <button 
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-[52px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-between px-5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs sm:text-sm font-black">
              <ShoppingBag className="w-4 h-4" />
              Agregar al Pedido
            </span>
            <span className="font-black text-xs sm:text-sm bg-black/25 px-2.5 py-1 rounded-xl">
              {formatPrice(grandTotal)}
            </span>
          </button>
        </div>

        {/* Toast Feedback */}
        {showToast && (
          <div className="absolute top-4 inset-x-5 z-50 bg-stone-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-orange-500/50 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="font-black text-xs">¡Agregado al pedido!</p>
                <p className="text-[10px] text-stone-300">{product.name} listo</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#84cc16] dark:text-[#94de2d]">
              {formatPrice(grandTotal)}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
