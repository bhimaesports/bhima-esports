import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';
import Button from '../../components/UI/Button';

export default function AdminHomepageCMS() {
  const { settings, refetchAll } = useApp();
  const [saving, setSaving] = useState(false);
  
  const defaultHomepageConfig = {
    hero: {
      tagline: 'Inter-Department Esports Championship',
      title1: 'DOMINATE THE',
      title2: 'BATTLEFIELD',
      subtitle: '8 departments. 1 champion. Compete in FreeFire, Bgmi & Cod for glory, BE Points, and eternal bragging rights.',
      video_url: 'https://res.cloudinary.com/dns0nlupj/video/upload/can_you_make_this_logo_as_an_g_bi3zdj.mp4#t=0,3'
    },
    stats: [
      { id: '1', source: 'teams.total', label: 'Teams', visible: true },
      { id: '2', source: 'players.total', label: 'Players', visible: true },
      { id: '3', source: 'tournaments.total', label: 'Tournaments', visible: true },
      { id: '4', source: 'departments', label: 'Departments', visible: true }
    ],
    visibility: {
      announcements: true,
      departments: true,
      cta: true
    },
    social: {
      instagram: ''
    }
  };

  const [config, setConfig] = useState(defaultHomepageConfig);

  useEffect(() => {
    if (settings?.homepage_config) {
      try {
        const parsed = JSON.parse(settings.homepage_config);
        // Merge with default to ensure all fields exist
        setConfig({
          hero: { ...defaultHomepageConfig.hero, ...(parsed.hero || {}) },
          stats: parsed.stats || defaultHomepageConfig.stats,
          visibility: { ...defaultHomepageConfig.visibility, ...(parsed.visibility || {}) },
          social: { ...defaultHomepageConfig.social, ...(parsed.social || {}) },
        });
      } catch (e) {
        console.error('Error parsing homepage_config', e);
      }
    }
  }, [settings]);

  const handleHeroChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, [name]: value }
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      social: { ...prev.social, [name]: value }
    }));
  };

  const handleStatChange = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      stats: prev.stats.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', {
        settings: { homepage_config: JSON.stringify(config) }
      });
      alert('Homepage config saved successfully! It is now live.');
      refetchAll();
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const statSources = [
    { value: 'teams.total', label: 'Total Teams' },
    { value: 'teams.active', label: 'Active Teams' },
    { value: 'players.total', label: 'Total Players' },
    { value: 'players.active', label: 'Active Players' },
    { value: 'tournaments.total', label: 'Total Tournaments' },
    { value: 'tournaments.live', label: 'Live Tournaments' },
    { value: 'tournaments.completed', label: 'Completed Tournaments' },
    { value: 'matches.total', label: 'Total Matches' },
    { value: 'registrations.total', label: 'Total Registrations' },
    { value: 'certificates', label: 'Total Certificates' },
    { value: 'departments', label: 'Departments Count' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2>Homepage CMS</h2>
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {/* HERO SECTION */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Hero Section
          </h3>
          <div className="form-group">
            <label>Tagline</label>
            <input className="form-control" name="tagline" value={config.hero.tagline} onChange={handleHeroChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label>Title Line 1</label>
              <input className="form-control" name="title1" value={config.hero.title1} onChange={handleHeroChange} />
            </div>
            <div className="form-group">
              <label>Title Line 2 (Gradient)</label>
              <input className="form-control" name="title2" value={config.hero.title2} onChange={handleHeroChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Subtitle / Description</label>
            <textarea className="form-control" rows={3} name="subtitle" value={config.hero.subtitle} onChange={handleHeroChange} />
          </div>
          <div className="form-group">
            <label>Background Video URL</label>
            <input className="form-control" name="video_url" value={config.hero.video_url} onChange={handleHeroChange} />
            <small style={{ color: 'var(--text-muted)' }}>Must be a direct link to an mp4 file.</small>
          </div>
        </div>

        {/* STATISTICS SECTION */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Statistics Section
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Select what data to display. The numbers will be fetched live from the database.
          </p>
          
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {config.stats.map((stat, idx) => (
              <div key={stat.id} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>#{idx + 1}</div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Label</label>
                  <input 
                    className="form-control" 
                    value={stat.label} 
                    onChange={e => handleStatChange(stat.id, 'label', e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Data Source</label>
                  <select 
                    className="form-control" 
                    value={stat.source}
                    onChange={e => handleStatChange(stat.id, 'source', e.target.value)}
                  >
                    {statSources.map(src => (
                      <option key={src.value} value={src.value}>{src.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={stat.visible}
                      onChange={e => handleStatChange(stat.id, 'visible', e.target.checked)}
                    />
                    Visible
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* SOCIAL LINKS SECTION */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Social Links
          </h3>
          <div className="form-group">
            <label>Instagram URL</label>
            <input 
              className="form-control" 
              name="instagram" 
              placeholder="https://instagram.com/bhimaesports"
              value={config.social?.instagram || ''} 
              onChange={handleSocialChange} 
            />
            <small style={{ color: 'var(--text-muted)' }}>Enter your full Instagram profile link. It will appear in the footer.</small>
          </div>
        </div>

      </div>
    </div>
  );
}
