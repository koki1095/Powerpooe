const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

// Get all income streams
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM income_streams WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get income streams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create income stream
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('monthly_amount').isFloat({ min: 0.01 }).withMessage('Monthly amount must be greater than 0'),
  body('category').notEmpty().withMessage('Category is required'),
], validate, auth, async (req, res) => {
  try {
    const { name, monthly_amount, category } = req.body;
    
    const result = await pool.query(
      'INSERT INTO income_streams (user_id, name, monthly_amount, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, monthly_amount, category]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create income stream error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update income stream
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, monthly_amount, category, is_active } = req.body;
    
    // Check ownership
    const check = await pool.query(
      'SELECT id FROM income_streams WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Income stream not found' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (monthly_amount !== undefined) {
      updates.push(`monthly_amount = $${paramCount++}`);
      params.push(monthly_amount);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      params.push(category);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id, req.userId);
    
    const result = await pool.query(
      `UPDATE income_streams SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      params
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update income stream error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete income stream
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM income_streams WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Income stream not found' });
    }
    
    res.json({ message: 'Income stream deleted' });
  } catch (error) {
    console.error('Delete income stream error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get income streams summary
router.get('/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_streams,
        SUM(CASE WHEN is_active THEN monthly_amount ELSE 0 END) as total_monthly_income
      FROM income_streams 
      WHERE user_id = $1`,
      [req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get income streams summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get income diversification (for pie chart)
router.get('/diversification', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        category, 
        SUM(monthly_amount) as total,
        COUNT(*) as count
      FROM income_streams 
      WHERE user_id = $1 AND is_active = true
      GROUP BY category
      ORDER BY total DESC`,
      [req.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get diversification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
