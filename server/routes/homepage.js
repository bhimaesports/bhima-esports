import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// ==========================================
// HOMEPAGE SETTINGS
// ==========================================

// GET /api/homepage/settings - Get all homepage settings
router.get('/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.all('SELECT * FROM homepage_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    console.error('Get homepage settings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/homepage/settings - Update homepage settings (admin)
router.put('/settings', authenticate, upload.fields([{ name: 'hero_banner', maxCount: 1 }, { name: 'hero_video', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const settings = { ...req.body };

    // Handle file uploads
    if (req.files?.hero_banner) {
      settings.hero_banner_url = `/uploads/${req.files.hero_banner[0].filename}`;
    }
    if (req.files?.hero_video) {
      settings.hero_video_url = `/uploads/${req.files.hero_video[0].filename}`;
    }

    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        db.run(
          `INSERT INTO homepage_settings (key, value) VALUES (?, ?) 
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          [key, String(value)]
        );
      }
    });

    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'UPDATE_HOMEPAGE_SETTINGS', 'Updated homepage configuration', req.ip]
      );
    }

    broadcastEvent('homepage_updated', {});
    res.json({ message: 'Homepage settings updated successfully.' });
  } catch (err) {
    console.error('Update homepage settings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// SPONSORS
// ==========================================

// GET /api/homepage/sponsors - Get active sponsors
router.get('/sponsors', (req, res) => {
  try {
    const db = getDb();
    const { all } = req.query;
    let query = 'SELECT * FROM sponsors';
    if (!all) query += ' WHERE is_active = 1';
    query += ' ORDER BY display_order ASC, id DESC';
    const sponsors = db.all(query);
    res.json({ sponsors });
  } catch (err) {
    console.error('Get sponsors error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/homepage/sponsors - Create sponsor
router.post('/sponsors', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const { name, link, display_order, is_active } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
    if (!logo_url) return res.status(400).json({ error: 'Logo is required' });

    db.run(
      `INSERT INTO sponsors (name, logo_url, link, display_order, is_active) VALUES (?, ?, ?, ?, ?)`,
      [name, logo_url, link || null, display_order || 0, is_active !== undefined ? Number(is_active) : 1]
    );

    broadcastEvent('homepage_updated', {});
    res.status(201).json({ message: 'Sponsor created successfully.' });
  } catch (err) {
    console.error('Create sponsor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/homepage/sponsors/:id - Update sponsor
router.put('/sponsors/:id', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, link, display_order, is_active } = req.body;
    
    const existing = db.get('SELECT * FROM sponsors WHERE id = ?', [Number(id)]);
    if (!existing) return res.status(404).json({ error: 'Sponsor not found' });

    const logo_url = req.file ? `/uploads/${req.file.filename}` : existing.logo_url;

    db.run(
      `UPDATE sponsors SET name = ?, logo_url = ?, link = ?, display_order = ?, is_active = ? WHERE id = ?`,
      [
        name || existing.name,
        logo_url,
        link !== undefined ? link : existing.link,
        display_order !== undefined ? Number(display_order) : existing.display_order,
        is_active !== undefined ? Number(is_active) : existing.is_active,
        Number(id)
      ]
    );

    broadcastEvent('homepage_updated', {});
    res.json({ message: 'Sponsor updated successfully.' });
  } catch (err) {
    console.error('Update sponsor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/homepage/sponsors/:id - Delete sponsor
router.delete('/sponsors/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM sponsors WHERE id = ?', [Number(req.params.id)]);
    broadcastEvent('homepage_updated', {});
    res.json({ message: 'Sponsor deleted successfully.' });
  } catch (err) {
    console.error('Delete sponsor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// PARTNERS
// ==========================================

// GET /api/homepage/partners - Get active partners
router.get('/partners', (req, res) => {
  try {
    const db = getDb();
    const { all } = req.query;
    let query = 'SELECT * FROM partners';
    if (!all) query += ' WHERE is_active = 1';
    query += ' ORDER BY display_order ASC, id DESC';
    const partners = db.all(query);
    res.json({ partners });
  } catch (err) {
    console.error('Get partners error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/homepage/partners - Create partner
router.post('/partners', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const { name, link, type, display_order, is_active } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
    if (!logo_url) return res.status(400).json({ error: 'Logo is required' });

    db.run(
      `INSERT INTO partners (name, logo_url, type, link, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, logo_url, type || 'partner', link || null, display_order || 0, is_active !== undefined ? Number(is_active) : 1]
    );

    broadcastEvent('homepage_updated', {});
    res.status(201).json({ message: 'Partner created successfully.' });
  } catch (err) {
    console.error('Create partner error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/homepage/partners/:id - Update partner
router.put('/partners/:id', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, link, type, display_order, is_active } = req.body;
    
    const existing = db.get('SELECT * FROM partners WHERE id = ?', [Number(id)]);
    if (!existing) return res.status(404).json({ error: 'Partner not found' });

    const logo_url = req.file ? `/uploads/${req.file.filename}` : existing.logo_url;

    db.run(
      `UPDATE partners SET name = ?, logo_url = ?, type = ?, link = ?, display_order = ?, is_active = ? WHERE id = ?`,
      [
        name || existing.name,
        logo_url,
        type || existing.type,
        link !== undefined ? link : existing.link,
        display_order !== undefined ? Number(display_order) : existing.display_order,
        is_active !== undefined ? Number(is_active) : existing.is_active,
        Number(id)
      ]
    );

    broadcastEvent('homepage_updated', {});
    res.json({ message: 'Partner updated successfully.' });
  } catch (err) {
    console.error('Update partner error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/homepage/partners/:id - Delete partner
router.delete('/partners/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM partners WHERE id = ?', [Number(req.params.id)]);
    broadcastEvent('homepage_updated', {});
    res.json({ message: 'Partner deleted successfully.' });
  } catch (err) {
    console.error('Delete partner error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// FLASH NEWS
// ==========================================

// GET /api/homepage/flash-news - Get active flash news
router.get('/flash-news', (req, res) => {
  try {
    const db = getDb();
    const { all } = req.query;
    let query = 'SELECT * FROM flash_news';
    
    if (!all) {
      // For public API: only active and within date range if provided
      const today = new Date().toISOString().split('T')[0];
      query += ` WHERE is_active = 1 
                 AND (start_date IS NULL OR start_date <= '${today}')
                 AND (end_date IS NULL OR end_date >= '${today}')`;
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    const flashNews = db.all(query);
    res.json({ flashNews });
  } catch (err) {
    console.error('Get flash news error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/homepage/flash-news - Create flash news
router.post('/flash-news', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { title, description, priority, start_date, end_date, is_active, display_order } = req.body;
    
    if (!title) return res.status(400).json({ error: 'Title is required' });

    db.run(
      `INSERT INTO flash_news (title, description, priority, start_date, end_date, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || null, 
        priority || 'normal', 
        start_date || null, 
        end_date || null, 
        is_active !== undefined ? Number(is_active) : 1,
        display_order || 0
      ]
    );

    broadcastEvent('flash_news', {});
    res.status(201).json({ message: 'Flash news created successfully.' });
  } catch (err) {
    console.error('Create flash news error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/homepage/flash-news/:id - Update flash news
router.put('/flash-news/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title, description, priority, start_date, end_date, is_active, display_order } = req.body;
    
    const existing = db.get('SELECT * FROM flash_news WHERE id = ?', [Number(id)]);
    if (!existing) return res.status(404).json({ error: 'Flash news not found' });

    db.run(
      `UPDATE flash_news SET title = ?, description = ?, priority = ?, start_date = ?, end_date = ?, is_active = ?, display_order = ? WHERE id = ?`,
      [
        title || existing.title,
        description !== undefined ? description : existing.description,
        priority || existing.priority,
        start_date !== undefined ? start_date : existing.start_date,
        end_date !== undefined ? end_date : existing.end_date,
        is_active !== undefined ? Number(is_active) : existing.is_active,
        display_order !== undefined ? Number(display_order) : existing.display_order,
        Number(id)
      ]
    );

    broadcastEvent('flash_news', {});
    res.json({ message: 'Flash news updated successfully.' });
  } catch (err) {
    console.error('Update flash news error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/homepage/flash-news/reorder - Bulk reorder
router.put('/flash-news/reorder', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { orderedIds } = req.body; // Array of IDs in the new order
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    db.transaction(() => {
      orderedIds.forEach((id, index) => {
        db.run('UPDATE flash_news SET display_order = ? WHERE id = ?', [index, Number(id)]);
      });
    });

    broadcastEvent('flash_news', {});
    res.json({ message: 'Flash news reordered successfully.' });
  } catch (err) {
    console.error('Reorder flash news error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/homepage/flash-news/:id - Delete flash news
router.delete('/flash-news/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM flash_news WHERE id = ?', [Number(req.params.id)]);
    broadcastEvent('flash_news', {});
    res.json({ message: 'Flash news deleted successfully.' });
  } catch (err) {
    console.error('Delete flash news error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
