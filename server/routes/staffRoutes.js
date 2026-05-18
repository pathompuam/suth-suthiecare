const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * 
      FROM staffs
      WHERE is_active = 1
      ORDER BY fullname ASC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'โหลดรายชื่อไม่สำเร็จ'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fullname } = req.body;

    const [result] = await db.query(`
      INSERT INTO staffs(fullname)
      VALUES(?)
    `, [fullname]);

    res.json({
      id: result.insertId,
      fullname
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'เพิ่มรายชื่อไม่สำเร็จ'
    });
  }
});

module.exports = router;