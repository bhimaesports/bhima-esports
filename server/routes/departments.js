import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/departments - list all departments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    
    // Get all departments with their stats
    const departments = db.all(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM teams t WHERE t.department_id = d.id) as team_count,
             (SELECT COUNT(*) FROM players p WHERE p.department_id = d.id) as player_count,
             IFNULL((SELECT total_points FROM dept_leaderboard dl WHERE dl.department_id = d.id), 0) as points
      FROM departments d
      ORDER BY d.name ASC
    `);

    res.json(departments);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/departments/:id - get single department
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const department = db.get(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM teams t WHERE t.department_id = d.id) as team_count,
             (SELECT COUNT(*) FROM players p WHERE p.department_id = d.id) as player_count
      FROM departments d
      WHERE d.id = ?
    `, [Number(id)]);

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    res.json(department);
  } catch (err) {
    console.error('Get department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/departments - create department (admin)
router.post('/', authenticate, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { name, code, color, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required.' });
    }

    // Check if code already exists
    const existing = db.get('SELECT id FROM departments WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ error: 'Department code already exists.' });
    }

    const logo_url = req.files?.logo ? `/uploads/${req.files.logo[0].filename}` : null;
    const banner_url = req.files?.banner ? `/uploads/${req.files.banner[0].filename}` : null;

    db.run(
      `INSERT INTO departments (name, code, logo_url, banner_url, color, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, code, logo_url, banner_url, color || null, description || null]
    );

    const id = db.getLastInsertRowId();
    
    // Auto-create leaderboard entry
    db.run('INSERT OR IGNORE INTO dept_leaderboard (department_id) VALUES (?)', [id]);

    const department = db.get('SELECT * FROM departments WHERE id = ?', [id]);

    // Log the action
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'CREATE_DEPARTMENT', `Created department: ${name} (${code})`, req.ip]
      );
    }

    broadcastEvent('entity_update', { entity: 'departments' });

    res.status(201).json({ message: 'Department created successfully.', department });
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/departments/:id - update department (admin)
router.put('/:id', authenticate, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const department = db.get('SELECT * FROM departments WHERE id = ?', [Number(id)]);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const { name, code, color, description } = req.body;

    if (code && code !== department.code) {
      const existing = db.get('SELECT id FROM departments WHERE code = ? AND id != ?', [code, Number(id)]);
      if (existing) {
        return res.status(400).json({ error: 'Department code already exists.' });
      }
    }

    const logo_url = req.files?.logo ? `/uploads/${req.files.logo[0].filename}` : department.logo_url;
    const banner_url = req.files?.banner ? `/uploads/${req.files.banner[0].filename}` : department.banner_url;

    db.run(
      `UPDATE departments SET
         name = ?, code = ?, logo_url = ?, banner_url = ?, color = ?, description = ?
       WHERE id = ?`,
      [
        name || department.name,
        code || department.code,
        logo_url,
        banner_url,
        color !== undefined ? color : department.color,
        description !== undefined ? description : department.description,
        Number(id)
      ]
    );

    const updated = db.get('SELECT * FROM departments WHERE id = ?', [Number(id)]);

    // Log the action
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'UPDATE_DEPARTMENT', `Updated department: ${updated.name}`, req.ip]
      );
    }

    broadcastEvent('entity_update', { entity: 'departments' });

    res.json({ message: 'Department updated successfully.', department: updated });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/departments/:id - delete department (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    const department = db.get('SELECT * FROM departments WHERE id = ?', [Number(id)]);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Check if department has teams or players
    const teamCount = db.get('SELECT COUNT(*) as count FROM teams WHERE department_id = ?', [Number(id)])?.count || 0;
    const playerCount = db.get('SELECT COUNT(*) as count FROM players WHERE department_id = ?', [Number(id)])?.count || 0;

    if (teamCount > 0 || playerCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department. It is assigned to ${teamCount} teams and ${playerCount} players. Reassign them first.` 
      });
    }

    // Delete from leaderboard
    db.run('DELETE FROM dept_leaderboard WHERE department_id = ?', [Number(id)]);
    
    // Delete the department
    db.run('DELETE FROM departments WHERE id = ?', [Number(id)]);

    // Log the action
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'DELETE_DEPARTMENT', `Deleted department: ${department.name}`, req.ip]
      );
    }

    broadcastEvent('entity_update', { entity: 'departments' });

    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
