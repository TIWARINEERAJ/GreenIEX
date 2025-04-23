import express from 'express';
import { Order } from '../entities/Order';
import { AppDataSource } from '../data-source';
import { matchingEngine, OrderType, OrderStatus, MatchingAlgorithm } from '../services/matchingEngine';
import { logger } from '../utils/logger';

export const orderRouter = express.Router();
const orderRepository = AppDataSource.getRepository(Order);

// Get all orders
orderRouter.get('/', async (_req, res) => {
  try {
    const orders = await orderRepository.find({
      order: { createdAt: 'DESC' }
    });
    return res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
orderRouter.get('/:id', async (req, res) => {
  try {
    const order = await orderRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    return res.json(order);
  } catch (error) {
    logger.error(`Error fetching order ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create a new order and process matching
orderRouter.post('/', async (req, res) => {
  try {
    const { userId, type, assetType, quantity, price } = req.body;
    
    if (!userId || !type || !assetType || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate order type
    if (type !== OrderType.BUY && type !== OrderType.SELL) {
      return res.status(400).json({ error: 'Invalid order type' });
    }
    
    // Create new order
    const newOrder = new Order();
    newOrder.userId = userId;
    newOrder.type = type;
    newOrder.assetType = assetType;
    newOrder.quantity = quantity;
    newOrder.price = price;
    newOrder.status = OrderStatus.OPEN;
    newOrder.filledQuantity = 0;
    newOrder.createdAt = new Date();
    
    // Process the order with the matching engine
    const algorithm = req.body.algorithm || MatchingAlgorithm.PRICE_TIME;
    const trades = await matchingEngine.processOrder(newOrder, algorithm);
    
    return res.status(201).json({
      order: newOrder,
      trades,
      message: `Order created successfully. ${trades.length} trades executed.`
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order book for a specific asset
orderRouter.get('/book/:assetType', async (req, res) => {
  try {
    const { assetType } = req.params;
    const orderBook = await matchingEngine.getOrderBook(assetType);
    return res.json(orderBook);
  } catch (error) {
    logger.error(`Error fetching order book for ${req.params.assetType}:`, error);
    return res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Cancel an order
orderRouter.put('/:id/cancel', async (req, res) => {
  try {
    const order = await orderRepository.findOne({
      where: { id: req.params.id }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status === OrderStatus.FILLED) {
      return res.status(400).json({ error: 'Cannot cancel a filled order' });
    }
    
    order.status = OrderStatus.CANCELLED;
    await orderRepository.save(order);
    
    return res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    logger.error(`Error cancelling order ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
});
