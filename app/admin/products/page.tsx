'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  AlertTriangle, 
  UtensilsCrossed, 
  Minus, 
  PauseCircle, 
  PlayCircle,
  X,
  Package,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  allowBackorder: boolean;
  categoryId: string | null;
  category: Category | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formSku, setFormSku] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAllowBackorder, setFormAllowBackorder] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?search=${encodeURIComponent(search)}`),
        fetch('/api/admin/categories'),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) setProducts(prodData.products);
      if (catData.success) setCategories(catData.categories);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Fast Stock update (+ / -)
  const handleStockDelta = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    if (newStock === product.stock) return;

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
    setUpdatingId(product.id);

    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch (err) {
      console.error('Error actualizando stock:', err);
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  // Fast toggle product availability (Pause / Resume)
  const handleToggleActive = async (product: Product) => {
    const newActive = !product.isActive;

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: newActive } : p));
    setUpdatingId(product.id);

    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
    } catch (err) {
      console.error('Error cambiando disponibilidad:', err);
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormStock('10');
    setFormSku('');
    setFormImageUrl('');
    setFormCategoryId(categories[0]?.id || '');
    setFormAllowBackorder(false);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormPrice(p.price.toString());
    setFormStock(p.stock.toString());
    setFormSku(p.sku || '');
    setFormImageUrl(p.imageUrl || '');
    setFormCategoryId(p.categoryId || '');
    setFormAllowBackorder(p.allowBackorder);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) return;

    setSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDescription,
        price: parseFloat(formPrice),
        stock: parseInt(formStock, 10) || 0,
        sku: formSku,
        imageUrl: formImageUrl,
        categoryId: formCategoryId || null,
        allowBackorder: formAllowBackorder,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        await loadData();
      } else {
        alert('Error al guardar el producto');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el plato "${name}" del menú?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert('No se pudo eliminar el plato');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for food emojis per category name
  const getCategoryEmoji = (catName?: string) => {
    if (!catName) return '🍽️';
    const n = catName.toLowerCase();
    if (n.includes('hamburguesa')) return '🍔';
    if (n.includes('broaster') || n.includes('pollo')) return '🍗';
    if (n.includes('alitas')) return '🍖';
    if (n.includes('salchipapa')) return '🍟';
    if (n.includes('enchilada') || n.includes('taco')) return '🌮';
    if (n.includes('bebida') || n.includes('gaseosa')) return '🥤';
    if (n.includes('postre')) return '🍰';
    return '🍽️';
  };

  // Filter products by selected category
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Catálogo & Menú
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                  {products.length} platos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Churu&apos;s Comida Rápida • Control táctil de platos y stock en S/.
              </p>
            </div>
          </div>

          {/* Action button: Nuevo Plato */}
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Plato</span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, ingrediente o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Pills (horizontal swipeable on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              🍽️ Todos ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span>{getCategoryEmoji(cat.name)}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Cargando platos y stock...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
            🍗
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No hay platos en esta categoría
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Intenta con otra categoría o agrega un nuevo plato al menú.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isPaused = !product.isActive;
            const emoji = getCategoryEmoji(product.category?.name);

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                  isPaused 
                    ? 'border-slate-300 dark:border-slate-800 opacity-75 bg-slate-50/50 dark:bg-slate-900/50' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Paused Banner if inactive */}
                {isPaused && (
                  <div className="bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full absolute top-3 right-3 shadow-sm uppercase tracking-wider">
                    Pausado / Agotado
                  </div>
                )}

                <div>
                  {/* Top: Category & Price */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <span>{emoji}</span>
                      <span>{product.category?.name || 'General'}</span>
                    </span>

                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      S/. {product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Dish Name & Description */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-3">
                    {product.description || 'Plato preparado al momento con los mejores ingredientes de la casa.'}
                  </p>
                </div>

                {/* Bottom Controls: Tactile Stock +/- and Pause/Play Switch */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {/* Quick Stock Tactile Stepper */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl">
                    <span className="text-xs font-medium text-slate-500 pl-2">Stock:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStockDelta(product, -1)}
                        disabled={product.stock <= 0 || updatingId === product.id}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:scale-100"
                        title="Restar 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className={`min-w-[28px] text-center font-extrabold text-sm ${
                        product.stock <= 5 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {product.stock}
                      </span>

                      <button
                        onClick={() => handleStockDelta(product, 1)}
                        disabled={updatingId === product.id}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90 hover:bg-slate-100 transition-all disabled:opacity-30"
                        title="Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Availability Toggle & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Fast Toggle Availability (Pausar / Activar) */}
                    <button
                      onClick={() => handleToggleActive(product)}
                      disabled={updatingId === product.id}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                        product.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      {product.isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Disponible</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Editar plato"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Eliminar del menú"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear / Editar Plato */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingProduct ? 'Editar Plato' : 'Nuevo Plato para el Menú'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Plato *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Salchibroaster Especial Churu's"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Precio (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="25.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Acompañamientos
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Pieza de pollo crispy, papas huayro, cremas de la casa y ensalada fresca."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código SKU (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej: BR-01"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-500 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingProduct ? 'Actualizar Plato' : 'Crear Plato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
