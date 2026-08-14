const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

// Get estate plan
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM estate_plans WHERE user_id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      // Create default estate plan if none exists
      const newPlan = await pool.query(
        'INSERT INTO estate_plans (user_id) VALUES ($1) RETURNING *',
        [req.userId]
      );
      return res.json(newPlan.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get estate plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update estate plan
router.put('/', [
  body('has_will').optional().isBoolean(),
  body('has_trust').optional().isBoolean(),
  body('insurance_provider').optional(),
  body('coverage_amount').optional().isFloat({ min: 0 }),
  body('documents').optional().isArray(),
], validate, auth, async (req, res) => {
  try {
    const { has_will, has_trust, insurance_provider, coverage_amount, documents } = req.body;
    
    // Check if estate plan exists
    const existing = await pool.query(
      'SELECT id FROM estate_plans WHERE user_id = $1',
      [req.userId]
    );
    
    let result;
    
    if (existing.rows.length === 0) {
      // Create new estate plan
      result = await pool.query(
        'INSERT INTO estate_plans (user_id, has_will, has_trust, insurance_provider, coverage_amount, documents) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.userId, has_will || false, has_trust || false, insurance_provider, coverage_amount, JSON.stringify(documents || [])]
      );
    } else {
      // Update existing
      const updates = [];
      const params = [];
      let paramCount = 1;
      
      if (has_will !== undefined) {
        updates.push(`has_will = $${paramCount++}`);
        params.push(has_will);
      }
      if (has_trust !== undefined) {
        updates.push(`has_trust = $${paramCount++}`);
        params.push(has_trust);
      }
      if (insurance_provider !== undefined) {
        updates.push(`insurance_provider = $${paramCount++}`);
        params.push(insurance_provider);
      }
      if (coverage_amount !== undefined) {
        updates.push(`coverage_amount = $${paramCount++}`);
        params.push(coverage_amount);
      }
      if (documents !== undefined) {
        updates.push(`documents = $${paramCount++}`);
        params.push(JSON.stringify(documents));
      }
      
      updates.push('updated_at = NOW()');
      
      params.push(req.userId);
      
      result = await pool.query(
        `UPDATE estate_plans SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        params
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update estate plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add document to estate plan
router.post('/documents', auth, async (req, res) => {
  try {
    const { file_path, file_name, file_type } = req.body;
    
    if (!file_path) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Get current documents
    const current = await pool.query(
      'SELECT documents FROM estate_plans WHERE user_id = $1',
      [req.userId]
    );
    
    let documents = [];
    if (current.rows.length > 0 && current.rows[0].documents) {
      documents = current.rows[0].documents;
    }
    
    // Add new document
    documents.push({
      id: require('uuid').v4(),
      file_path,
      file_name: file_name || file_path.split('/').pop(),
      file_type,
      uploaded_at: new Date().toISOString(),
    });
    
    // Update
    const result = await pool.query(
      'UPDATE estate_plans SET documents = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [JSON.stringify(documents), req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove document from estate plan
router.delete('/documents/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Get current documents
    const current = await pool.query(
      'SELECT documents FROM estate_plans WHERE user_id = $1',
      [req.userId]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Estate plan not found' });
    }
    
    let documents = current.rows[0].documents || [];
    
    // Filter out the document
    documents = documents.filter(doc => doc.id !== documentId);
    
    // Update
    const result = await pool.query(
      'UPDATE estate_plans SET documents = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [JSON.stringify(documents), req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Remove document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
