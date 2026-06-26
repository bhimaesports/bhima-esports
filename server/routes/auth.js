import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { getDb } from '../db/schema.js';
import { authenticate, generateToken, JWT_SECRET } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Rate limiter for login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { admin_id, password } = req.body;

    if (!admin_id || !password) {
      return res.status(400).json({ error: 'Admin ID and password are required.' });
    }

    const db = getDb();
    const admin = db.get('SELECT * FROM admins WHERE admin_id = ?', [admin_id]);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({ id: admin.id, admin_id: admin.admin_id });

    // Log the login action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.admin_id, 'LOGIN', 'Admin logged in', req.ip]
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, admin_id: admin.admin_id },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/change-credentials
router.post('/change-credentials', authenticate, (req, res) => {
  try {
    const { new_admin_id, current_password, new_password } = req.body;
    const db = getDb();

    const admin = db.get('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    // Verify current password
    if (!current_password) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    const isValid = bcrypt.compareSync(current_password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const updates = [];
    const params = [];

    if (new_admin_id && new_admin_id !== admin.admin_id) {
      // Check uniqueness
      const existing = db.get('SELECT id FROM admins WHERE admin_id = ? AND id != ?', [
        new_admin_id,
        admin.id,
      ]);
      if (existing) {
        return res.status(409).json({ error: 'Admin ID already taken.' });
      }
      updates.push('admin_id = ?');
      params.push(new_admin_id);
    }

    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      const hash = bcrypt.hashSync(new_password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(admin.id);

    db.run(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log the action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.admin_id, 'CHANGE_CREDENTIALS', 'Admin credentials updated', req.ip]
    );

    // Generate new token if admin_id changed
    const newAdminId = new_admin_id || admin.admin_id;
    const token = generateToken({ id: admin.id, admin_id: newAdminId });

    res.json({ message: 'Credentials updated successfully.', token });
  } catch (err) {
    console.error('Change credentials error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/verify
router.get('/verify', authenticate, (req, res) => {
  try {
    const db = getDb();
    const admin = db.get('SELECT id, admin_id, created_at FROM admins WHERE id = ?', [
      req.admin.id,
    ]);

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found.' });
    }

    res.json({ valid: true, admin });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/logs (authenticated)
router.get('/logs', authenticate, (req, res) => {
  try {
    const db = getDb();
    const logs = db.all('SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 100');
    res.json({ logs });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/refresh (handles expired tokens)
router.post('/refresh', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    
    // Verify ignoring expiration to allow refreshing an expired token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!decoded.admin_id) {
      return res.status(401).json({ error: 'Not an admin token' });
    }

    const db = getDb();
    const admin = db.get('SELECT * FROM admins WHERE admin_id = ?', [decoded.admin_id]);
    
    if (!admin) {
      return res.status(401).json({ error: 'Admin no longer exists' });
    }

    const newToken = generateToken({ id: admin.id, admin_id: admin.admin_id });
    res.json({ token: newToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
