const express = require('express');
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');

const router = express.Router();

// Validation error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// POST /expenses
router.post(
  '/',
  [
    body('idempotencyKey').notEmpty().withMessage('idempotencyKey is required'),
    body('amount')
      .notEmpty()
      .isFloat({ gt: 0 })
      .withMessage('Amount must be positive')
      .custom((val) => {
        if (!/^\d+(\.\d{1,2})?$/.test(String(val)))
          throw new Error('Max 2 decimal places');
        return true;
      }),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('date').notEmpty().isISO8601().withMessage('Valid date required'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { idempotencyKey, amount, category, description, date } = req.body;

      // Return existing record if key already used (idempotency)
      const existing = await Expense.findOne({ idempotencyKey });
      if (existing) return res.status(200).json(existing.toJSON());

      const expense = await Expense.create({
        idempotencyKey,
        amount: mongoose.Types.Decimal128.fromString(String(amount)),
        category: category.trim(),
        description: description.trim(),
        date: new Date(date),
      });

      return res.status(201).json(expense.toJSON());
    } catch (err) {
      if (err.code === 11000) {
        const existing = await Expense.findOne({ idempotencyKey: req.body.idempotencyKey });
        return res.status(200).json(existing.toJSON());
      }
      console.error('POST /expenses error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /expenses
router.get(
  '/',
  [
    query('category').optional().trim(),
    query('sort').optional().isIn(['date_desc', 'date_asc']),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { category, sort } = req.query;
      const filter = {};
      if (category) {
        filter.category = {
          $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        };
      }

      const sortOrder = sort === 'date_asc' ? 1 : -1;
      const expenses = await Expense.find(filter)
        .sort({ date: sortOrder, createdAt: sortOrder })
        .lean({ transform: false });

      const serialised = expenses.map((e) => ({
        id: e._id,
        idempotencyKey: e.idempotencyKey,
        amount: e.amount.toString(),
        category: e.category,
        description: e.description,
        date: e.date,
        createdAt: e.createdAt,
      }));

      return res.status(200).json(serialised);
    } catch (err) {
      console.error('GET /expenses error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /expenses/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Expense.distinct('category');
    return res.status(200).json(categories.sort());
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;