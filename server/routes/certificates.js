import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { generateCertificateHTML } from '../utils/certificateGenerator.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── TEMPLATES ENDPOINTS (ADMIN ONLY) ──────────────────────────────────────────

// GET /api/certificates/templates - get all templates
router.get('/templates', (req, res) => {
  try {
    const db = getDb();
    const templates = db.all('SELECT * FROM certificate_templates ORDER BY created_at DESC');
    res.json({ templates });
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates/templates - create a template
router.post('/templates', authenticate, (req, res) => {
  try {
    const db = getDb();
    const {
      name, title, description_template, signature_name, signature_designation,
      signature_name_2, signature_designation_2, signature_image, signature_image_2,
      colors, typography, logo_url, logo_size, logo_position, seal_url,
      watermark_text, border_design, sponsor_logos, is_default
    } = req.body;

    if (!name || !title || !description_template) {
      return res.status(400).json({ error: 'name, title, and description_template are required.' });
    }

    db.transaction(() => {
      if (is_default) {
        db.run('UPDATE certificate_templates SET is_default = 0');
      }

      db.run(`
        INSERT INTO certificate_templates (
          name, title, description_template, signature_name, signature_designation,
          signature_name_2, signature_designation_2, signature_image, signature_image_2,
          colors, typography, logo_url, logo_size, logo_position, seal_url,
          watermark_text, border_design, sponsor_logos, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, title, description_template, signature_name || null, signature_designation || null,
        signature_name_2 || null, signature_designation_2 || null, signature_image || null, signature_image_2 || null,
        colors ? JSON.stringify(colors) : null, typography ? JSON.stringify(typography) : null,
        logo_url || null, logo_size ? Number(logo_size) : 80, logo_position || 'top', seal_url || null,
        watermark_text || null, border_design || 'solid', sponsor_logos ? JSON.stringify(sponsor_logos) : null,
        is_default ? 1 : 0
      ]);
    });

    const id = db.getLastInsertRowId();
    const template = db.get('SELECT * FROM certificate_templates WHERE id = ?', [id]);

    res.status(201).json({ message: 'Template created successfully.', template });
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/certificates/templates/:id - update a template
router.put('/templates/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      name, title, description_template, signature_name, signature_designation,
      signature_name_2, signature_designation_2, signature_image, signature_image_2,
      colors, typography, logo_url, logo_size, logo_position, seal_url,
      watermark_text, border_design, sponsor_logos, is_default
    } = req.body;

    const t = db.get('SELECT * FROM certificate_templates WHERE id = ?', [Number(id)]);
    if (!t) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    db.transaction(() => {
      if (is_default) {
        db.run('UPDATE certificate_templates SET is_default = 0');
      }

      db.run(`
        UPDATE certificate_templates SET
          name = ?, title = ?, description_template = ?, signature_name = ?, signature_designation = ?,
          signature_name_2 = ?, signature_designation_2 = ?, signature_image = ?, signature_image_2 = ?,
          colors = ?, typography = ?, logo_url = ?, logo_size = ?, logo_position = ?, seal_url = ?,
          watermark_text = ?, border_design = ?, sponsor_logos = ?, is_default = ?
        WHERE id = ?
      `, [
        name || t.name,
        title || t.title,
        description_template || t.description_template,
        signature_name !== undefined ? signature_name : t.signature_name,
        signature_designation !== undefined ? signature_designation : t.signature_designation,
        signature_name_2 !== undefined ? signature_name_2 : t.signature_name_2,
        signature_designation_2 !== undefined ? signature_designation_2 : t.signature_designation_2,
        signature_image !== undefined ? signature_image : t.signature_image,
        signature_image_2 !== undefined ? signature_image_2 : t.signature_image_2,
        colors ? JSON.stringify(colors) : t.colors,
        typography ? JSON.stringify(typography) : t.typography,
        logo_url !== undefined ? logo_url : t.logo_url,
        logo_size !== undefined ? Number(logo_size) : t.logo_size,
        logo_position !== undefined ? logo_position : t.logo_position,
        seal_url !== undefined ? seal_url : t.seal_url,
        watermark_text !== undefined ? watermark_text : t.watermark_text,
        border_design !== undefined ? border_design : t.border_design,
        sponsor_logos ? JSON.stringify(sponsor_logos) : t.sponsor_logos,
        is_default !== undefined ? (is_default ? 1 : 0) : t.is_default,
        Number(id)
      ]);
    });

    const updated = db.get('SELECT * FROM certificate_templates WHERE id = ?', [Number(id)]);
    res.json({ message: 'Template updated successfully.', template: updated });
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates/templates/:id/clone - clone template
router.post('/templates/:id/clone', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const t = db.get('SELECT * FROM certificate_templates WHERE id = ?', [Number(id)]);
    if (!t) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    db.run(`
      INSERT INTO certificate_templates (
        name, title, description_template, signature_name, signature_designation,
        signature_name_2, signature_designation_2, signature_image, signature_image_2,
        colors, typography, logo_url, logo_size, logo_position, seal_url,
        watermark_text, border_design, sponsor_logos, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      `${t.name} (Copy)`, t.title, t.description_template, t.signature_name, t.signature_designation,
      t.signature_name_2, t.signature_designation_2, t.signature_image, t.signature_image_2,
      t.colors, t.typography, t.logo_url, t.logo_size, t.logo_position, t.seal_url,
      t.watermark_text, t.border_design, t.sponsor_logos
    ]);

    const newId = db.getLastInsertRowId();
    const cloned = db.get('SELECT * FROM certificate_templates WHERE id = ?', [newId]);

    res.status(201).json({ message: 'Template cloned successfully.', template: cloned });
  } catch (err) {
    console.error('Clone template error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/certificates/templates/:id - delete a template
router.delete('/templates/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const t = db.get('SELECT * FROM certificate_templates WHERE id = ?', [Number(id)]);
    if (!t) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    db.run('DELETE FROM certificate_templates WHERE id = ?', [Number(id)]);
    res.json({ message: 'Template deleted successfully.' });
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── CERTIFICATES ENDPOINTS ───────────────────────────────────────────────────

// GET /api/certificates - search/filter certificates
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, type, status, department, page = 1, limit = 50 } = req.query;

    let sql = 'SELECT * FROM certificates WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (player_name LIKE ? OR cert_id LIKE ? OR roll_number LIKE ? OR team_name LIKE ? OR tournament_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY issued_date DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const certificates = db.all(sql, params);

    res.json({
      certificates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get certificates error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/certificates/:certId/verify - public verification endpoint
router.get('/:certId/verify', (req, res) => {
  try {
    const db = getDb();
    const { certId } = req.params;

    const cert = db.get('SELECT * FROM certificates WHERE cert_id = ?', [certId]);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found or invalid.' });
    }

    res.json({ verified: true, certificate: cert });
  } catch (err) {
    console.error('Verify certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates - generate single certificate (admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const {
      type, player_name, roll_number, team_name, department, tournament_name, tournament_date,
      title, description_text, signature_name, signature_designation, signature_name_2, signature_designation_2,
      signature_image, signature_image_2, colors, typography, logo_url, logo_size, logo_position,
      seal_url, watermark_text, border_design, qr_code_enabled, sponsor_logos, position, award_type, template_id
    } = req.body;

    if (!type || !player_name) {
      return res.status(400).json({ error: 'type and player_name are required.' });
    }

    // Generate unique cert_id
    const shortUuid = uuidv4().split('-')[0].toUpperCase();
    const cert_id = `BE-CERT-${shortUuid}`;
    const issued_date = new Date().toISOString().split('T')[0];

    db.run(`
      INSERT INTO certificates (
        cert_id, type, player_name, roll_number, team_name, department, tournament_name, tournament_date,
        issued_date, title, description_text, signature_name, signature_designation, signature_name_2,
        signature_designation_2, signature_image, signature_image_2, colors, typography, logo_url,
        logo_size, logo_position, seal_url, watermark_text, border_design, qr_code_enabled,
        sponsor_logos, position, award_type, template_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      cert_id, type, player_name, roll_number || null, team_name || null, department || null,
      tournament_name || null, tournament_date || null, issued_date,
      title || null, description_text || null, signature_name || null, signature_designation || null,
      signature_name_2 || null, signature_designation_2 || null, signature_image || null, signature_image_2 || null,
      colors ? JSON.stringify(colors) : null, typography ? JSON.stringify(typography) : null, logo_url || null,
      logo_size ? Number(logo_size) : 80, logo_position || 'top', seal_url || null, watermark_text || null,
      border_design || 'solid', qr_code_enabled !== undefined ? (qr_code_enabled ? 1 : 0) : 1,
      sponsor_logos ? JSON.stringify(sponsor_logos) : null, position || null, award_type || null,
      template_id ? Number(template_id) : null
    ]);

    const id = db.getLastInsertRowId();
    const cert = db.get('SELECT * FROM certificates WHERE id = ?', [id]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'GENERATE_CERT', `Issued ${cert_id} to ${player_name}`, req.ip]
    );

    res.status(201).json({ message: 'Certificate issued successfully.', certificate: cert });
  } catch (err) {
    console.error('Create certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/certificates/:id - update issued certificate fields (admin)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      cert_id, player_name, roll_number, team_name, department, tournament_name, tournament_date,
      title, description_text, signature_name, signature_designation, signature_name_2, signature_designation_2,
      signature_image, signature_image_2, colors, typography, logo_url, logo_size, logo_position,
      seal_url, watermark_text, border_design, qr_code_enabled, sponsor_logos, position, award_type, template_id, status
    } = req.body;

    const cert = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    db.run(`
      UPDATE certificates SET
        cert_id = ?, player_name = ?, roll_number = ?, team_name = ?, department = ?, tournament_name = ?, tournament_date = ?,
        title = ?, description_text = ?, signature_name = ?, signature_designation = ?, signature_name_2 = ?,
        signature_designation_2 = ?, signature_image = ?, signature_image_2 = ?, colors = ?, typography = ?,
        logo_url = ?, logo_size = ?, logo_position = ?, seal_url = ?, watermark_text = ?, border_design = ?,
        qr_code_enabled = ?, sponsor_logos = ?, position = ?, award_type = ?, template_id = ?, status = ?
      WHERE id = ?
    `, [
      cert_id !== undefined ? cert_id : cert.cert_id,
      player_name !== undefined ? player_name : cert.player_name,
      roll_number !== undefined ? roll_number : cert.roll_number,
      team_name !== undefined ? team_name : cert.team_name,
      department !== undefined ? department : cert.department,
      tournament_name !== undefined ? tournament_name : cert.tournament_name,
      tournament_date !== undefined ? tournament_date : cert.tournament_date,
      title !== undefined ? title : cert.title,
      description_text !== undefined ? description_text : cert.description_text,
      signature_name !== undefined ? signature_name : cert.signature_name,
      signature_designation !== undefined ? signature_designation : cert.signature_designation,
      signature_name_2 !== undefined ? signature_name_2 : cert.signature_name_2,
      signature_designation_2 !== undefined ? signature_designation_2 : cert.signature_designation_2,
      signature_image !== undefined ? signature_image : cert.signature_image,
      signature_image_2 !== undefined ? signature_image_2 : cert.signature_image_2,
      colors ? JSON.stringify(colors) : cert.colors,
      typography ? JSON.stringify(typography) : cert.typography,
      logo_url !== undefined ? logo_url : cert.logo_url,
      logo_size !== undefined ? Number(logo_size) : cert.logo_size,
      logo_position !== undefined ? logo_position : cert.logo_position,
      seal_url !== undefined ? seal_url : cert.seal_url,
      watermark_text !== undefined ? watermark_text : cert.watermark_text,
      border_design !== undefined ? border_design : cert.border_design,
      qr_code_enabled !== undefined ? (qr_code_enabled ? 1 : 0) : cert.qr_code_enabled,
      sponsor_logos ? JSON.stringify(sponsor_logos) : cert.sponsor_logos,
      position !== undefined ? position : cert.position,
      award_type !== undefined ? award_type : cert.award_type,
      template_id !== undefined ? Number(template_id) : cert.template_id,
      status !== undefined ? status : cert.status,
      Number(id)
    ]);

    const updated = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'EDIT_CERT', `Edited certificate ${cert.cert_id}`, req.ip]
    );

    res.json({ message: 'Certificate updated successfully.', certificate: updated });
  } catch (err) {
    console.error('Update certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates/:id/duplicate - duplicate certificate (admin)
router.post('/:id/duplicate', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const c = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);
    if (!c) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const shortUuid = uuidv4().split('-')[0].toUpperCase();
    const cert_id = `BE-CERT-${shortUuid}`;
    const issued_date = new Date().toISOString().split('T')[0];

    db.run(`
      INSERT INTO certificates (
        cert_id, type, player_name, roll_number, team_name, department, tournament_name, tournament_date,
        issued_date, title, description_text, signature_name, signature_designation, signature_name_2,
        signature_designation_2, signature_image, signature_image_2, colors, typography, logo_url,
        logo_size, logo_position, seal_url, watermark_text, border_design, qr_code_enabled,
        sponsor_logos, position, award_type, template_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      cert_id, c.type, `${c.player_name} (Copy)`, c.roll_number, c.team_name, c.department, c.tournament_name,
      c.tournament_date, issued_date, c.title, c.description_text, c.signature_name, c.signature_designation,
      c.signature_name_2, c.signature_designation_2, c.signature_image, c.signature_image_2,
      c.colors, c.typography, c.logo_url, c.logo_size, c.logo_position, c.seal_url, c.watermark_text,
      c.border_design, c.qr_code_enabled, c.sponsor_logos, c.position, c.award_type, c.template_id
    ]);

    const newId = db.getLastInsertRowId();
    const duplicated = db.get('SELECT * FROM certificates WHERE id = ?', [newId]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DUPLICATE_CERT', `Duplicated certificate ${c.cert_id} into ${cert_id}`, req.ip]
    );

    res.status(201).json({ message: 'Certificate duplicated.', certificate: duplicated });
  } catch (err) {
    console.error('Duplicate certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates/:id/reissue - reissue certificate (admin)
router.post('/:id/reissue', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const c = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);
    if (!c) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const shortUuid = uuidv4().split('-')[0].toUpperCase();
    const cert_id = `BE-CERT-${shortUuid}`;
    const issued_date = new Date().toISOString().split('T')[0];

    db.transaction(() => {
      // Mark old as reissued
      db.run("UPDATE certificates SET status = 'reissued' WHERE id = ?", [Number(id)]);

      // Insert new reissued active certificate
      db.run(`
        INSERT INTO certificates (
          cert_id, type, player_name, roll_number, team_name, department, tournament_name, tournament_date,
          issued_date, title, description_text, signature_name, signature_designation, signature_name_2,
          signature_designation_2, signature_image, signature_image_2, colors, typography, logo_url,
          logo_size, logo_position, seal_url, watermark_text, border_design, qr_code_enabled,
          sponsor_logos, position, award_type, template_id, reissued_from, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        cert_id, c.type, c.player_name, c.roll_number, c.team_name, c.department, c.tournament_name,
        c.tournament_date, issued_date, c.title, c.description_text, c.signature_name, c.signature_designation,
        c.signature_name_2, c.signature_designation_2, c.signature_image, c.signature_image_2,
        c.colors, c.typography, c.logo_url, c.logo_size, c.logo_position, c.seal_url, c.watermark_text,
        c.border_design, c.qr_code_enabled, c.sponsor_logos, c.position, c.award_type, c.template_id,
        c.cert_id
      ]);
    });

    const newId = db.getLastInsertRowId();
    const reissuedCert = db.get('SELECT * FROM certificates WHERE id = ?', [newId]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'REISSUE_CERT', `Reissued certificate ${c.cert_id} into ${cert_id}`, req.ip]
    );

    res.status(201).json({ message: 'Certificate reissued successfully.', certificate: reissuedCert });
  } catch (err) {
    console.error('Reissue certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/certificates/:id/status - revoke or restore a certificate (admin)
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, revocation_reason } = req.body;

    if (!status || !['active', 'revoked'].includes(status)) {
      return res.status(400).json({ error: 'status must be active or revoked.' });
    }

    const c = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);
    if (!c) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    db.run(
      'UPDATE certificates SET status = ?, revocation_reason = ? WHERE id = ?',
      [status, status === 'revoked' ? (revocation_reason || 'Administrative decision') : null, Number(id)]
    );

    const updated = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'CHANGE_CERT_STATUS', `${status.toUpperCase()} certificate ${c.cert_id}`, req.ip]
    );

    res.json({ message: `Certificate status updated to ${status}.`, certificate: updated });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/certificates/bulk - bulk generate certificates (admin)
router.post('/bulk', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { certificates } = req.body;

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ error: 'certificates array is required.' });
    }

    const created = [];
    const issued_date = new Date().toISOString().split('T')[0];

    db.transaction(() => {
      for (const c of certificates) {
        const shortUuid = uuidv4().split('-')[0].toUpperCase();
        const cert_id = `BE-CERT-${shortUuid}`;

        db.run(`
          INSERT INTO certificates (
            cert_id, type, player_name, roll_number, team_name, department, tournament_name, tournament_date,
            issued_date, title, description_text, signature_name, signature_designation, signature_name_2,
            signature_designation_2, colors, typography, logo_url, logo_size, logo_position, seal_url,
            watermark_text, border_design, qr_code_enabled, sponsor_logos, position, award_type, template_id, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
          cert_id, c.type || 'participation', c.player_name, c.roll_number || null, c.team_name || null,
          c.department || null, c.tournament_name || null, c.tournament_date || null, issued_date,
          c.title || null, c.description_text || null, c.signature_name || null, c.signature_designation || null,
          c.signature_name_2 || null, c.signature_designation_2 || null,
          c.colors ? JSON.stringify(c.colors) : null, c.typography ? JSON.stringify(c.typography) : null,
          c.logo_url || null, c.logo_size ? Number(c.logo_size) : 80, c.logo_position || 'top', c.seal_url || null,
          c.watermark_text || null, c.border_design || 'solid', c.qr_code_enabled !== undefined ? (c.qr_code_enabled ? 1 : 0) : 1,
          c.sponsor_logos ? JSON.stringify(c.sponsor_logos) : null, c.position || null, c.award_type || null,
          c.template_id ? Number(c.template_id) : null
        ]);
        created.push(cert_id);
      }
    });

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'BULK_GENERATE_CERT', `Generated ${created.length} certificates`, req.ip]
    );

    res.status(201).json({
      message: `${created.length} certificates generated.`,
      cert_ids: created,
    });
  } catch (err) {
    console.error('Bulk certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/certificates/:id - delete issued certificate (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const cert = db.get('SELECT * FROM certificates WHERE id = ?', [Number(id)]);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    db.run('DELETE FROM certificates WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DELETE_CERT', `Deleted certificate ${cert.cert_id}`, req.ip]
    );

    res.json({ message: 'Certificate deleted successfully.' });
  } catch (err) {
    console.error('Delete certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/certificates/:certId/download - view/print HTML certificate
router.get('/:certId/download', (req, res) => {
  try {
    const db = getDb();
    const { certId } = req.params;

    const cert = db.get('SELECT * FROM certificates WHERE cert_id = ?', [certId]);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const html = generateCertificateHTML(cert);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${cert.cert_id}.html"`);
    res.send(html);
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
