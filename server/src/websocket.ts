import { Server } from 'socket.io';
import { AppDataSource } from './data-source';
import { Order } from './entities/Order';
import { logger } from './utils/logger';

export const setupWebSocket = (io: Server) => {
  const orderRepository = AppDataSource.getRepository(Order);

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Send initial market data
    const sendMarketData = async () => {
      try {
        const orders = await orderRepository.find({
          where: { status: 'PENDING' },
          order: { createdAt: 'DESC' },
          take: 100
        });

        const marketData = aggregateMarketData(orders);
        socket.emit('marketPrices', marketData);
      } catch (error) {
        logger.error('Error fetching market data:', error);
      }
    };

    // Send initial order book
    const sendOrderBook = async () => {
      try {
        const orders = await orderRepository.find({
          where: { status: 'PENDING' },
          order: { price: 'DESC' },
          take: 50
        });
        socket.emit('orderBook', orders);
      } catch (error) {
        logger.error('Error fetching order book:', error);
      }
    };

    // Send initial data
    sendMarketData();
    sendOrderBook();

    // Set up intervals for real-time updates
    const marketDataInterval = setInterval(sendMarketData, 5000);
    const orderBookInterval = setInterval(sendOrderBook, 3000);

    // Clean up on disconnect
    socket.on('disconnect', () => {
      clearInterval(marketDataInterval);
      clearInterval(orderBookInterval);
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};

function aggregateMarketData(orders: Order[]) {
  const marketData = {
    SOLAR: { price: 0, volume: 0 },
    WIND: { price: 0, volume: 0 },
    HYDRO: { price: 0, volume: 0 }
  };

  orders.forEach(order => {
    const type = order.energyType as keyof typeof marketData;
    marketData[type].price = 
      (marketData[type].price * marketData[type].volume + order.price * order.quantity) /
      (marketData[type].volume + order.quantity);
    marketData[type].volume += order.quantity;
  });

  return Object.entries(marketData).map(([energyType, data]) => ({
    energyType,
    price: data.price,
    volume: data.volume,
    timestamp: new Date().toISOString()
  }));
}
