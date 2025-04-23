import { io, Socket } from 'socket.io-client';
import { Order, RECertificate, Transaction } from '../types/market';
import { authService } from './auth';

class WebSocketService {
  private socket: Socket | null = null;
  private orderBookCallbacks: ((orders: Order[]) => void)[] = [];
  private recUpdateCallbacks: ((certificates: RECertificate[]) => void)[] = [];
  private transactionCallbacks: ((transactions: Transaction[]) => void)[] = [];
  
  // For demo purposes only
  private mockOrders: Order[] = [];
  private mockTransactions: Transaction[] = [];

  connect() {
    console.log('Attempting to connect to WebSocket server...');
    
    // For demo/development purposes, simulate order book updates
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode - using mock data');
      
      // Initial orders
      this.mockOrders = [
        { id: '1', userId: 'user1', userName: 'Solar Producer', energyType: 'SOLAR', quantity: 100, price: 3.45, type: 'BUY', recAttached: false, timestamp: new Date().toISOString(), status: 'PENDING' },
        { id: '2', userId: 'user2', userName: 'Wind Farm', energyType: 'WIND', quantity: 75, price: 3.50, type: 'SELL', recAttached: false, timestamp: new Date().toISOString(), status: 'PENDING' },
        { id: '3', userId: 'user3', userName: 'Energy Buyer', energyType: 'SOLAR', quantity: 50, price: 3.40, type: 'BUY', recAttached: false, timestamp: new Date().toISOString(), status: 'PENDING' },
        { id: '4', userId: 'user1', userName: 'Solar Producer', energyType: 'HYDRO', quantity: 120, price: 3.55, type: 'SELL', recAttached: false, timestamp: new Date().toISOString(), status: 'PENDING' },
      ];
      
      // Initial transactions
      this.mockTransactions = [
        { id: 't1', buyOrderId: 'prev1', sellOrderId: 'prev2', buyerId: 'user3', sellerId: 'user1', buyerName: 'Energy Buyer', sellerName: 'Solar Producer', energyType: 'SOLAR', quantity: 50, price: 3.45, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 't2', buyOrderId: 'prev3', sellOrderId: 'prev4', buyerId: 'user3', sellerId: 'user2', buyerName: 'Energy Buyer', sellerName: 'Wind Farm', energyType: 'WIND', quantity: 30, price: 3.48, timestamp: new Date(Date.now() - 1800000).toISOString() }
      ];
      
      // Push initial orders and transactions
      setTimeout(() => {
        this.orderBookCallbacks.forEach(callback => callback([...this.mockOrders]));
        this.transactionCallbacks.forEach(callback => callback([...this.mockTransactions]));
      }, 1000);
      
      // Simulate new orders every 5 seconds and run matching algorithm
      setInterval(() => {
        // Sometimes generate new orders
        if (Math.random() > 0.3) {
          const id = String(Date.now());
          const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
          const energyTypes: Array<'SOLAR' | 'WIND' | 'HYDRO'> = ['SOLAR', 'WIND', 'HYDRO'];
          const energyType = energyTypes[Math.floor(Math.random() * energyTypes.length)];
          const quantity = Math.floor(Math.random() * 100) + 10;
          const basePrice = 3.45;
          const variance = (Math.random() - 0.5) * 0.2;
          const price = Number(parseFloat(String(basePrice + variance)).toFixed(2));
          
          // Get a random user for demo purposes
          const userIds = ['user1', 'user2', 'user3'];
          const userId = userIds[Math.floor(Math.random() * userIds.length)];
          const userName = userId === 'user1' ? 'Solar Producer' : 
                          userId === 'user2' ? 'Wind Farm' : 'Energy Buyer';
          
          const newOrder: Order = {
            id,
            userId,
            userName,
            energyType,
            quantity,
            price,
            type,
            recAttached: false,
            timestamp: new Date().toISOString(),
            status: 'PENDING'
          };
          
          console.log('Simulating new order:', newOrder);
          this.mockOrders.push(newOrder);
          
          // Run matching algorithm after adding new order
          this.matchOrders();
        } else {
          // Sometimes just run matching algorithm on existing orders
          this.matchOrders();
        }
        
        // Keep the order book to a reasonable size
        if (this.mockOrders.length > 30) {
          this.mockOrders = this.mockOrders.slice(this.mockOrders.length - 30);
        }
        
        // Keep transaction history to reasonable size
        if (this.mockTransactions.length > 50) {
          this.mockTransactions = this.mockTransactions.slice(this.mockTransactions.length - 50);
        }
        
        this.orderBookCallbacks.forEach(callback => callback([...this.mockOrders]));
        this.transactionCallbacks.forEach(callback => callback([...this.mockTransactions]));
      }, 5000);
      
      return; // Don't try to connect to actual socket in development mode
    }
    
    // Real socket connection for production
    try {
      this.socket = io('http://localhost:3001');

      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      this.socket.on('orderBookUpdate', (orders: Order[]) => {
        console.log('Received order book update:', orders);
        this.orderBookCallbacks.forEach(callback => callback(orders));
      });

      this.socket.on('recUpdate', (certificates: RECertificate[]) => {
        console.log('Received REC update:', certificates);
        this.recUpdateCallbacks.forEach(callback => callback(certificates));
      });
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }

  subscribeToOrderBook(callback: (orders: Order[]) => void) {
    this.orderBookCallbacks.push(callback);
    return () => {
      this.orderBookCallbacks = this.orderBookCallbacks.filter(cb => cb !== callback);
    };
  }

  subscribeToRECUpdates(callback: (certificates: RECertificate[]) => void) {
    this.recUpdateCallbacks.push(callback);
    return () => {
      this.recUpdateCallbacks = this.recUpdateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
    this.transactionCallbacks.push(callback);
    
    // For development, immediately send mock data if available
    if (process.env.NODE_ENV === 'development' && this.mockTransactions.length > 0) {
      setTimeout(() => callback([...this.mockTransactions]), 100);
    }
    
    return () => {
      this.transactionCallbacks = this.transactionCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Match buy and sell orders based on price and quantity
   * This is a simplified matching algorithm:
   * 1. Find buy orders that are still pending
   * 2. For each buy order, find suitable sell orders
   * 3. Create transactions for matches and update order status
   */
  private matchOrders() {
    // Get all pending buy and sell orders
    const buyOrders = this.mockOrders
      .filter(o => o.type === 'BUY' && o.status === 'PENDING')
      .sort((a, b) => b.price - a.price); // Higher price first
    
    const sellOrders = this.mockOrders
      .filter(o => o.type === 'SELL' && o.status === 'PENDING')
      .sort((a, b) => a.price - b.price); // Lower price first
    
    // No matching possible if either is empty
    if (buyOrders.length === 0 || sellOrders.length === 0) {
      return;
    }
    
    console.log(`Attempting to match ${buyOrders.length} buy orders with ${sellOrders.length} sell orders`);
    
    // Try to match orders
    for (const buyOrder of buyOrders) {
      // Find matching sell orders (price <= buy price, same energy type)
      const matchingSellOrders = sellOrders.filter(sellOrder => 
        sellOrder.price <= buyOrder.price &&
        sellOrder.energyType === buyOrder.energyType &&
        sellOrder.status === 'PENDING'
      );
      
      if (matchingSellOrders.length === 0) continue;
      
      // Get the first (best price) matching sell order
      const sellOrder = matchingSellOrders[0];
      
      // Determine quantity to match
      const matchQuantity = Math.min(
        Number(buyOrder.quantity), 
        Number(sellOrder.quantity)
      );
      
      if (matchQuantity <= 0) continue;
      
      // Create transaction
      const transaction: Transaction = {
        id: `t${Date.now()}${Math.floor(Math.random() * 1000)}`,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        buyerId: buyOrder.userId,
        sellerId: sellOrder.userId,
        buyerName: buyOrder.userName,
        sellerName: sellOrder.userName,
        energyType: buyOrder.energyType,
        quantity: matchQuantity,
        price: sellOrder.price, // Use the sell price for the transaction
        timestamp: new Date().toISOString()
      };
      
      console.log('Created transaction:', transaction);
      this.mockTransactions.push(transaction);
      
      // Update orders
      const remainingBuyQuantity = Number(buyOrder.quantity) - matchQuantity;
      const remainingSellQuantity = Number(sellOrder.quantity) - matchQuantity;
      
      // Update the buy order in our mock orders array
      const buyOrderIndex = this.mockOrders.findIndex(o => o.id === buyOrder.id);
      if (buyOrderIndex !== -1) {
        if (remainingBuyQuantity <= 0) {
          this.mockOrders[buyOrderIndex].status = 'MATCHED';
        } else {
          this.mockOrders[buyOrderIndex].quantity = remainingBuyQuantity;
        }
      }
      
      // Update the sell order in our mock orders array
      const sellOrderIndex = this.mockOrders.findIndex(o => o.id === sellOrder.id);
      if (sellOrderIndex !== -1) {
        if (remainingSellQuantity <= 0) {
          this.mockOrders[sellOrderIndex].status = 'MATCHED';
        } else {
          this.mockOrders[sellOrderIndex].quantity = remainingSellQuantity;
        }
      }
      
      // Only match one order per cycle to keep it simple
      break;
    }
  }
  
  placeOrder(order: Omit<Order, 'id'>) {
    // For development environment, handle it locally
    if (process.env.NODE_ENV === 'development') {
      const id = `ord-${Date.now()}`;
      
      // Get current user if authenticated
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || order.userId || 'user1';
      const userName = currentUser?.name || order.userName || 'Anonymous User';
      
      const newOrder: Order = {
        ...order,
        id,
        userId,
        userName,
        status: 'PENDING'
      };
      
      this.mockOrders.push(newOrder);
      this.matchOrders(); // Run matching algorithm
      
      // Notify subscribers
      this.orderBookCallbacks.forEach(callback => callback([...this.mockOrders]));
      this.transactionCallbacks.forEach(callback => callback([...this.mockTransactions]));
      return;
    }
    
    // For production
    this.socket?.emit('placeOrder', order);
  }
  
  cancelOrder(orderId: string) {
    // For development environment, handle it locally
    if (process.env.NODE_ENV === 'development') {
      const orderIndex = this.mockOrders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        // Check if the order belongs to the current user
        const currentUser = authService.getCurrentUser();
        const order = this.mockOrders[orderIndex];
        
        // Only allow cancellation if it's the user's order or no authentication
        if (!currentUser || order.userId === currentUser.id) {
          if (order.status === 'PENDING') {
            this.mockOrders[orderIndex].status = 'CANCELLED';
            console.log(`Order ${orderId} cancelled`);
            
            // Notify subscribers
            this.orderBookCallbacks.forEach(callback => callback([...this.mockOrders]));
          } else {
            console.warn(`Cannot cancel order ${orderId} with status ${order.status}`);
          }
        } else {
          console.warn(`User ${currentUser.id} not authorized to cancel order ${orderId}`);
        }
      } else {
        console.warn(`Order ${orderId} not found`);
      }
      return;
    }
    
    // For production
    this.socket?.emit('cancelOrder', { orderId });
  }

  transferREC(recId: string, toAddress: string) {
    this.socket?.emit('transferREC', { recId, toAddress });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsService = new WebSocketService();
