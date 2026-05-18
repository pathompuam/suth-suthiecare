const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all active clinics
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clinics WHERE is_active = 1 ORDER BY id ASC');
        res.json({ data: rows });
    } catch (error) {
        console.error('Error fetching clinics:', error);
        res.status(500).json({ error: 'Failed to fetch clinics' });
    }
});

// Get all clinics (for admin)
router.get('/all', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clinics ORDER BY id ASC');
        res.json({ data: rows });
    } catch (error) {
        console.error('Error fetching all clinics:', error);
        res.status(500).json({ error: 'Failed to fetch all clinics' });
    }
});

// Get clinic by id or slug
router.get('/:idOrSlug', async (req, res) => {
    try {
        const param = req.params.idOrSlug;
        let sql = 'SELECT * FROM clinics WHERE ';
        let vals = [];
        
        if (!isNaN(param)) {
             sql += 'id = ?';
             vals.push(param);
        } else {
             sql += 'slug = ?';
             vals.push(param);
        }
        
        const [rows] = await db.query(sql, vals);
        if (rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
        
        res.json({ data: rows[0] });
    } catch (error) {
        console.error('Error fetching clinic:', error);
        res.status(500).json({ error: 'Failed to fetch clinic' });
    }
});

// Create new clinic
router.post('/', async (req, res) => {
    try {
        const { slug, name, description, image, bg, is_active, show_icon } = req.body;
        
        // Basic validation
        if (!slug || !name) {
            return res.status(400).json({ error: 'Slug and name are required' });
        }

        const [result] = await db.query(
            'INSERT INTO clinics (slug, name, description, image, bg, is_active, show_icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [slug, name, description || null, image || null, bg || null, is_active !== undefined ? is_active : 1, show_icon !== undefined ? show_icon : 1]
        );
        res.status(201).json({ message: 'Clinic created', id: result.insertId });
    } catch (error) {
        console.error('Error creating clinic:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create clinic' });
    }
});

// Update clinic
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { slug, name, description, image, bg, is_active, show_icon } = req.body;
        
        if (!slug || !name) {
            return res.status(400).json({ error: 'Slug and name are required' });
        }

        const [result] = await db.query(
            'UPDATE clinics SET slug=?, name=?, description=?, image=?, bg=?, is_active=?, show_icon=? WHERE id=?',
            [slug, name, description || null, image || null, bg || null, is_active, show_icon !== undefined ? show_icon : 1, id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Clinic not found' });
        res.json({ message: 'Clinic updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to update clinic' });
    }
});

// Delete clinic
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM clinics WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Clinic not found' });
        res.json({ message: 'Clinic deleted successfully' });
    } catch (error) {
        console.error('Error deleting clinic:', error);
        res.status(500).json({ error: 'Failed to delete clinic' });
    }
});

module.exports = router;;