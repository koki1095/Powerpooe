const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

// Get all investments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create investment
router.post('/', [
  body('ticker').notEmpty().withMessage('Ticker is required'),
  body('shares').isFloat({ min: 0.0001 }).withMessage('Shares must be greater than 0'),
  body('purchase_price').isFloat({ min: 0.01 }).withMessage('Purchase price must be greater than 0'),
  body('purchase_date').optional().isISO8601().withMessage('Invalid date format'),
], validate, auth, async (req, res) => {
  try {
    const { ticker, shares, purchase_price, purchase_date } = req.body;
    
    const result = await pool.query(
      'INSERT INTO investments (user_id, ticker, shares, purchase_price, purchase_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, ticker.toUpperCase(), shares, purchase_price, purchase_date || new Date()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update investment
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ticker, shares, purchase_price, purchase_date } = req.body;
    
    // Check ownership
    const check = await pool.query(
      'SELECT id FROM investments WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (ticker !== undefined) {
      updates.push(`ticker = $${paramCount++}`);
      params.push(ticker.toUpperCase());
    }
    if (shares !== undefined) {
      updates.push(`shares = $${paramCount++}`);
      params.push(shares);
    }
    if (purchase_price !== undefined) {
      updates.push(`purchase_price = $${paramCount++}`);
      params.push(purchase_price);
    }
    if (purchase_date !== undefined) {
      updates.push(`purchase_date = $${paramCount++}`);
      params.push(purchase_date);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id, req.userId);
    
    const result = await pool.query(
      `UPDATE investments SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      params
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete investment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    res.json({ message: 'Investment deleted' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get portfolio summary
router.get('/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_holdings,
        SUM(shares * purchase_price) as total_invested
      FROM investments 
      WHERE user_id = $1`,
      [req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get investments summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
