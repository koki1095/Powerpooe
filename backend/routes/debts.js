const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const pool = require('../config/database');
const validate = require('../middleware/validation');
const auth = require('../middleware/auth');

const ALLOWED_METHODS = ['snowball', 'avalanche', 'urgency'];
const ALLOWED_DEBT_CATEGORIES = [
  'credit_card',
  'vehicle_finance',
  'personal_loan',
  'student_loan',
  'mortgage',
  'medical',
  'other',
];
const ALLOWED_TERM_TYPES = ['short_term', 'medium_term', 'long_term'];

function getDaysToNextDue(dueDay) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const clampDueDay = Math.max(1, Math.min(31, Number(dueDay) || 1));
  const thisMonthLastDay = new Date(year, month + 1, 0).getDate();
  const dueThisMonthDay = Math.min(clampDueDay, thisMonthLastDay);

  let dueDate = new Date(year, month, dueThisMonthDay);
  dueDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) {
    const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
    const dueNextMonthDay = Math.min(clampDueDay, nextMonthLastDay);
    dueDate = new Date(year, month + 1, dueNextMonthDay);
    dueDate.setHours(0, 0, 0, 0);
  }

  const ms = dueDate - today;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getDaysToTarget(targetPayoffDate) {
  if (!targetPayoffDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetPayoffDate);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function parseDebtNotesMeta(notes) {
  const raw = String(notes || '');
  const targetMatch = raw.match(/target_payoff_date:([^;|]*)/i);
  const dueDayMatch = raw.match(/due_day:([^;|]*)/i);

  return {
    target_payoff_date: targetMatch?.[1]?.trim() || null,
    due_day: dueDayMatch?.[1] ? Number(dueDayMatch[1]) : null,
  };
}

function urgencyScore(debt) {
  const meta = parseDebtNotesMeta(debt.notes);
  const dueDay = meta.due_day || (debt.due_date ? new Date(debt.due_date).getDate() : 1);
  const dueDays = getDaysToNextDue(dueDay);
  const targetDays = getDaysToTarget(meta.target_payoff_date);

  const duePressure = 1 / (dueDays + 1);
  const targetPressure = targetDays === null ? 0 : (targetDays <= 0 ? 2 : 1 / (targetDays + 1));
  const aprPressure = (Number(debt.apr ?? debt.interest_rate_apr) || 0) / 100;
  const balancePressure =
    (Number(debt.balance) || 0) > 0 ? Math.log10(Number(debt.balance) + 1) / 10 : 0;

  return (duePressure * 0.45) + (targetPressure * 0.35) + (aprPressure * 0.15) + (balancePressure * 0.05);
}

function estimatePayoffMonths(balance, apr, payment) {
  const B = Number(balance) || 0;
  const r = (Number(apr) || 0) / 100 / 12;
  const P = Number(payment) || 0;

  if (B <= 0) return 0;
  if (P <= 0) return null;

  if (r === 0) return Math.ceil(B / P);
  if (P <= B * r) return null;

  const months = -Math.log(1 - (B * r) / P) / Math.log(1 + r);
  return Math.ceil(months);
}

function estimateInterest(balance, apr, payment, months) {
  const B = Number(balance) || 0;
  const r = (Number(apr) || 0) / 100 / 12;
  const P = Number(payment) || 0;
  const n = Number(months);

  if (!Number.isFinite(n) || n === null) return null;
  if (B <= 0 || P <= 0) return 0;

  let remaining = B;
  let totalInterest = 0;

  for (let i = 0; i < n; i++) {
    const interest = remaining * r;
    totalInterest += interest;
    remaining = Math.max(0, remaining + interest - P);
    if (remaining <= 0) break;
  }

  return Number(totalInterest.toFixed(2));
}

function addMonthsToDate(months) {
  if (months === null || months === undefined || !Number.isFinite(months)) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString().split('T')[0];
}

function enrichDebt(d) {
  const meta = parseDebtNotesMeta(d.notes);
  const balance = Number(d.balance);
  const apr = Number(d.apr ?? d.interest_rate_apr ?? 0);
  const minimumPayment = Number(d.minimum_payment);
  const monthlyInterestAmount = Number((balance * ((apr / 100) / 12)).toFixed(2));
  const projectedMonths = estimatePayoffMonths(balance, apr, minimumPayment);
  const projectedCompletionDate = addMonthsToDate(projectedMonths);

  // Provide normalized fields for the frontend regardless of schema version.
  // Legacy schema derives target/due from `notes`.
  return {
    ...d,
    balance,
    apr,
    interest_rate_apr: apr,
    due_day: meta.due_day || (d.due_date ? new Date(d.due_date).getDate() : null),
    target_payoff_date: meta.target_payoff_date,
    minimum_payment: minimumPayment,
    monthly_interest_amount: monthlyInterestAmount,
    projected_months_to_payoff: projectedMonths,
    projected_completion_date: projectedCompletionDate,
  };
}

// Get all debts
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows.map(enrichDebt));
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create debt
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('balance').isFloat({ min: 0 }).withMessage('Balance must be >= 0'),
    body('minimum_payment').isFloat({ min: 0 }).withMessage('Minimum payment must be >= 0'),
    body('interest_rate_apr').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('interest_rate_apr must be >= 0'),
    body('due_day').optional({ nullable: true }).isInt({ min: 1, max: 31 }).withMessage('due_day must be between 1 and 31'),
    body('target_payoff_date').optional({ nullable: true }).isISO8601().withMessage('Invalid target payoff date'),
    body('debt_type').optional().isString().withMessage('Debt type must be text'),
    body('debt_category').optional().isIn(ALLOWED_DEBT_CATEGORIES).withMessage('Invalid debt category'),
    body('term_type').optional().isIn(ALLOWED_TERM_TYPES).withMessage('Invalid term type'),
  ],
  validate,
  auth,
  async (req, res) => {
    try {
      const {
        name,
        balance,
        minimum_payment,
        interest_rate_apr,
        due_day,
        target_payoff_date = null,
        debt_category = 'other',
        term_type = 'medium_term',
      } = req.body;

      const normalizedApr = Number(interest_rate_apr ?? 0);

      // Legacy schema expects due_date; compute it from due_day.
      const normalizedDueDay = Number(due_day ?? 1);
      const dt = new Date();
      const year = dt.getFullYear();
      const month = dt.getMonth();
      const thisMonthLastDay = new Date(year, month + 1, 0).getDate();
      const dueThisMonthDay = Math.min(Math.max(1, normalizedDueDay), thisMonthLastDay);
      let dueDate = new Date(year, month, dueThisMonthDay);
      dueDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
        const dueNextMonthDay = Math.min(Math.max(1, normalizedDueDay), nextMonthLastDay);
        dueDate = new Date(year, month + 1, dueNextMonthDay);
        dueDate.setHours(0, 0, 0, 0);
      }

      const notes = `target_payoff_date:${target_payoff_date || ''};due_day:${normalizedDueDay || ''}`;

      const result = await pool.query(
        `INSERT INTO debts
          (user_id, name, balance, minimum_payment, apr, due_date, debt_category, term_type, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open',$9)
         RETURNING *`,
        [
          req.userId,
          name,
          balance,
          minimum_payment,
          normalizedApr,
          dueDate.toISOString().split('T')[0],
          debt_category,
          term_type,
          notes,
        ]
      );

      res.status(201).json(enrichDebt(result.rows[0]));
    } catch (error) {
      console.error('Create debt error:', error);
      res.status(500).json({
        error: 'Server error',
        details: error?.message || 'Unknown error',
        code: error?.code,
      });
    }
  }
);

function deriveDueDateFromDueDay(dueDay) {
  const dd = Math.min(Math.max(1, Number(dueDay) || 1), 31);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthLastDay = new Date(year, month + 1, 0).getDate();
  const dueThisMonthDay = Math.min(dd, thisMonthLastDay);

  let dueDate = new Date(year, month, dueThisMonthDay);
  dueDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) {
    const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
    const dueNextMonthDay = Math.min(dd, nextMonthLastDay);
    dueDate = new Date(year, month + 1, dueNextMonthDay);
    dueDate.setHours(0, 0, 0, 0);
  }

  return dueDate.toISOString().split('T')[0];
}

// Update debt (legacy DB: apr/due_date/status/notes)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      balance,
      minimum_payment,
      interest_rate_apr,
      apr,
      due_day,
      target_payoff_date,
      debt_category,
      term_type,
    } = req.body;

    const check = await pool.query(
      'SELECT id, notes, due_date FROM debts WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    const existingNotes = check.rows[0].notes || '';
    const meta = parseDebtNotesMeta(existingNotes);

    const updates = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (balance !== undefined) {
      updates.push(`balance = $${idx++}`);
      params.push(balance);
    }
    if (minimum_payment !== undefined) {
      updates.push(`minimum_payment = $${idx++}`);
      params.push(minimum_payment);
    }
    const nextApr = interest_rate_apr ?? apr;
    if (nextApr !== undefined) {
      updates.push(`apr = $${idx++}`);
      params.push(nextApr);
    }

    if (due_day !== undefined) {
      updates.push(`due_date = $${idx++}`);
      params.push(deriveDueDateFromDueDay(due_day));
    }

    const nextTarget = target_payoff_date !== undefined ? target_payoff_date : meta.target_payoff_date;
    const nextDueDayMeta = due_day !== undefined ? due_day : meta.due_day;

    if (target_payoff_date !== undefined || due_day !== undefined) {
      const notes = `target_payoff_date:${nextTarget || ''};due_day:${nextDueDayMeta || ''}`;
      updates.push(`notes = $${idx++}`);
      params.push(notes);
    }

    if (debt_category !== undefined) {
      updates.push(`debt_category = $${idx++}`);
      params.push(debt_category);
    }
    if (term_type !== undefined) {
      updates.push(`term_type = $${idx++}`);
      params.push(term_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id, req.userId);

    const result = await pool.query(
      `UPDATE debts SET ${updates.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      params
    );

    res.json(enrichDebt(result.rows[0]));
  } catch (error) {
    console.error('Update debt error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete debt
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    res.json({ message: 'Debt deleted' });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Strategy endpoint
router.get(
  '/strategy',
  [
    query('method').optional().isIn(ALLOWED_METHODS).withMessage('method must be snowball, avalanche, or urgency'),
    query('monthly_budget').optional().isFloat({ min: 0 }).withMessage('monthly_budget must be >= 0'),
  ],
  validate,
  auth,
  async (req, res) => {
    try {
      const method = (req.query.method || 'snowball').toLowerCase();
      const monthlyBudget = Number(req.query.monthly_budget || 0);

      const result = await pool.query(
        'SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at ASC',
        [req.userId]
      );

      const debts = result.rows.map((d) => {
        const e = enrichDebt(d);
        return {
          ...d,
          ...e,
          balance: Number(e.balance),
          minimum_payment: Number(e.minimum_payment),
          interest_rate_apr: Number(e.interest_rate_apr),
        };
      });

      let ordered = [...debts];

      if (method === 'snowball') {
        ordered.sort((a, b) => a.balance - b.balance || b.interest_rate_apr - a.interest_rate_apr);
      } else if (method === 'avalanche') {
        ordered.sort((a, b) => b.interest_rate_apr - a.interest_rate_apr || a.balance - b.balance);
      } else {
        ordered.sort((a, b) => urgencyScore(b) - urgencyScore(a));
      }

      const totalMinimums = ordered.reduce((sum, d) => sum + d.minimum_payment, 0);
      let extra = Math.max(0, monthlyBudget - totalMinimums);

      const allocations = ordered.map((d, i) => {
        const extraForDebt = i === 0 ? extra : 0;
        const recommendedPayment = d.minimum_payment + extraForDebt;
        const payoffMonths = estimatePayoffMonths(d.balance, d.interest_rate_apr, recommendedPayment);
        const estimatedInterest = estimateInterest(d.balance, d.interest_rate_apr, recommendedPayment, payoffMonths);
        const monthlyInterestAmount = Number((d.balance * ((d.interest_rate_apr / 100) / 12)).toFixed(2));

        return {
          id: d.id,
          name: d.name,
          debt_type: d.debt_type,
          debt_category: d.debt_category || 'other',
          term_type: d.term_type || 'medium_term',
          balance: d.balance,
          minimum_payment: d.minimum_payment,
          interest_rate_apr: d.interest_rate_apr,
          due_day: d.due_day,
          target_payoff_date: d.target_payoff_date,
          priority_rank: i + 1,
          recommended_payment: Number(recommendedPayment.toFixed(2)),
          projected_payoff_months: payoffMonths,
          projected_completion_date: addMonthsToDate(payoffMonths),
          estimated_interest: estimatedInterest,
          monthly_interest_amount: monthlyInterestAmount,
        };
      });

      const totalEstimatedInterest = allocations.reduce(
        (sum, item) => sum + (item.estimated_interest || 0),
        0
      );

      res.json({
        method,
        monthly_budget: monthlyBudget,
        total_minimum_payments: Number(totalMinimums.toFixed(2)),
        extra_budget_applied_to_top_priority: Number(extra.toFixed(2)),
        debts_count: debts.length,
        payoff_order: allocations,
        total_estimated_interest: Number(totalEstimatedInterest.toFixed(2)),
      });
    } catch (error) {
      console.error('Debt strategy error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
