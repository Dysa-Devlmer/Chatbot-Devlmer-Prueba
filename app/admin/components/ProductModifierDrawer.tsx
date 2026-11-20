'use client';

import { useState, useId } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Flame, 
  Check, 
  Sparkles, 
  UtensilsCrossed, 
  HeartHandshake,
  CheckCircle2,
  ChefHat
} from 'lucide-react';

export interface BaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
}

interface ProductModifierDrawerProps {
  product: BaseProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (customizedItem: CustomizedItem) => void;
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
  { id: 'tartara', name: 'Tártara Casera', emoji: '🥣', desc: 'Receta tradicional con cebollita china' },
  { id: 'aji', name: 'Ají Pollero Criollo', emoji: '🌶️', desc: 'Picantito con huacatay y rocoto' },
  { id: 'mayo', name: 'Mayonesa Clásica', emoji: '🥚', desc: 'Cremosa y suave' },
  { id: 'ketchup', name: 'Kétchup de Tomate', emoji: '🍅', desc: 'Toque dulce y fresco' },
  { id: 'aceituna', name: 'Crema de Aceituna', emoji: '🫒', desc: 'Elaborada con aceituna botija' },
  { id: 'golf', name: 'Salsa Golf', emoji: '✨', desc: 'Mezcla cremosa rosada' },
];

const PREMIUM_SAUCES = [
  { id: 'acevichada', name: 'Salsa Acevichada', price: 2.00, emoji: '🐟', desc: 'Toque nikkei cítrico y ahumado' },
  { id: 'bbq', name: 'BBQ Ahumada Artesanal', price: 2.00, emoji: '🔥', desc: 'Salsa dulce caramelizada con leña' },
  { id: 'maracuya', name: 'Maracuyá Picante', price: 2.00, emoji: '🍯', desc: 'Agridulce con ají limo' },
];

const EXTRAS_LIST = [
  { id: 'papas_extra', name: 'Porción Extra de Papas Fritas', price: 6.00, emoji: '🍟' },
  { id: 'incakola', name: 'Gaseosa Inca Kola 500ml', price: 4.50, emoji: '🥤' },
  { id: 'cocacola', name: 'Gaseosa Coca-Cola 500ml', price: 4.50, emoji: '🥤' },
  { id: 'queso_fundido', name: 'Extra Queso Fundido Caliente', price: 3.00, emoji: '🧀' },
  { id: 'huevo_frito', name: 'Huevo Frito a la Inglesa', price: 2.50, emoji: '🍳' },
];

export function ProductModifierDrawer({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductModifierDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedBaseSauces, setSelectedBaseSauces] = useState<string[]>(['tartara', 'aji']);
  const [selectedPremiumSauces, setSelectedPremiumSauces] = useState<string[]>([]);
  const [isSalchibroaster, setIsSalchibroaster] = useState(false);
  const [extrasQuantities, setExtrasQuantities] = useState<Record<string, number>>({});
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen || !product) return null;

  // Salsas base selection toggle (max 3)
  const toggleBaseSauce = (id: string) => {
    if (selectedBaseSauces.includes(id)) {
      setSelectedBaseSauces(prev => prev.filter(s => s !== id));
    } else {
      if (selectedBaseSauces.length < 3) {
        setSelectedBaseSauces(prev => [...prev, id]);
      }
    }
  };

  // Salsas premium toggle
  const togglePremiumSauce = (id: string) => {
    setSelectedPremiumSauces(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Extras stepper
  const handleExtraDelta = (id: string, delta: number) => {
    setExtrasQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  // Price calculations
  const basePrice = product.price;
  const salchibroasterPrice = isSalchibroaster ? 5.00 : 0;
  const premiumSaucesTotal = selectedPremiumSauces.length * 2.00;
  const extrasTotal = Object.entries(extrasQuantities).reduce((acc, [id, qty]) => {
    const item = EXTRAS_LIST.find(e => e.id === id);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const unitTotal = basePrice + salchibroasterPrice + premiumSaucesTotal + extrasTotal;
  const grandTotal = unitTotal * quantity;

  const handleConfirm = () => {
    const customized: CustomizedItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitBasePrice: basePrice,
      totalPrice: grandTotal,
      baseSauces: selectedBaseSauces.map(id => BASE_SAUCES.find(s => s.id === id)?.name || id),
      premiumSauces: selectedPremiumSauces.map(id => PREMIUM_SAUCES.find(s => s.id === id)?.name || id),
      isSalchibroaster,
      extras: Object.entries(extrasQuantities).map(([id, qty]) => {
        const item = EXTRAS_LIST.find(e => e.id === id);
        return {
          name: item?.name || id,
          quantity: qty,
          unitPrice: item?.price || 0,
        };
      }),
      kitchenNotes: kitchenNotes.trim(),
    };

    if (onAddToCart) {
      onAddToCart(customized);
    }

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-xl bg-white dark:bg-[#111b21] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Pill Handle for Mobile */}
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#182229]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
              🍗
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                Personalizar Plato
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Churu&apos;s Comida Rápida
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 scrollbar-thin">
          
          {/* 1. Dish Hero Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-900/40 p-4 flex gap-4 items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-orange-500/20 shrink-0 flex items-center justify-center text-3xl shadow-md border border-orange-200 dark:border-orange-900">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span>🍗</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                  Recomendado
                </span>
                <span className="text-xs font-semibold text-slate-400">Churu&apos;s Especial</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                {product.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                {product.description || 'Crujiente presa marinada con receta secreta, acompañada de papas fritas artesanales y ensalada fresca.'}
              </p>
              <div className="mt-2 text-base font-black text-emerald-600 dark:text-emerald-400">
                S/. {basePrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 2. Salsas y Cremas Base (Obligatorio, hasta 3 incluidas) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>🥣 Salsas y Cremas Incluidas</span>
                  <span className="text-rose-500 font-bold">*</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Elige hasta 3 cremas sin costo adicional
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                selectedBaseSauces.length === 3 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {selectedBaseSauces.length} de 3
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BASE_SAUCES.map((sauce) => {
                const isSelected = selectedBaseSauces.includes(sauce.id);
                const isDisabled = !isSelected && selectedBaseSauces.length >= 3;

                return (
                  <button
                    key={sauce.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleBaseSauce(sauce.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 active:scale-98 ${
                      isSelected
                        ? 'border-[#00a884] bg-emerald-50/80 dark:bg-[#00a884]/15 shadow-sm'
                        : isDisabled
                        ? 'border-slate-100 dark:border-slate-800/40 opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#182229]'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{sauce.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${
                          isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {sauce.name}
                        </span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                          isSelected 
                            ? 'bg-[#00a884] text-white' 
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {sauce.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Salsas Premium / Especiales (+S/. 2.00 opcional) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Salsas Gourmet Especiales</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                    +S/. 2.00 c/u
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Potencia el sabor de tu broaster con salsas de autor
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {PREMIUM_SAUCES.map((sauce) => {
                const isSelected = selectedPremiumSauces.includes(sauce.id);

                return (
                  <div
                    key={sauce.id}
                    onClick={() => togglePremiumSauce(sauce.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between active:scale-[0.99] ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#182229]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{sauce.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {sauce.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sauce.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        +S/. {sauce.price.toFixed(2)}
                      </span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 font-bold' 
                          : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Opción Especial: Salchibroaster (+S/. 5.00) */}
          <div 
            onClick={() => setIsSalchibroaster(!isSalchibroaster)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between shadow-sm active:scale-[0.99] ${
              isSalchibroaster
                ? 'border-orange-500 bg-gradient-to-r from-orange-500/15 to-amber-500/15 dark:from-orange-950/40 dark:to-amber-950/40 ring-2 ring-orange-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                🌭
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    ¡Conviértelo en Salchibroaster!
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-orange-500 text-white">
                    TOP
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  Agrega rodajas doradas de hot dog frankfurter sobre tus papas fritas.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1">
              <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                +S/. 5.00
              </span>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                isSalchibroaster ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isSalchibroaster ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>
          </div>

          {/* 5. Acompañamientos y Extras (Steppers) */}
          <div className="space-y-2.5">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>🍟 Acompañamientos & Bebidas</span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#182229]">
              {EXTRAS_LIST.map((extra) => {
                const qty = extrasQuantities[extra.id] || 0;

                return (
                  <div key={extra.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-lg">{extra.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {extra.name}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          +S/. {extra.price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExtraDelta(extra.id, -1)}
                        disabled={qty <= 0}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90 disabled:opacity-30 disabled:scale-100 transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center font-extrabold text-xs text-slate-900 dark:text-slate-100">
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleExtraDelta(extra.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Indicaciones para Cocina */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-amber-500" />
              <span>Indicaciones Especiales para Cocina</span>
            </label>
            <input
              type="text"
              placeholder="Ej: papas bien doradas, ají en bolsa aparte, sin ensalada..."
              value={kitchenNotes}
              onChange={(e) => setKitchenNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#00a884]/40 transition-all"
            />
          </div>
        </div>

        {/* 7. Sticky Bottom Action Bar */}
        <div className="p-3.5 sm:p-4 pb-6 sm:pb-4 bg-white dark:bg-[#182229] border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 shadow-lg relative z-20">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 active:scale-90 disabled:opacity-40 transition-all shadow-xs"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-slate-100">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(prev => prev + 1)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 active:scale-90 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Primary Action Button with Dynamic Grand Total */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Agregar al Pedido</span>
            </div>
            <span className="text-sm sm:text-base font-black pl-2">
              S/. {grandTotal.toFixed(2)}
            </span>
          </button>
        </div>

        {/* Success Feedback Banner */}
        {showSuccessToast && (
          <div className="absolute inset-0 bg-[#00a884] text-white flex flex-col items-center justify-center p-6 space-y-2 animate-in zoom-in-95 duration-200 z-50">
            <CheckCircle2 className="w-14 h-14 animate-bounce" />
            <h3 className="text-lg font-black tracking-tight">¡Plato Personalizado!</h3>
            <p className="text-xs opacity-90 text-center max-w-xs">
              Se agregaron las salsas y extras con éxito a la orden de cocina.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
