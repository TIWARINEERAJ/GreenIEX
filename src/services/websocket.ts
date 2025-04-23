import { io, Socket } from 'socket.io-client';
import { MarketPrice, Order } from '../types/market';

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(url: string = 'ws://localhost:3001') {
    this.socket = io(url);

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  public subscribeToMarketPrices(callback: (data: MarketPrice[]) => void) {
    if (!this.socket) return;
    this.socket.on('marketPrices', callback);
  }

  public subscribeToOrderBook(callback: (data: Order[]) => void) {
    if (!this.socket) return;
    this.socket.on('orderBook', callback);
  }

  public unsubscribe(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  public disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
  }
}

export default WebSocketService.getInstance();
