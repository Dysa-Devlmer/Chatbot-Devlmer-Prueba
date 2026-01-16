"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [formColor, setFormColor] = useState('#667eea');
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
    setFormColor('#667eea');
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

  const emojiOptions = ['🏷️', '⭐', '🔥', '⚡', '💎', '🎯', '📌', '💡', '🚀', '💰', '🔧', '📋', '✅', '❌', '⚠️', '🔔', '💬', '👤', '🤝', '📦'];
  const colorOptions = ['#667eea', '#764ba2', '#FF4444', '#FF6B6B', '#FFA500', '#FFD700', '#25D366', '#4ECDC4', '#17A2B8', '#2196F3', '#9C27B0', '#E91E63', '#6C757D', '#343A40'];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '20px', color: '#666' }}>Cargando tags...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            <span style={{ cursor: 'pointer' }}>←</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🏷️ Sistema de Etiquetas</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          + Nueva Etiqueta
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{tags.length}</div>
          <div style={{ color: '#666' }}>Total Tags</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{categories.length}</div>
          <div style={{ color: '#666' }}>Categorias</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {tags.reduce((sum, t) => sum + t.usageCount, 0)}
          </div>
          <div style={{ color: '#666' }}>Usos Totales</div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={styles.filterRow}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            ...styles.filterBtn,
            background: selectedCategory === 'all' ? '#667eea' : 'white',
            color: selectedCategory === 'all' ? 'white' : '#333',
          }}
        >
          Todas ({tags.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.filterBtn,
              background: selectedCategory === cat ? '#667eea' : 'white',
              color: selectedCategory === cat ? 'white' : '#333',
            }}
          >
            {getCategoryName(cat)} ({tags.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Tags Grid */}
      <div style={styles.tagsGrid}>
        {displayedTags.map((tag) => (
          <div key={tag.id} style={styles.tagCard}>
            <div style={styles.tagHeader}>
              <div
                style={{
                  ...styles.tagIcon,
                  background: tag.color,
                }}
              >
                {tag.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.tagName}>{tag.name}</div>
                <div style={styles.tagCategory}>{getCategoryName(tag.category)}</div>
              </div>
              <div style={styles.tagActions}>
                <button
                  onClick={() => openEditModal(tag)}
                  style={styles.actionBtn}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  style={styles.actionBtn}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
            {tag.description && (
              <div style={styles.tagDescription}>{tag.description}</div>
            )}
            <div style={styles.tagFooter}>
              <span style={{ ...styles.tagBadge, background: tag.color }}>
                {tag.icon} {tag.name}
              </span>
              <span style={styles.usageCount}>{tag.usageCount} usos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTag) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              {editingTag ? '✏️ Editar Etiqueta' : '🏷️ Nueva Etiqueta'}
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: VIP, Urgente, Nuevo Lead..."
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Icono</label>
              <div style={styles.emojiGrid}>
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFormIcon(emoji)}
                    style={{
                      ...styles.emojiBtn,
                      background: formIcon === emoji ? '#667eea' : '#f0f2f5',
                      transform: formIcon === emoji ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Color</label>
              <div style={styles.colorGrid}>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    style={{
                      ...styles.colorBtn,
                      background: color,
                      border: formColor === color ? '3px solid #333' : '3px solid transparent',
                      transform: formColor === color ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Categoria</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={styles.select}
              >
                <option value="priority">Prioridad</option>
                <option value="status">Estado</option>
                <option value="general">General</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Descripcion (opcional)</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripcion del tag..."
                style={styles.textarea}
              />
            </div>

            {/* Preview */}
            <div style={styles.previewSection}>
              <label style={styles.label}>Vista Previa</label>
              <div style={styles.previewTag}>
                <span
                  style={{
                    ...styles.tagBadge,
                    background: formColor,
                    fontSize: '14px',
                    padding: '8px 16px',
                  }}
                >
                  {formIcon} {formName || 'Nombre del tag'}
                </span>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTag(null);
                  resetForm();
                }}
                style={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={editingTag ? updateTag : createTag}
                disabled={!formName.trim()}
                style={{
                  ...styles.saveBtn,
                  opacity: formName.trim() ? 1 : 0.5,
                }}
              >
                {editingTag ? 'Guardar Cambios' : 'Crear Etiqueta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Guide */}
      <div style={styles.guideSection}>
        <h3 style={{ margin: '0 0 15px 0' }}>Como usar las etiquetas</h3>
        <div style={styles.guideGrid}>
          <div style={styles.guideCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>1️⃣</div>
            <h4>Crear Etiquetas</h4>
            <p>Crea etiquetas personalizadas para organizar tus conversaciones y usuarios.</p>
          </div>
          <div style={styles.guideCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>2️⃣</div>
            <h4>Asignar Tags</h4>
            <p>Asigna tags a usuarios o conversaciones desde la bandeja de mensajes.</p>
          </div>
          <div style={styles.guideCard}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>3️⃣</div>
            <h4>Filtrar y Buscar</h4>
            <p>Usa las etiquetas para filtrar y encontrar rapidamente lo que necesitas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '20px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  tagsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  tagCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  tagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px',
  },
  tagIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  tagName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  tagCategory: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  tagActions: {
    display: 'flex',
    gap: '5px',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px',
    borderRadius: '5px',
    transition: 'background 0.2s',
  },
  tagDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    lineHeight: '1.5',
  },
  tagFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    color: 'white',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: '500',
  },
  usageCount: {
    fontSize: '12px',
    color: '#888',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical',
  },
  emojiGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  emojiBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.2s',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  colorBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  previewSection: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  previewTag: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '10px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  guideSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginTop: '20px',
  },
  guideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  guideCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
};
