import { Order } from '../entities/Order';
import { Trade } from '../entities/Trade';
import { AppDataSource } from '../data-source';
import { logger } from '../utils/logger';

// Order types
export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

// Order status
export enum OrderStatus {
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLED = 'cancelled'
}

// Matching algorithm types
export enum MatchingAlgorithm {
  FIFO = 'fifo',           // First-In-First-Out
  PRO_RATA = 'pro_rata',   // Proportional allocation
  PRICE_TIME = 'price_time' // Price-Time Priority (default)
}

class MatchingEngine {
  private orderRepository = AppDataSource.getRepository(Order);
  private tradeRepository = AppDataSource.getRepository(Trade);
  
  /**
   * Process a new order and attempt to match it with existing orders
   * @param newOrder The new order to process
   * @param algorithm The matching algorithm to use
   * @returns Array of trades created
   */
  async processOrder(
    newOrder: Order, 
    algorithm: MatchingAlgorithm = MatchingAlgorithm.PRICE_TIME
  ): Promise<Trade[]> {
    logger.info(`Processing ${newOrder.type} order for ${newOrder.quantity} units at ${newOrder.price}`);
    
    // Save the new order first
    await this.orderRepository.save(newOrder);
    
    // Find matching orders
    const matchingOrders = await this.findMatchingOrders(newOrder);
    
    if (matchingOrders.length === 0) {
      logger.info('No matching orders found');
      return [];
    }
    
    // Sort matching orders based on the selected algorithm
    const sortedOrders = this.sortOrdersByAlgorithm(matchingOrders, algorithm);
    
    // Execute matches and create trades
    const trades = await this.executeMatches(newOrder, sortedOrders);
    
    return trades;
  }
  
  /**
   * Find orders that match with the new order
   */
  private async findMatchingOrders(newOrder: Order): Promise<Order[]> {
    const oppositeOrderType = newOrder.type === OrderType.BUY ? OrderType.SELL : OrderType.BUY;
    const { In, LessThanOrEqual, MoreThanOrEqual } = require("typeorm");
    
    // Build the where clause based on order type
    const whereClause: any = {
      orderType: oppositeOrderType,
      energyType: newOrder.assetType,
      status: In([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
    };
    
    // Add price condition based on order type
    if (newOrder.type === OrderType.BUY) {
      whereClause.price = LessThanOrEqual(newOrder.price);
    } else {
      whereClause.price = MoreThanOrEqual(newOrder.price);
    }
    
    // Query for matching orders
    const matchingOrders = await this.orderRepository.find({
      where: whereClause,
      order: {
        // Default sorting by price (best price first) and then by createdAt
        ...(newOrder.type === OrderType.BUY 
          ? { price: 'ASC' } // For buy orders, lowest sell price first
          : { price: 'DESC' }), // For sell orders, highest buy price first
        createdAt: 'ASC' // Oldest orders first
      }
    });
    
    return matchingOrders;
  }
  
  /**
   * Sort orders based on the selected matching algorithm
   */
  private sortOrdersByAlgorithm(
    orders: Order[], 
    algorithm: MatchingAlgorithm
  ): Order[] {
    switch (algorithm) {
      case MatchingAlgorithm.FIFO:
        // Sort by creation time only
        return [...orders].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
      case MatchingAlgorithm.PRO_RATA:
        // Group by price level and allocate proportionally
        // This is a simplified implementation
        return orders;
        
      case MatchingAlgorithm.PRICE_TIME:
      default:
        // Already sorted by price and time in the query
        return orders;
    }
  }
  
  /**
   * Execute matches between the new order and matching orders
   */
  private async executeMatches(
    newOrder: Order, 
    matchingOrders: Order[]
  ): Promise<Trade[]> {
    const trades: Trade[] = [];
    let remainingQuantity = newOrder.quantity;
    
    for (const matchingOrder of matchingOrders) {
      if (remainingQuantity <= 0) break;
      
      // Calculate the quantity to trade
      const availableQuantity = matchingOrder.quantity - matchingOrder.filledQuantity;
      const tradeQuantity = Math.min(remainingQuantity, availableQuantity);
      
      // Determine the trade price (usually the price of the resting order)
      const tradePrice = matchingOrder.price;
      
      // Create a new trade
      const trade = new Trade();
      trade.buyOrderId = newOrder.type === OrderType.BUY ? newOrder.id : matchingOrder.id;
      trade.sellOrderId = newOrder.type === OrderType.SELL ? newOrder.id : matchingOrder.id;
      trade.quantity = tradeQuantity;
      trade.price = tradePrice;
      trade.assetType = newOrder.assetType;
      trade.executedAt = new Date();
      
      // Save the trade
      await this.tradeRepository.save(trade);
      trades.push(trade);
      
      // Update the matching order
      matchingOrder.filledQuantity += tradeQuantity;
      if (matchingOrder.filledQuantity >= matchingOrder.quantity) {
        matchingOrder.status = OrderStatus.FILLED;
      } else {
        matchingOrder.status = OrderStatus.PARTIALLY_FILLED;
      }
      await this.orderRepository.save(matchingOrder);
      
      // Update the new order
      remainingQuantity -= tradeQuantity;
      newOrder.filledQuantity += tradeQuantity;
    }
    
    // Update the status of the new order
    if (remainingQuantity <= 0) {
      newOrder.status = OrderStatus.FILLED;
    } else if (newOrder.filledQuantity > 0) {
      newOrder.status = OrderStatus.PARTIALLY_FILLED;
    }
    await this.orderRepository.save(newOrder);
    
    logger.info(`Created ${trades.length} trades for order ${newOrder.id}`);
    return trades;
  }
  
  /**
   * Get the current order book for a specific asset
   */
  async getOrderBook(assetType: string) {
    const { In } = require("typeorm");
    
    const buyOrders = await this.orderRepository.find({
      where: {
        orderType: OrderType.BUY,
        energyType: assetType,
        status: In([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
      },
      order: { price: 'DESC' } // Highest buy price first
    });
    
    const sellOrders = await this.orderRepository.find({
      where: {
        orderType: OrderType.SELL,
        energyType: assetType,
        status: In([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
      },
      order: { price: 'ASC' } // Lowest sell price first
    });
    
    // Aggregate orders by price level
    const bids = this.aggregateOrdersByPrice(buyOrders);
    const asks = this.aggregateOrdersByPrice(sellOrders);
    
    return { bids, asks };
  }
  
  /**
   * Aggregate orders by price level
   */
  private aggregateOrdersByPrice(orders: Order[]) {
    const aggregated: { price: number; quantity: number; count: number }[] = [];
    
    orders.forEach(order => {
      const availableQuantity = order.quantity - order.filledQuantity;
      const priceLevel = aggregated.find(level => level.price === order.price);
      
      if (priceLevel) {
        priceLevel.quantity += availableQuantity;
        priceLevel.count += 1;
      } else {
        aggregated.push({
          price: order.price,
          quantity: availableQuantity,
          count: 1
        });
      }
    });
    
    return aggregated;
  }
}

export const matchingEngine = new MatchingEngine();
