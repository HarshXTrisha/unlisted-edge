const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('./auth');
const { requireKYCVerification } = require('./simple-kyc');

const router = express.Router();

// Create new order - KYC required
router.post('/', authenticateToken, requireKYCVerification, [
  body('company_id').isInt({ min: 1 }),
  body('type').isIn(['BUY', 'SELL']),
  body('order_type').isIn(['MARKET', 'LIMIT']),
  body('quantity').isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0.01 })
], async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await trx.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_id, type, order_type, quantity, price } = req.body;
    const userId = req.user.userId;

    // Validate company exists
    const company = await trx('companies').where({ id: company_id, is_active: true }).first();
    if (!company) {
      await trx.rollback();
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get user wallet balance
    const user = await trx('users').where({ id: userId }).first();
    if (!user) {
      await trx.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    let orderPrice = price;
    
    // For market orders, use current market price
    if (order_type === 'MARKET') {
      const latestTrade = await trx('trades')
        .where({ company_id })
        .orderBy('created_at', 'desc')
        .first();
      
      orderPrice = latestTrade ? latestTrade.price : company.current_price;
    }

    const totalAmount = orderPrice * quantity;

    // Validate buy order - check wallet balance
    if (type === 'BUY' && user.wallet_balance < totalAmount) {
      await trx.rollback();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Validate sell order - check portfolio holdings
    if (type === 'SELL') {
      const portfolio = await trx('portfolios')
        .where({ user_id: userId, company_id })
        .first();
      
      if (!portfolio || portfolio.quantity < quantity) {
        await trx.rollback();
        return res.status(400).json({ message: 'Insufficient shares to sell' });
      }
    }

    // Create order
    const [orderId] = await trx('orders').insert({
      user_id: userId,
      company_id,
      type,
      order_type,
      quantity,
      price: orderPrice,
      total_amount: totalAmount,
      status: 'PENDING'
    }).returning('id');

    // For buy orders, deduct amount from wallet immediately
    if (type === 'BUY') {
      await trx('users')
        .where({ id: userId })
        .update({ wallet_balance: user.wallet_balance - totalAmount });
    }

    await trx.commit();

    // Try to match orders immediately
    await matchOrders(company_id);

    const order = await db('orders')
      .select('orders.*', 'companies.name as company_name', 'companies.symbol')
      .join('companies', 'orders.company_id', 'companies.id')
      .where('orders.id', orderId.id || orderId)
      .first();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    await trx.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const { status, type } = req.query;
    const userId = req.user.userId;

    let query = db('orders')
      .select('orders.*', 'companies.name as company_name', 'companies.symbol')
      .join('companies', 'orders.company_id', 'companies.id')
      .where('orders.user_id', userId)
      .orderBy('orders.created_at', 'desc');

    if (status) {
      query = query.where('orders.status', status);
    }

    if (type) {
      query = query.where('orders.type', type);
    }

    const orders = await query;

    res.json({ orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await trx('orders')
      .where({ id, user_id: userId, status: 'PENDING' })
      .first();

    if (!order) {
      await trx.rollback();
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    // Update order status
    await trx('orders')
      .where({ id })
      .update({ status: 'CANCELLED' });

    // Refund amount for buy orders
    if (order.type === 'BUY') {
      await trx('users')
        .where({ id: userId })
        .increment('wallet_balance', order.total_amount - (order.filled_amount || 0));
    }

    await trx.commit();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await trx.rollback();
    console.error('Order cancellation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order matching engine (simplified)
async function matchOrders(companyId) {
  const trx = await db.transaction();
  
  try {
    // Get pending buy orders (highest price first)
    const buyOrders = await trx('orders')
      .where({ company_id: companyId, type: 'BUY', status: 'PENDING' })
      .orderBy('price', 'desc')
      .orderBy('created_at', 'asc');

    // Get pending sell orders (lowest price first)
    const sellOrders = await trx('orders')
      .where({ company_id: companyId, type: 'SELL', status: 'PENDING' })
      .orderBy('price', 'asc')
      .orderBy('created_at', 'asc');

    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        if (buyOrder.price >= sellOrder.price && buyOrder.status === 'PENDING' && sellOrder.status === 'PENDING') {
          const tradeQuantity = Math.min(
            buyOrder.quantity - (buyOrder.filled_quantity || 0),
            sellOrder.quantity - (sellOrder.filled_quantity || 0)
          );

          if (tradeQuantity > 0) {
            const tradePrice = sellOrder.price; // Use sell price
            const tradeAmount = tradePrice * tradeQuantity;

            // Create trade record
            await trx('trades').insert({
              buy_order_id: buyOrder.id,
              sell_order_id: sellOrder.id,
              buyer_id: buyOrder.user_id,
              seller_id: sellOrder.user_id,
              company_id: companyId,
              quantity: tradeQuantity,
              price: tradePrice,
              total_amount: tradeAmount
            });

            // Update buy order
            const newBuyFilled = (buyOrder.filled_quantity || 0) + tradeQuantity;
            const buyStatus = newBuyFilled >= buyOrder.quantity ? 'COMPLETED' : 'PARTIAL';
            
            await trx('orders')
              .where({ id: buyOrder.id })
              .update({
                filled_quantity: newBuyFilled,
                filled_amount: (buyOrder.filled_amount || 0) + tradeAmount,
                status: buyStatus
              });

            // Update sell order
            const newSellFilled = (sellOrder.filled_quantity || 0) + tradeQuantity;
            const sellStatus = newSellFilled >= sellOrder.quantity ? 'COMPLETED' : 'PARTIAL';
            
            await trx('orders')
              .where({ id: sellOrder.id })
              .update({
                filled_quantity: newSellFilled,
                filled_amount: (sellOrder.filled_amount || 0) + tradeAmount,
                status: sellStatus
              });

            // Update buyer's portfolio
            const buyerPortfolio = await trx('portfolios')
              .where({ user_id: buyOrder.user_id, company_id: companyId })
              .first();

            if (buyerPortfolio) {
              const newQuantity = buyerPortfolio.quantity + tradeQuantity;
              const newTotalInvested = buyerPortfolio.total_invested + tradeAmount;
              const newAvgPrice = newTotalInvested / newQuantity;

              await trx('portfolios')
                .where({ user_id: buyOrder.user_id, company_id: companyId })
                .update({
                  quantity: newQuantity,
                  average_price: newAvgPrice,
                  total_invested: newTotalInvested
                });
            } else {
              await trx('portfolios').insert({
                user_id: buyOrder.user_id,
                company_id: companyId,
                quantity: tradeQuantity,
                average_price: tradePrice,
                total_invested: tradeAmount
              });
            }

            // Update seller's portfolio
            const sellerPortfolio = await trx('portfolios')
              .where({ user_id: sellOrder.user_id, company_id: companyId })
              .first();

            if (sellerPortfolio) {
              const newQuantity = sellerPortfolio.quantity - tradeQuantity;
              if (newQuantity > 0) {
                await trx('portfolios')
                  .where({ user_id: sellOrder.user_id, company_id: companyId })
                  .update({ quantity: newQuantity });
              } else {
                await trx('portfolios')
                  .where({ user_id: sellOrder.user_id, company_id: companyId })
                  .del();
              }
            }

            // Add money to seller's wallet
            await trx('users')
              .where({ id: sellOrder.user_id })
              .increment('wallet_balance', tradeAmount);

            // Update company's current price
            await trx('companies')
              .where({ id: companyId })
              .update({ current_price: tradePrice });
          }
        }
      }
    }

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error('Order matching error:', error);
  }
}

module.exports = router;