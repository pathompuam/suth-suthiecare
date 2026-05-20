const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ PATCH ต้องอยู่บนสุด ก่อน /:idOrSlug
router.patch('/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order array is required' });
    }
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of order) {
        await conn.query(
          'UPDATE clinics SET sort_order = ? WHERE id = ?',
          [item.sort_order, item.id]
        );
      }
      await conn.commit();
      res.json({ message: 'Reordered successfully' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error reordering clinics:', error);
    res.status(500).json({ error: 'Failed to reorder clinics' });
  }
});

// ✅ ORDER BY sort_order แล้ว
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM clinics WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// ✅ ORDER BY sort_order แล้ว
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM clinics ORDER BY sort_order ASC, id ASC'
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all clinics' });
  }
});

// ต้องอยู่หลัง /reorder และ /all เสมอ
router.get('/:idOrSlug', async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const sql = `SELECT * FROM clinics WHERE ${!isNaN(param) ? 'id' : 'slug'} = ?`;
    const [rows] = await db.query(sql, [param]);
    if (rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
});

// ✅ INSERT ใส่ sort_order ด้วย
router.post('/', async (req, res) => {
  try {
    const { slug, name, description, image, bg, is_active, show_icon } = req.body;
    if (!slug || !name) return res.status(400).json({ error: 'Slug and name are required' });

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM clinics');

    const [result] = await db.query(
      'INSERT INTO clinics (slug, name, description, image, bg, is_active, show_icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [slug, name, description || null, image || null, bg || null,
       is_active ?? 1, show_icon ?? 1, count]
    );
    res.status(201).json({ message: 'Clinic created', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, description, image, bg, is_active, show_icon } = req.body;
    if (!slug || !name) return res.status(400).json({ error: 'Slug and name are required' });

    const [result] = await db.query(
      'UPDATE clinics SET slug=?, name=?, description=?, image=?, bg=?, is_active=?, show_icon=? WHERE id=?',
      [slug, name, description || null, image || null, bg || null, is_active, show_icon ?? 1, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json({ message: 'Clinic updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Failed to update clinic' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM clinics WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json({ message: 'Clinic deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete clinic' });
  }
});

module.exports = router;