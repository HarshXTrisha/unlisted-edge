const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await db('users')
      .select('wallet_balance')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.wallet_balance });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add funds to wallet (deposit)
router.post('/deposit', authenticateToken, [
  body('amount').isFloat({ min: 1, max: 100000 })
], async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await trx.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
    const userId = req.user.userId;

    // Update wallet balance
    await trx('users')
      .where({ id: userId })
      .increment('wallet_balance', amount);

    // Create transaction record (you might want to create a transactions table)
    // For now, we'll just return success

    await trx.commit();

    // Get updated balance
    const user = await db('users')
      .select('wallet_balance')
      .where({ id: userId })
      .first();

    res.json({
      message: 'Funds added successfully',
      new_balance: user.wallet_balance,
      amount_added: amount
    });
  } catch (error) {
    await trx.rollback();
    console.error('Wallet deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw funds from wallet
router.post('/withdraw', authenticateToken, [
  body('amount').isFloat({ min: 1 })
], async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await trx.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
    const userId = req.user.userId;

    // Check current balance
    const user = await trx('users')
      .select('wallet_balance')
      .where({ id: userId })
      .first();

    if (!user) {
      await trx.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wallet_balance < amount) {
      await trx.rollback();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Update wallet balance
    await trx('users')
      .where({ id: userId })
      .decrement('wallet_balance', amount);

    await trx.commit();

    // Get updated balance
    const updatedUser = await db('users')
      .select('wallet_balance')
      .where({ id: userId })
      .first();

    res.json({
      message: 'Withdrawal successful',
      new_balance: updatedUser.wallet_balance,
      amount_withdrawn: amount
    });
  } catch (error) {
    await trx.rollback();
    console.error('Wallet withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get wallet transaction history (simplified)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    // Get recent trades as transaction history
    const transactions = await db('trades')
      .select(
        'trades.*',
        'companies.name as company_name',
        'companies.symbol',
        db.raw(`CASE 
          WHEN trades.buyer_id = ? THEN 'BUY'
          WHEN trades.seller_id = ? THEN 'SELL'
          END as transaction_type`),
        db.raw(`CASE 
          WHEN trades.buyer_id = ? THEN -trades.total_amount
          WHEN trades.seller_id = ? THEN trades.total_amount
          END as amount_change`)
      )
      .join('companies', 'trades.company_id', 'companies.id')
      .where(function() {
        this.where('trades.buyer_id', userId)
            .orWhere('trades.seller_id', userId);
      })
      .orderBy('trades.created_at', 'desc')
      .limit(parseInt(limit));

    res.json({ transactions });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;