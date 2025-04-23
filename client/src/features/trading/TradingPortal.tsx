import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { EnergyType, Order } from '../../types/market';
import { wsService } from '../../services/websocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransactionHistory from './TransactionHistory';
import { authService } from '../../services/auth';
import PriceChart from './PriceChart';

const TradingPortal: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyDepth, setBuyDepth] = useState<{price: number, quantity: number}[]>([]);
  const [sellDepth, setSellDepth] = useState<{price: number, quantity: number}[]>([]);
  const [orderForm, setOrderForm] = useState({
    energyType: 'SOLAR' as EnergyType,
    quantity: '',
    price: '',
    type: 'BUY' as 'BUY' | 'SELL',
    recAttached: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  }, []);

  // Calculate market depth
  const updateMarketDepth = useCallback((orders: Order[]) => {
    const buyOrders = orders
      .filter(o => o.type === 'BUY' && o.status === 'PENDING')
      .sort((a, b) => b.price - a.price);
    const sellOrders = orders
      .filter(o => o.type === 'SELL' && o.status === 'PENDING')
      .sort((a, b) => a.price - b.price);

    const buyDepthData = buyOrders.reduce<{price: number, quantity: number}[]>(
      (acc, order) => {
        const lastQuantity = acc[acc.length - 1]?.quantity || 0;
        acc.push({ price: order.price, quantity: lastQuantity + Number(order.quantity) });
        return acc;
      }, []
    );

    const sellDepthData = sellOrders.reduce<{price: number, quantity: number}[]>(
      (acc, order) => {
        const lastQuantity = acc[acc.length - 1]?.quantity || 0;
        acc.push({ price: order.price, quantity: lastQuantity + Number(order.quantity) });
        return acc;
      }, []
    );

    setBuyDepth(buyDepthData);
    setSellDepth(sellDepthData);
  }, []);



  // Calculate market statistics
  const marketStats = useMemo(() => {
    if (orders.length === 0) return null;

    const prices = orders.map(o => o.price);
    const volumes = orders.map(o => Number(o.quantity));
    
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: volumes.reduce((a, b) => a + b, 0),
      lastPrice: orders[orders.length - 1].price
    };
  }, [orders]);

  // Connect to WebSocket
  useEffect(() => {
    console.log('Initializing WebSocket connection...');
    wsService.connect();

    // Subscribe to order book updates
    const unsubscribe = wsService.subscribeToOrderBook((newOrders) => {
      console.log('Received order book update with', newOrders.length, 'orders');
      setOrders(newOrders);
      updateMarketDepth(newOrders);
    });

    return () => {
      console.log('Cleaning up WebSocket connection...');
      unsubscribe();
      wsService.disconnect();
    };
  }, [updateMarketDepth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!orderForm.energyType || !orderForm.quantity || !orderForm.price || !orderForm.type) {
      showToast('Please fill out all fields', 'error');
      return;
    }
    
    try {
      // Get current user if authenticated
      const currentUser = authService.getCurrentUser();
      
      // Create order object
      const order = {
        energyType: orderForm.energyType as EnergyType,
        quantity: Number(orderForm.quantity),
        price: Number(orderForm.price),
        type: orderForm.type as 'BUY' | 'SELL',
        recAttached: false,
        timestamp: new Date().toISOString(),
        status: 'PENDING' as const,
        userId: currentUser?.id || 'anonymous',
        userName: currentUser?.name || 'Anonymous User'
      };
      
      // Place order
      wsService.placeOrder(order);
      
      // Reset form
      setOrderForm({
        energyType: 'SOLAR',
        quantity: '',
        price: '',
        type: 'BUY',
        recAttached: false
      });
      
      // Show success message
      showToast(`Your ${order.type.toLowerCase()} order for ${order.quantity} ${order.energyType} at ₹${order.price} has been placed.`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast(`Error placing order: ${errorMessage}`, 'error');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Form */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Place Order</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="energyType" className="block text-sm font-medium text-gray-700">Energy Type</label>
              <select
                id="energyType"
                name="energyType"
                value={orderForm.energyType}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="SOLAR">Solar</option>
                <option value="WIND">Wind</option>
                <option value="HYDRO">Hydro</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Order Type</label>
              <select
                id="type"
                name="type"
                value={orderForm.type}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity (kWh)</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={orderForm.quantity}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (₹/kWh)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={orderForm.price}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Place Order
            </button>
          </form>
        </div>
        
        {/* Market Stats */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Market Stats</h2>
          {marketStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">24h High</p>
                <p className="text-lg font-semibold">₹{marketStats.high.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">24h Low</p>
                <p className="text-lg font-semibold">₹{marketStats.low.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">24h Volume</p>
                <p className="text-lg font-semibold">{marketStats.volume.toLocaleString()} kWh</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">Last Price</p>
                <p className="text-lg font-semibold">₹{marketStats.lastPrice.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No market data available</p>
          )}
        </div>
        
        {/* Price Chart */}
        <PriceChart energyType={orderForm.energyType as EnergyType} />
      </div>
      
      {/* Market Depth */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Market Depth</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...buyDepth, ...sellDepth]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="price" 
                domain={['dataMin', 'dataMax']} 
                type="number" 
                tickFormatter={(value) => `₹${value.toFixed(2)}`} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Quantity']} 
                labelFormatter={(value) => `₹${Number(value).toFixed(2)}`} 
              />
              <Legend />
              <Line 
                type="stepAfter" 
                dataKey="quantity" 
                data={buyDepth} 
                stroke="#48BB78" 
                dot={false} 
                name="Buy Depth"
              />
              <Line 
                type="stepAfter" 
                dataKey="quantity" 
                data={sellDepth} 
                stroke="#F56565" 
                dot={false} 
                name="Sell Depth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Order Book */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Book</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Sell Orders */}
          <div>
            <div className="bg-gray-50 p-2 grid grid-cols-4 font-semibold border-b">
              <div>Price</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {orders
                .filter(o => o.type === 'SELL')
                .sort((a, b) => b.price - a.price)
                .map(order => {
                  // Get current user to check if this is the user's order
                  const currentUser = authService.getCurrentUser();
                  const isUserOrder = currentUser && order.userId === currentUser.id;
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`grid grid-cols-4 p-2 border-b border-gray-100 ${order.status === 'MATCHED' ? 'bg-gray-100 opacity-50' : order.status === 'CANCELLED' ? 'bg-gray-200 opacity-30' : 'text-red-600'}`}
                    >
                      <div>₹{order.price.toFixed(2)}</div>
                      <div className="text-right">{order.quantity}</div>
                      <div className="text-right text-xs">
                        {order.status === 'MATCHED' && (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                            Matched
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {isUserOrder && order.status === 'PENDING' && (
                          <button 
                            onClick={() => wsService.cancelOrder(order.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Buy Orders */}
          <div>
            <div className="bg-gray-50 p-2 grid grid-cols-4 font-semibold border-b">
              <div>Price</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {orders
                .filter(o => o.type === 'BUY')
                .sort((a, b) => b.price - a.price)
                .map(order => {
                  // Get current user to check if this is the user's order
                  const currentUser = authService.getCurrentUser();
                  const isUserOrder = currentUser && order.userId === currentUser.id;
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`grid grid-cols-4 p-2 border-b border-gray-100 ${order.status === 'MATCHED' ? 'bg-gray-100 opacity-50' : order.status === 'CANCELLED' ? 'bg-gray-200 opacity-30' : 'text-green-600'}`}
                    >
                      <div>₹{order.price.toFixed(2)}</div>
                      <div className="text-right">{order.quantity}</div>
                      <div className="text-right text-xs">
                        {order.status === 'MATCHED' && (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                            Matched
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {isUserOrder && order.status === 'PENDING' && (
                          <button 
                            onClick={() => wsService.cancelOrder(order.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default TradingPortal;
