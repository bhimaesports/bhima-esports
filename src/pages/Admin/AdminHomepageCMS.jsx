import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Table from '../../components/UI/Table';
import Badge from '../../components/UI/Badge';

function SettingsTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    stats_visible: 1,
    about_title: '',
    about_text: '',
    ticker_text: ''
  });
  
  const [files, setFiles] = useState({
    hero_video: null,
    hero_banner: null,
    about_image: null
  });

  const [currentFiles, setCurrentFiles] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage/settings');
      if (data) {
        setFormData({
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          stats_visible: data.stats_visible ?? 1,
          about_title: data.about_title || '',
          about_text: data.about_text || '',
          ticker_text: data.ticker_text || ''
        });
        setCurrentFiles({
          hero_video_url: data.hero_video_url,
          hero_banner_url: data.hero_banner_url,
          about_image_url: data.about_image_url
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList.length > 0) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(k => {
        fd.append(k, formData[k]);
      });
      Object.keys(files).forEach(k => {
        if (files[k]) {
          fd.append(k, files[k]);
        }
      });
      await api.put('/homepage/settings', fd);
      alert('Homepage settings saved successfully!');
      fetchSettings();
      setFiles({ hero_video: null, hero_banner: null, about_image: null });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <Card>
        <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Hero Section</h3>
        <div className="form-group">
          <label>Hero Title</label>
          <input className="form-control" name="hero_title" value={formData.hero_title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Hero Subtitle</label>
          <input className="form-control" name="hero_subtitle" value={formData.hero_subtitle} onChange={handleChange} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Hero Banner (Image)</label>
            <input type="file" className="form-control" name="hero_banner" onChange={handleFileChange} accept="image/*" />
            {currentFiles.hero_banner_url && !files.hero_banner && (
              <div style={{ marginTop: '0.5rem' }}>
                <a href={currentFiles.hero_banner_url} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)' }}>View Current Banner</a>
              </div>
            )}
            <small style={{ color: 'var(--text-muted)' }}>Leave blank to keep current.</small>
          </div>
          <div className="form-group">
            <label>Hero Video</label>
            <input type="file" className="form-control" name="hero_video" onChange={handleFileChange} accept="video/*" />
            {currentFiles.hero_video_url && !files.hero_video && (
              <div style={{ marginTop: '0.5rem' }}>
                <a href={currentFiles.hero_video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)' }}>View Current Video</a>
              </div>
            )}
            <small style={{ color: 'var(--text-muted)' }}>Background looping video (optional).</small>
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Match Ticker & Stats</h3>
        <div className="form-group">
          <label>Ticker Text</label>
          <input className="form-control" name="ticker_text" value={formData.ticker_text} onChange={handleChange} placeholder="Scrolling text on homepage..." />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" name="stats_visible" checked={formData.stats_visible === 1} onChange={handleChange} />
            Show Statistics Section on Homepage
          </label>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>About Section</h3>
        <div className="form-group">
          <label>About Title</label>
          <input className="form-control" name="about_title" value={formData.about_title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>About Text</label>
          <textarea className="form-control" name="about_text" value={formData.about_text} onChange={handleChange} rows={5} />
        </div>
        <div className="form-group">
          <label>About Image</label>
          <input type="file" className="form-control" name="about_image" onChange={handleFileChange} accept="image/*" />
          {currentFiles.about_image_url && !files.about_image && (
            <div style={{ marginTop: '0.5rem' }}>
              <img src={currentFiles.about_image_url} alt="About" style={{ width: '200px', borderRadius: '8px' }} />
            </div>
          )}
        </div>
      </Card>

      <div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

function SponsorsTab() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({ name: '', link: '', display_order: 0, is_active: 1 });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage/sponsors', { all: 1 });
      setSponsors(data.sponsors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sponsor = null) => {
    setEditingItem(sponsor);
    if (sponsor) {
      setFormData({
        name: sponsor.name,
        link: sponsor.link || '',
        display_order: sponsor.display_order || 0,
        is_active: sponsor.is_active ? 1 : 0
      });
    } else {
      setFormData({ name: '', link: '', display_order: 0, is_active: 1 });
    }
    setLogoFile(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('link', formData.link);
      fd.append('display_order', formData.display_order);
      fd.append('is_active', formData.is_active);
      if (logoFile) fd.append('logo', logoFile);

      if (editingItem) {
        await api.put(`/homepage/sponsors/${editingItem.id}`, fd);
      } else {
        await api.post(`/homepage/sponsors`, fd);
      }
      handleCloseModal();
      fetchSponsors();
    } catch (err) {
      alert(err.message || 'Failed to save sponsor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sponsor?')) return;
    try {
      await api.delete(`/homepage/sponsors/${id}`);
      fetchSponsors();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'logo_url',
      label: 'Logo',
      sortable: false,
      render: (val) => val ? <img src={val} alt="logo" style={{ height: '40px', objectFit: 'contain' }} /> : '-'
    },
    { key: 'name', label: 'Name' },
    { key: 'link', label: 'Link', render: (val) => val ? <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)' }}>Link</a> : '-' },
    { key: 'display_order', label: 'Order' },
    { key: 'is_active', label: 'Status', render: (val) => val ? <Badge variant="success">Active</Badge> : <Badge variant="default">Hidden</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Sponsors List</h3>
        <Button onClick={() => handleOpenModal()} variant="primary">+ Add Sponsor</Button>
      </div>

      <Card>
        {loading ? <div style={{ textAlign: 'center' }}>Loading...</div> : (
          <Table columns={columns} data={sponsors} />
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Sponsor' : 'Add Sponsor'}>
        <div className="form-group">
          <label>Name *</label>
          <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input className="form-control" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Display Order</label>
          <input type="number" className="form-control" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.is_active === 1} onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })} />
            Is Active
          </label>
        </div>
        <div className="form-group">
          <label>Logo Image {editingItem && !logoFile && '(Leave blank to keep current)'}</label>
          <input type="file" className="form-control" onChange={e => setLogoFile(e.target.files[0])} accept="image/*" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}

function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({ name: '', link: '', type: '', display_order: 0, is_active: 1 });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage/partners', { all: 1 });
      setPartners(data.partners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (partner = null) => {
    setEditingItem(partner);
    if (partner) {
      setFormData({
        name: partner.name,
        link: partner.link || '',
        type: partner.type || '',
        display_order: partner.display_order || 0,
        is_active: partner.is_active ? 1 : 0
      });
    } else {
      setFormData({ name: '', link: '', type: '', display_order: 0, is_active: 1 });
    }
    setLogoFile(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('link', formData.link);
      fd.append('type', formData.type);
      fd.append('display_order', formData.display_order);
      fd.append('is_active', formData.is_active);
      if (logoFile) fd.append('logo', logoFile);

      if (editingItem) {
        await api.put(`/homepage/partners/${editingItem.id}`, fd);
      } else {
        await api.post(`/homepage/partners`, fd);
      }
      handleCloseModal();
      fetchPartners();
    } catch (err) {
      alert(err.message || 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this partner?')) return;
    try {
      await api.delete(`/homepage/partners/${id}`);
      fetchPartners();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'logo_url',
      label: 'Logo',
      sortable: false,
      render: (val) => val ? <img src={val} alt="logo" style={{ height: '40px', objectFit: 'contain' }} /> : '-'
    },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'link', label: 'Link', render: (val) => val ? <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)' }}>Link</a> : '-' },
    { key: 'display_order', label: 'Order' },
    { key: 'is_active', label: 'Status', render: (val) => val ? <Badge variant="success">Active</Badge> : <Badge variant="default">Hidden</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" onClick={() => handleOpenModal(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Partners List</h3>
        <Button onClick={() => handleOpenModal()} variant="primary">+ Add Partner</Button>
      </div>

      <Card>
        {loading ? <div style={{ textAlign: 'center' }}>Loading...</div> : (
          <Table columns={columns} data={partners} />
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Partner' : 'Add Partner'}>
        <div className="form-group">
          <label>Name *</label>
          <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Type (e.g., Broadcasting, Venue)</label>
          <input className="form-control" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input className="form-control" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Display Order</label>
          <input type="number" className="form-control" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.is_active === 1} onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })} />
            Is Active
          </label>
        </div>
        <div className="form-group">
          <label>Logo Image {editingItem && !logoFile && '(Leave blank to keep current)'}</label>
          <input type="file" className="form-control" onChange={e => setLogoFile(e.target.files[0])} accept="image/*" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}

// FlashNewsTab removed and migrated to AdminFlashNews.jsx

export default function AdminHomepageCMS() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="page-wrapper animate-in">
      <div className="container">
        <div className="section-header">
           <div className="accent-line"></div>
           <h2>Homepage CMS</h2>
           <p>Manage Homepage Settings, Sponsors, and Partners.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <Button variant={activeTab === 'settings' ? 'primary' : 'outline'} onClick={() => setActiveTab('settings')}>General Settings</Button>
          <Button variant={activeTab === 'sponsors' ? 'primary' : 'outline'} onClick={() => setActiveTab('sponsors')}>Sponsors</Button>
          <Button variant={activeTab === 'partners' ? 'primary' : 'outline'} onClick={() => setActiveTab('partners')}>Partners</Button>
        </div>

        <div className="tab-content stagger-1">
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'sponsors' && <SponsorsTab />}
          {activeTab === 'partners' && <PartnersTab />}
        </div>
      </div>
    </div>
  );
}
