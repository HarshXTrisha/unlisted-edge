const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user portfolio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const portfolio = await db('portfolios')
      .select(
        'portfolios.*',
        'companies.name as company_name',
        'companies.symbol',
        'companies.current_price',
        'companies.sector'
      )
      .join('companies', 'portfolios.company_id', 'companies.id')
      .where('portfolios.user_id', userId)
      .orderBy('portfolios.total_invested', 'desc');

    // Calculate portfolio metrics
    let totalInvested = 0;
    let currentValue = 0;
    
    const enrichedPortfolio = portfolio.map(holding => {
      const currentHoldingValue = holding.quantity * holding.current_price;
      const gainLoss = currentHoldingValue - holding.total_invested;
      const gainLossPercentage = (gainLoss / holding.total_invested) * 100;

      totalInvested += holding.total_invested;
      currentValue += currentHoldingValue;

      return {
        ...holding,
        current_value: currentHoldingValue,
        gain_loss: gainLoss,
        gain_loss_percentage: gainLossPercentage
      };
    });

    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    res.json({
      portfolio: enrichedPortfolio,
      summary: {
        total_invested: totalInvested,
        current_value: currentValue,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percentage: totalGainLossPercentage,
        holdings_count: portfolio.length
      }
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get portfolio performance history
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Get user's trades for the specified period
    const trades = await db('trades')
      .select(
        'trades.*',
        'companies.name as company_name',
        'companies.symbol'
      )
      .join('companies', 'trades.company_id', 'companies.id')
      .where(function() {
        this.where('trades.buyer_id', userId)
            .orWhere('trades.seller_id', userId);
      })
      .where('trades.created_at', '>=', db.raw(`NOW() - INTERVAL '${days} days'`))
      .orderBy('trades.created_at', 'desc');

    // Calculate daily portfolio values (simplified)
    const performanceData = [];
    let runningValue = 0;

    trades.forEach(trade => {
      const date = trade.created_at.toISOString().split('T')[0];
      const existingDay = performanceData.find(d => d.date === date);
      
      if (existingDay) {
        existingDay.total_value += trade.total_amount;
        existingDay.trades_count += 1;
      } else {
        performanceData.push({
          date,
          total_value: trade.total_amount,
          trades_count: 1
        });
      }
    });

    res.json({
      performance: performanceData.reverse(),
      trades_summary: {
        total_trades: trades.length,
        period_days: days
      }
    });
  } catch (error) {
    console.error('Portfolio performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sector-wise allocation
router.get('/allocation', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const allocation = await db('portfolios')
      .select(
        'companies.sector',
        db.raw('SUM(portfolios.quantity * companies.current_price) as sector_value'),
        db.raw('SUM(portfolios.total_invested) as sector_invested'),
        db.raw('COUNT(*) as companies_count')
      )
      .join('companies', 'portfolios.company_id', 'companies.id')
      .where('portfolios.user_id', userId)
      .groupBy('companies.sector')
      .orderBy('sector_value', 'desc');

    const totalValue = allocation.reduce((sum, sector) => sum + parseFloat(sector.sector_value), 0);

    const enrichedAllocation = allocation.map(sector => ({
      ...sector,
      percentage: totalValue > 0 ? (sector.sector_value / totalValue) * 100 : 0
    }));

    res.json({
      allocation: enrichedAllocation,
      total_value: totalValue
    });
  } catch (error) {
    console.error('Portfolio allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;