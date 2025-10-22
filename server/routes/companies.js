const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all active companies
router.get('/', async (req, res) => {
  try {
    const companies = await db('companies')
      .select('*')
      .where({ is_active: true })
      .orderBy('name');

    res.json({ companies });
  } catch (error) {
    console.error('Companies fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await db('companies')
      .where({ id, is_active: true })
      .first();

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get recent trades for price history
    const recentTrades = await db('trades')
      .select('price', 'quantity', 'created_at')
      .where({ company_id: id })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({ 
      company,
      recent_trades: recentTrades
    });
  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get trading volume and price stats
    const stats = await db('trades')
      .select(
        db.raw('COUNT(*) as total_trades'),
        db.raw('SUM(quantity) as total_volume'),
        db.raw('AVG(price) as avg_price'),
        db.raw('MIN(price) as min_price'),
        db.raw('MAX(price) as max_price')
      )
      .where({ company_id: id })
      .first();

    // Get latest price
    const latestTrade = await db('trades')
      .select('price', 'created_at')
      .where({ company_id: id })
      .orderBy('created_at', 'desc')
      .first();

    res.json({
      stats: {
        ...stats,
        latest_price: latestTrade?.price || null,
        last_trade_time: latestTrade?.created_at || null
      }
    });
  } catch (error) {
    console.error('Company stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search companies
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const companies = await db('companies')
      .select('*')
      .where({ is_active: true })
      .andWhere(function() {
        this.where('name', 'ilike', `%${query}%`)
            .orWhere('symbol', 'ilike', `%${query}%`)
            .orWhere('sector', 'ilike', `%${query}%`);
      })
      .orderBy('name')
      .limit(20);

    res.json({ companies });
  } catch (error) {
    console.error('Company search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;