import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { EnergyType } from '../../types/market';
import { getPriceHistory, getVolumeData, getPriceChange } from '../../services/priceHistory';

interface PriceChartProps {
  energyType: EnergyType;
}

const PriceChart: React.FC<PriceChartProps> = ({ energyType }) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  
  // Get price history data
  const priceData = useMemo(() => {
    const history = getPriceHistory(energyType, timeRange);
    
    return history.map(point => ({
      date: new Date(point.timestamp).toLocaleDateString(),
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: point.price,
      volume: point.volume
    }));
  }, [energyType, timeRange]);
  
  // Get volume data
  const volumeData = useMemo(() => {
    return getVolumeData(energyType, timeRange);
  }, [energyType, timeRange]);
  
  // Get price change statistics
  const priceChange = useMemo(() => {
    return getPriceChange(energyType, timeRange);
  }, [energyType, timeRange]);
  
  // Determine color based on price change
  const changeColor = priceChange.change >= 0 ? 'text-green-600' : 'text-red-600';
  
  // Calculate min and max for Y axis
  const priceMin = Math.min(...priceData.map(d => d.price)) * 0.98;
  const priceMax = Math.max(...priceData.map(d => d.price)) * 1.02;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          {energyType} Price Chart
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === 7 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            7D
          </button>
          <button 
            onClick={() => setTimeRange(14)}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === 14 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            14D
          </button>
          <button 
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === 30 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            30D
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold">₹{priceData.length > 0 ? priceData[priceData.length - 1].price : 0}</span>
          <span className={`ml-2 ${changeColor}`}>
            {priceChange.change >= 0 ? '+' : ''}{priceChange.change} ({priceChange.percentage}%)
          </span>
        </div>
        <p className="text-sm text-gray-500">Last {timeRange} days</p>
      </div>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value, index) => {
                // Show fewer ticks for readability
                return index % Math.ceil(priceData.length / 7) === 0 ? value : '';
              }}
            />
            <YAxis 
              domain={[priceMin, priceMax]} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value.toFixed(2)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#10b981" 
              fill="#d1fae5" 
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <h3 className="text-md font-medium text-gray-900 mb-2">Volume</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value, index) => {
                return index % Math.ceil(volumeData.length / 5) === 0 ? value : '';
              }}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                return value;
              }}
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), 'Volume']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar dataKey="volume" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
