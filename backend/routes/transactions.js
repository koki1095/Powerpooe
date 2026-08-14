const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

// Get all transactions (with optional filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, entry_kind, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT t.*, d.name AS debt_name
      FROM transactions t
      LEFT JOIN debts d ON d.id = t.debt_id
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (type) {
      queryText += ` AND t.type = $${idx++}`;
      params.push(type);
    }

    if (category) {
      queryText += ` AND t.category = $${idx++}`;
      params.push(category);
    }

    if (entry_kind) {
      queryText += ` AND t.entry_kind = $${idx++}`;
      params.push(entry_kind);
    }

    queryText += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create transaction
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('entry_kind').optional().isIn(['expense', 'debt_payment']).withMessage('entry_kind must be expense or debt_payment'),
  body('debt_id').optional({ nullable: true }).isUUID().withMessage('debt_id must be a valid UUID'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').optional(),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
], validate, auth, async (req, res) => {
  try {
    const {
      amount,
      type,
      category,
      description,
      date,
      entry_kind = 'expense',
      debt_id = null,
    } = req.body;

    if (entry_kind === 'debt_payment' && type !== 'expense') {
      return res.status(400).json({ error: 'debt_payment entries must use type=expense' });
    }

    if (entry_kind === 'debt_payment' && !debt_id) {
      return res.status(400).json({ error: 'debt_id is required when entry_kind is debt_payment' });
    }

    if (entry_kind === 'debt_payment' && debt_id) {
      const debtCheck = await pool.query(
        'SELECT id, balance FROM debts WHERE id = $1 AND user_id = $2',
        [debt_id, req.userId]
      );
      if (debtCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Linked debt not found' });
      }
      if (Number(debtCheck.rows[0].balance) <= 0) {
        return res.status(400).json({ error: 'Linked debt is already paid off/closed' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(
        `INSERT INTO transactions (user_id, amount, type, entry_kind, debt_id, category, description, date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [req.userId, amount, type, entry_kind, debt_id, category, description, date || new Date()]
      );

      if (entry_kind === 'debt_payment' && debt_id) {
        await client.query(
          `UPDATE debts
           SET balance = GREATEST(balance - $1, 0)
           WHERE id = $2 AND user_id = $3`,
          [amount, debt_id, req.userId]
        );
      }

      const withDebtName = await client.query(
        `SELECT t.*, d.name AS debt_name
         FROM transactions t
         LEFT JOIN debts d ON d.id = t.debt_id
         WHERE t.id = $1`,
        [insertResult.rows[0].id]
      );

      await client.query('COMMIT');
      res.status(201).json(withDebtName.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      type,
      entry_kind,
      debt_id,
      category,
      description,
      date,
    } = req.body;

    const existing = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldTx = existing.rows[0];

    const nextType = type !== undefined ? type : oldTx.type;
    const nextEntryKind = entry_kind !== undefined ? entry_kind : oldTx.entry_kind;
    const nextDebtId = debt_id !== undefined ? (debt_id || null) : oldTx.debt_id;
    const nextAmount = amount !== undefined ? Number(amount) : Number(oldTx.amount);

    if (nextEntryKind === 'debt_payment' && nextType !== 'expense') {
      return res.status(400).json({ error: 'debt_payment entries must use type=expense' });
    }

    if (nextEntryKind === 'debt_payment' && !nextDebtId) {
      return res.status(400).json({ error: 'debt_id is required when entry_kind is debt_payment' });
    }

    if (nextEntryKind === 'debt_payment' && nextDebtId) {
      const debtCheck = await pool.query(
        'SELECT id, balance FROM debts WHERE id = $1 AND user_id = $2',
        [nextDebtId, req.userId]
      );
      if (debtCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Linked debt not found' });
      }

      const oldDebtId = oldTx.debt_id ? String(oldTx.debt_id) : null;
      const nextDebtIdStr = nextDebtId ? String(nextDebtId) : null;
      const oldIsSameDebt = oldTx.entry_kind === 'debt_payment' && oldDebtId === nextDebtIdStr;
      const effectiveBalance = oldIsSameDebt
        ? Number(debtCheck.rows[0].balance) + Number(oldTx.amount)
        : Number(debtCheck.rows[0].balance);

      if (effectiveBalance <= 0) {
        return res.status(400).json({ error: 'Linked debt is already paid off/closed' });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      params.push(amount);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      params.push(type);
    }
    if (entry_kind !== undefined) {
      updates.push(`entry_kind = $${paramCount++}`);
      params.push(entry_kind);
    }
    if (debt_id !== undefined) {
      updates.push(`debt_id = $${paramCount++}`);
      params.push(debt_id);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      params.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      params.push(date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (oldTx.entry_kind === 'debt_payment' && oldTx.debt_id) {
        await client.query(
          `UPDATE debts
           SET balance = balance + $1
           WHERE id = $2 AND user_id = $3`,
          [oldTx.amount, oldTx.debt_id, req.userId]
        );
      }

      params.push(id, req.userId);

      const updated = await client.query(
        `UPDATE transactions
         SET ${updates.join(', ')}
         WHERE id = $${paramCount++} AND user_id = $${paramCount}
         RETURNING *`,
        params
      );

      if (nextEntryKind === 'debt_payment' && nextDebtId) {
        await client.query(
          `UPDATE debts
           SET balance = GREATEST(balance - $1, 0)
           WHERE id = $2 AND user_id = $3`,
          [nextAmount, nextDebtId, req.userId]
        );
      }

      await client.query('COMMIT');
      res.json(updated.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = existing.rows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );

      if (tx.entry_kind === 'debt_payment' && tx.debt_id) {
        await client.query(
          `UPDATE debts
           SET balance = balance + $1
           WHERE id = $2 AND user_id = $3`,
          [tx.amount, tx.debt_id, req.userId]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Transaction deleted' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [req.userId];
    
    if (start_date && end_date) {
      dateFilter = 'AND date >= $2 AND date <= $3';
      params.push(start_date, end_date);
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      dateFilter = 'AND date >= $2 AND date <= $3';
      params.push(firstDay, lastDay);
    }
    
    const txResult = await pool.query(
      `SELECT 
        type, 
        SUM(amount) as total 
      FROM transactions 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY type`,
      params
    );

    const incomeStreamsResult = await pool.query(
      `SELECT COALESCE(SUM(monthly_amount), 0) AS total_monthly_income
       FROM income_streams
       WHERE user_id = $1 AND is_active = true`,
      [req.userId]
    );
    
    const summary = {
      income: 0,
      expense: 0,
      balance: 0,
    };
    
    txResult.rows.forEach(row => {
      if (row.type === 'income') {
        summary.income = parseFloat(row.total);
      } else if (row.type === 'expense') {
        summary.expense = parseFloat(row.total);
      }
    });

    const streamsIncome = parseFloat(incomeStreamsResult.rows[0]?.total_monthly_income || 0);
    summary.income += streamsIncome;
    
    summary.balance = summary.income - summary.expense;
    summary.savings_rate = summary.income > 0 ? ((summary.income - summary.expense) / summary.income) * 100 : 0;
    
    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
