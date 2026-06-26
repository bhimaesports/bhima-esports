import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useApp } from '../../context/AppContext';

export default function AdminCMS() {
  const { settings, sseEvents } = useApp();
  const [activeTab, setActiveTab] = useState('hero');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data from global settings
  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...settings, // Pre-fill with everything
        ...prev // Keep unsaved changes if they exist
      }));
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Find all keys starting with cms_ and save them
      const cmsData = {};
      Object.keys(formData).forEach(key => {
        if (key.startsWith('cms_')) {
          cmsData[key] = formData[key];
        }
      });
      await api.put('/settings', { settings: cmsData });
      alert('CMS content updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save CMS content.');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="form-input"
          value={formData[key] !== undefined ? formData[key] : ''}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : type === 'checkbox' ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={formData[key] === '1'} 
            onChange={(e) => handleChange(key, e.target.checked ? '1' : '0')} 
          />
          Visible
        </label>
      ) : type === 'select' ? (
        <select
          className="form-input"
          value={formData[key] !== undefined ? formData[key] : ''}
          onChange={(e) => handleChange(key, e.target.value)}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      ) : (
        <input
          type={type}
          className="form-input"
          value={formData[key] !== undefined ? formData[key] : ''}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="page-wrapper animate-in">
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
           <div className="accent-line"></div>
           <h2>Website CMS</h2>
           <p>Manage all text content, labels, and SEO tags dynamically across the platform.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <Button variant={activeTab === 'hero' ? 'primary' : 'outline'} onClick={() => setActiveTab('hero')}>Hero Section</Button>
          <Button variant={activeTab === 'nav' ? 'primary' : 'outline'} onClick={() => setActiveTab('nav')}>Navigation</Button>
          <Button variant={activeTab === 'homepage' ? 'primary' : 'outline'} onClick={() => setActiveTab('homepage')}>Homepage Cards</Button>
          <Button variant={activeTab === 'pages' ? 'primary' : 'outline'} onClick={() => setActiveTab('pages')}>Page Headers</Button>
          <Button variant={activeTab === 'footer' ? 'primary' : 'outline'} onClick={() => setActiveTab('footer')}>Footer</Button>
          <Button variant={activeTab === 'seo' ? 'primary' : 'outline'} onClick={() => setActiveTab('seo')}>SEO</Button>
        </div>

        <form onSubmit={handleSave}>
          <Card>
            {activeTab === 'hero' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>Hero Editor</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {renderInput('cms_hero_label', 'Small Hero Label', 'text', 'OFFICIAL ESPORTS PLATFORM')}
                  {renderInput('cms_hero_title_1', 'Title Line 1', 'text', 'BHIMA')}
                  {renderInput('cms_hero_title_2', 'Title Line 2 (Massive)', 'text', 'ESPORTS')}
                  {renderInput('cms_hero_title_3', 'Title Line 3 (Massive)', 'text', 'TOURNAMENT HUB')}
                  {renderInput('cms_hero_btn_primary', 'Primary Button Text', 'text', 'Register Now')}
                  {renderInput('cms_hero_btn_secondary', 'Secondary Button Text', 'text', 'View Leaderboard')}
                  {renderInput('cms_hero_bg_opacity', 'Overlay Opacity (0 to 1)', 'text', '0.85')}
                  {renderInput('cms_hero_alignment', 'Text Alignment', 'select')}
                  {renderInput('cms_hero_visible', 'Hero Visibility', 'checkbox')}
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  {renderInput('cms_hero_description', 'Hero Description', 'textarea', 'The ultimate battlefield...')}
                </div>
              </div>
            )}

            {activeTab === 'nav' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>Navigation Editor</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {renderInput('cms_nav_home', 'Home Link', 'text', 'Home')}
                  {renderInput('cms_nav_tournaments', 'Tournaments Link', 'text', 'Tournaments')}
                  {renderInput('cms_nav_teams', 'Teams Link', 'text', 'Teams')}
                  {renderInput('cms_nav_players', 'Players Link', 'text', 'Players')}
                  {renderInput('cms_nav_leaderboard', 'Leaderboard Link', 'text', 'Leaderboard')}
                  {renderInput('cms_nav_hof', 'Hall of Fame Link', 'text', 'Hall of Fame')}
                </div>
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>Homepage Info Ticker Boxes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Card 1</h4>
                    {renderInput('cms_home_card1_title', 'Card Title', 'text')}
                    {renderInput('cms_home_card1_sub', 'Card Subtitle', 'text')}
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Card 2</h4>
                    {renderInput('cms_home_card2_title', 'Card Title', 'text')}
                    {renderInput('cms_home_card2_sub', 'Card Subtitle', 'text')}
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Card 3</h4>
                    {renderInput('cms_home_card3_title', 'Card Title', 'text')}
                    {renderInput('cms_home_card3_sub', 'Card Subtitle', 'text')}
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Card 4</h4>
                    {renderInput('cms_home_card4_title', 'Card Title', 'text')}
                    {renderInput('cms_home_card4_sub', 'Card Subtitle', 'text')}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>Pages Editor</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Tournaments Page</h4>
                    {renderInput('cms_page_tournaments_title', 'Page Title', 'text')}
                    {renderInput('cms_page_tournaments_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Teams Page</h4>
                    {renderInput('cms_page_teams_title', 'Page Title', 'text')}
                    {renderInput('cms_page_teams_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Players Page</h4>
                    {renderInput('cms_page_players_title', 'Page Title', 'text')}
                    {renderInput('cms_page_players_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Leaderboard Page</h4>
                    {renderInput('cms_page_leaderboard_title', 'Page Title', 'text')}
                    {renderInput('cms_page_leaderboard_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Hall of Fame</h4>
                    {renderInput('cms_page_hof_title', 'Page Title', 'text')}
                    {renderInput('cms_page_hof_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>About Page</h4>
                    {renderInput('cms_page_about_title', 'Page Title', 'text')}
                    {renderInput('cms_page_about_sub', 'Page Subtitle', 'text')}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Contact Page</h4>
                    {renderInput('cms_page_contact_title', 'Page Title', 'text')}
                    {renderInput('cms_page_contact_sub', 'Page Subtitle', 'text')}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>Footer Editor</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {renderInput('cms_footer_logo_text', 'Footer Logo Text', 'text')}
                  {renderInput('cms_footer_copyright', 'Copyright Line', 'text')}
                  {renderInput('cms_footer_email', 'Contact Email', 'text')}
                  {renderInput('cms_footer_phone', 'Contact Phone', 'text')}
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  {renderInput('cms_footer_description', 'Footer Description', 'textarea')}
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="stagger-1">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--neon)' }}>SEO Optimization</h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {renderInput('cms_seo_title', 'Global Meta Title', 'text', 'Bhima Esports - Tournament Platform')}
                  {renderInput('cms_seo_keywords', 'Meta Keywords (Comma separated)', 'text', 'esports, bgmi, tournaments')}
                  {renderInput('cms_seo_description', 'Meta Description', 'textarea', 'Official esports tournament platform...')}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <Button type="button" variant="outline" onClick={() => window.open('/', '_blank')}>Preview Site</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
