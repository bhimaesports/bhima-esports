import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import FlashNews from '../../components/Layout/FlashNews';
import { useApp } from '../../context/AppContext';

export default function AdminFlashNews() {
  const { sseEvents, settings } = useApp();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    start_date: '',
    end_date: '',
    is_active: 1
  });
  const [saving, setSaving] = useState(false);
  const [speed, setSpeed] = useState(settings?.flash_news_speed || 'normal');

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (sseEvents?.type === 'flash_news') fetchNews();
  }, [sseEvents]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage/flash-news', { all: 1 });
      setNews(data.flashNews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        priority: item.priority || 'normal',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        is_active: item.is_active ? 1 : 0
      });
    } else {
      setFormData({ title: '', description: '', priority: 'normal', start_date: '', end_date: '', is_active: 1 });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert('Title is required');
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/homepage/flash-news/${editingItem.id}`, formData);
      } else {
        await api.post(`/homepage/flash-news`, { ...formData, display_order: news.length });
      }
      handleCloseModal();
      fetchNews();
    } catch (err) {
      alert(err.message || 'Failed to save flash news');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this flash news?')) return;
    try {
      await api.delete(`/homepage/flash-news/${id}`);
      fetchNews();
    } catch (err) {
      alert(err.message || 'Failed to delete flash news');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.put(`/homepage/flash-news/${item.id}`, { is_active: item.is_active ? 0 : 1 });
      fetchNews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSpeed = async () => {
    try {
      const fd = new FormData();
      fd.append('flash_news_speed', speed);
      await api.put('/homepage/settings', fd);
      alert('Speed updated successfully.');
    } catch (err) {
      alert('Failed to update speed');
    }
  };

  // Drag and Drop Logic
  const [draggedItemIdx, setDraggedItemIdx] = useState(null);

  const onDragStart = (e, index) => {
    setDraggedItemIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIdx === null || draggedItemIdx === index) return;
    const items = [...news];
    const draggedItem = items[draggedItemIdx];
    items.splice(draggedItemIdx, 1);
    items.splice(index, 0, draggedItem);
    setDraggedItemIdx(index);
    setNews(items);
  };

  const onDragEnd = async () => {
    setDraggedItemIdx(null);
    try {
      const orderedIds = news.map(n => n.id);
      await api.put('/homepage/flash-news/reorder', { orderedIds });
    } catch (err) {
      alert('Failed to reorder');
      fetchNews();
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Flash News</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Manage the live scrolling news ticker</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Speed:</span>
            <select className="form-input" style={{ width: 'auto', padding: '0.2rem 1rem 0.2rem 0.5rem' }} value={speed} onChange={e => setSpeed(e.target.value)}>
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
            <Button size="sm" variant="outline" onClick={handleSaveSpeed}>Save</Button>
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>+ Add News</Button>
        </div>
      </div>

      <Card title="Live Ticker Preview" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#000', padding: '2rem 0' }}>
          <FlashNews />
        </div>
      </Card>

      <Card title="Manage Announcements">
        {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner"></div></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>↕</th>
                  <th>Title & Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No flash news items. Add one!</td></tr>
                )}
                {news.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, idx)} 
                    onDragOver={(e) => onDragOver(e, idx)} 
                    onDragEnd={onDragEnd}
                    style={{ 
                      cursor: 'grab', 
                      background: draggedItemIdx === idx ? 'var(--bg-secondary)' : 'transparent',
                      opacity: draggedItemIdx === idx ? 0.5 : 1,
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>⋮⋮</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      {item.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</div>}
                    </td>
                    <td>
                      <Badge variant={item.priority === 'high' ? 'error' : item.priority === 'normal' ? 'info' : 'default'}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <button onClick={() => handleToggleActive(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Badge variant={item.is_active ? 'success' : 'error'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>Start: {item.start_date || 'Immediate'}</div>
                      <div>End: {item.end_date || 'Never'}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="outline" onClick={() => handleOpenModal(item)}>Edit</Button>
                        <Button size="sm" variant="outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDelete(item.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Flash News' : 'Add Flash News'}>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input required type="text" className="form-input" placeholder="e.g. Server maintenance tonight" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input type="text" className="form-input" placeholder="e.g. Services will be down for 2 hours." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label className="form-label">Status</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_active === 1} onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })} />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date (Optional)</label>
              <input type="date" className="form-input" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date (Optional)</label>
              <input type="date" className="form-input" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
