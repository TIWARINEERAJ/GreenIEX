import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Order } from '../entities/Order';
import { Trade } from '../entities/Trade';
import { logger } from '../utils/logger';
import { FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export const marketRouter = Router();
const orderRepository = AppDataSource.getRepository(Order);
const tradeRepository = AppDataSource.getRepository(Trade);

// Place a new order
marketRouter.post('/orders', async (req, res) => {
  try {
    const newOrder = orderRepository.create(req.body);
    const savedOrder = await orderRepository.save(newOrder);
    
    // Try to match the order
    if (savedOrder instanceof Order) {
      await matchOrder(savedOrder);
    }
    
    res.status(201).json(savedOrder);
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order book
marketRouter.get('/orderbook', async (req, res) => {
  try {
    const { energyType } = req.query;
    const orders = await orderRepository.find({
      where: {
        energyType: energyType as string,
        status: 'PENDING'
      },
      order: {
        price: 'DESC'
      }
    });
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching order book:', error);
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Get market summary
marketRouter.get('/summary', async (_req, res) => {
  try {
    const trades = await tradeRepository.find({
      order: {
        executedAt: 'DESC'
      },
      take: 100
    });
    
    const summary = calculateMarketSummary(trades);
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching market summary:', error);
    res.status(500).json({ error: 'Failed to fetch market summary' });
  }
});

// Helper function to match orders
async function matchOrder(newOrder: Order) {
  const baseWhere: FindOptionsWhere<Order> = {
    energyType: newOrder.energyType,
    orderType: newOrder.orderType === 'BUY' ? 'SELL' : 'BUY',
    status: 'PENDING'
  };

  const priceCondition = newOrder.orderType === 'BUY'
    ? { price: LessThanOrEqual(newOrder.price) }
    : { price: MoreThanOrEqual(newOrder.price) };

  const matchingOrders = await orderRepository.find({
    where: {
      ...baseWhere,
      ...priceCondition
    },
    order: {
      price: newOrder.orderType === 'BUY' ? 'ASC' : 'DESC'
    }
  });

  for (const matchingOrder of matchingOrders) {
    if (newOrder.status === 'MATCHED') break;

    const quantity = Math.min(Number(newOrder.quantity), Number(matchingOrder.quantity));
    const price = Number(matchingOrder.price);

    // Create trade
    const trade = tradeRepository.create({
      buyOrderId: newOrder.orderType === 'BUY' ? newOrder.id : matchingOrder.id,
      sellOrderId: newOrder.orderType === 'SELL' ? newOrder.id : matchingOrder.id,
      price,
      quantity,
      carbonOffset: calculateCarbonOffset(newOrder.energyType, quantity)
    });

    // Update orders
    newOrder.quantity = Number(newOrder.quantity) - quantity;
    matchingOrder.quantity = Number(matchingOrder.quantity) - quantity;

    if (newOrder.quantity === 0) newOrder.status = 'MATCHED';
    if (matchingOrder.quantity === 0) matchingOrder.status = 'MATCHED';

    // Save all changes
    await Promise.all([
      tradeRepository.save(trade),
      orderRepository.save(newOrder),
      orderRepository.save(matchingOrder)
    ]);
  }
}

function calculateCarbonOffset(energyType: string, quantity: number): number {
  const offsetRates = {
    SOLAR: 0.9, // 0.9 tons CO2 per MWh
    WIND: 0.8,
    HYDRO: 0.7
  };
  return quantity * offsetRates[energyType as keyof typeof offsetRates];
}

function calculateMarketSummary(trades: Trade[]) {
  return {
    totalVolume: trades.reduce((sum, trade) => sum + Number(trade.quantity), 0),
    totalTrades: trades.length,
    averagePrice: trades.length > 0 
      ? trades.reduce((sum, trade) => sum + Number(trade.price), 0) / trades.length 
      : 0,
    totalCarbonOffset: trades.reduce((sum, trade) => sum + Number(trade.carbonOffset), 0)
  };
}
