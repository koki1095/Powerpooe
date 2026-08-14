const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

// Get all goals
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create goal
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('target_amount').isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
  body('current_amount').optional().isFloat({ min: 0 }).withMessage('Current amount must be positive'),
  body('deadline').optional().isISO8601().withMessage('Invalid date format'),
], validate, auth, async (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, deadline } = req.body;
    
    const result = await pool.query(
      'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, name, target_amount, current_amount, deadline]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update goal (typically to update current_amount)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline, completed } = req.body;
    
    // Check ownership
    const check = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (target_amount !== undefined) {
      updates.push(`target_amount = $${paramCount++}`);
      params.push(target_amount);
    }
    if (current_amount !== undefined) {
      updates.push(`current_amount = $${paramCount++}`);
      params.push(current_amount);
    }
    if (deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      params.push(deadline);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      params.push(completed);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id, req.userId);
    
    const result = await pool.query(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      params
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Transfer to goal (from excess income)
router.post('/:id/transfer', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Get current goal
    const goalResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = goalResult.rows[0];
    const newAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    const newCompleted = newAmount >= parseFloat(goal.target_amount);
    
    // Update goal
    const result = await pool.query(
      'UPDATE goals SET current_amount = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [newAmount, newCompleted, id, req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Transfer to goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get goals summary
router.get('/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN completed THEN 1 END) as completed_goals,
        SUM(target_amount) as total_target,
        SUM(current_amount) as total_saved
      FROM goals 
      WHERE user_id = $1`,
      [req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get goals summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
