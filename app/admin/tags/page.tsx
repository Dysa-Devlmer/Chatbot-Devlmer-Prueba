"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag as TagIcon, Plus, Edit2, Trash2, Hash, Layers, Check, Sparkles, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  category: string;
  isActive: boolean;
  usageCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#f97316');
  const [formIcon, setFormIcon] = useState('🏷️');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('custom');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      const data = await response.json();
      setTags(data.tags || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!formName.trim()) return;

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          color: formColor,
          icon: formIcon,
          description: formDescription || null,
          category: formCategory,
        }),
      });

      if (response.ok) {
        await fetchTags();
        resetForm();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const updateTag = async () => {
    if (!editingTag || !formName.trim()) return;

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTag.id,
          name: formName,
          color: formColor,
          icon: formIcon,
          description: formDescription || null,
          category: formCategory,
        }),
      });

      if (response.ok) {
        await fetchTags();
        resetForm();
        setEditingTag(null);
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const deleteTag = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tag?')) return;

    try {
      const response = await fetch(`/api/admin/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTags();
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormColor('#f97316');
    setFormIcon('🏷️');
    setFormDescription('');
    setFormCategory('custom');
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormIcon(tag.icon);
    setFormDescription(tag.description || '');
    setFormCategory(tag.category);
  };

  const getCategoryName = (cat: string): string => {
    const names: Record<string, string> = {
      priority: 'Prioridad',
      status: 'Estado',
      general: 'General',
      custom: 'Personalizado',
    };
    return names[cat] || cat;
  };

  const displayedTags = selectedCategory === 'all'
    ? tags
    : tags.filter((t) => t.category === selectedCategory);

  const emojiOptions = ['🏷️', '⭐', '🔥', '⚡', '💎', '🎯', '📌', '💡', '🚀', '💰', '🍔', '🛵', '✅', '❌', '⚠️', '🔔', '💬', '👤', '🤝', '📦'];
  const colorOptions = ['#f97316', '#ea580c', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308', '#64748b', '#1e293b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Cargando etiquetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Organización & CRM</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Etiquetas & Segmentación</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Etiqueta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Etiquetas</span>
            <TagIcon className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{tags.length}</div>
          <p className="text-xs text-stone-400 mt-1">Activas para etiquetado</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase">Categorías</span>
            <Layers className="w-4 h-4 text-lime-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{categories.length}</div>
          <p className="text-xs text-stone-400 mt-1">Agrupaciones automáticas</p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-bold uppercase">Usos Registrados</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {tags.reduce((sum, t) => sum + t.usageCount, 0)}
          </div>
          <p className="text-xs text-stone-400 mt-1">En chats de WhatsApp</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Todas ({tags.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {getCategoryName(cat)} ({tags.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedTags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-sm"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{tag.name}</h3>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      {getCategoryName(tag.category)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(tag)}
                    className="w-8 h-8 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {tag.description && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
                  {tag.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-bold text-[11px]"
                style={{ backgroundColor: tag.color }}
              >
                <span>{tag.icon}</span>
                <span>{tag.name}</span>
              </span>
              <span className="text-stone-400 font-semibold">{tag.usageCount} usos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      {(showCreateModal || editingTag) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTag(null);
                }}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: VIP, Delivery Urgente, Cliente Frecuente"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5">Icono Representativo</label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setFormIcon(emoji)}
                      type="button"
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        formIcon === emoji
                          ? 'bg-orange-500 text-white scale-110 shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      type="button"
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center text-white text-xs ${
                        formColor === color ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="custom">Personalizado</option>
                  <option value="priority">Prioridad</option>
                  <option value="status">Estado</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Breve propósito de esta etiqueta..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTag(null);
                }}
                className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingTag ? updateTag : createTag}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                {editingTag ? 'Guardar Cambios' : 'Crear Etiqueta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
