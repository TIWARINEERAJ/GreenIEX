import { EnergyType } from '../types/market';

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface PriceHistory {
  [key: string]: PricePoint[];
}

// Generate realistic price history data with trends and volatility
const generatePriceHistory = (
  energyType: EnergyType, 
  days: number = 30, 
  basePrice: number = 3.5, 
  volatility: number = 0.05,
  trend: number = 0.001 // Positive for uptrend, negative for downtrend
): PricePoint[] => {
  const history: PricePoint[] = [];
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Start price (slightly random around base price)
  let currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.1);
  
  // Generate data points for each day, with multiple points per day
  for (let day = days; day >= 0; day--) {
    const dayTimestamp = now - (day * dayInMs);
    
    // Generate 3-5 price points per day
    const pointsPerDay = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < pointsPerDay; i++) {
      // Add some hours to the timestamp
      const pointTimestamp = dayTimestamp + (i * (dayInMs / pointsPerDay));
      
      // Apply random price change with trend
      const change = (Math.random() - 0.5) * volatility + trend;
      currentPrice = currentPrice * (1 + change);
      
      // Ensure price doesn't go too low
      if (currentPrice < 0.5) currentPrice = 0.5;
      
      // Generate random volume (higher on bigger price moves)
      const volumeBase = 50 + Math.abs(change) * 1000;
      const volume = Math.floor(volumeBase + Math.random() * volumeBase);
      
      history.push({
        timestamp: pointTimestamp,
        price: parseFloat(currentPrice.toFixed(2)),
        volume
      });
    }
  }
  
  return history;
};

// Create price histories for each energy type
const createPriceHistories = (): PriceHistory => {
  return {
    'SOLAR': generatePriceHistory('SOLAR', 30, 3.5, 0.04, 0.001),
    'WIND': generatePriceHistory('WIND', 30, 3.2, 0.05, 0.0005),
    'HYDRO': generatePriceHistory('HYDRO', 30, 3.8, 0.03, -0.0002)
  };
};

// Singleton instance of price histories
const priceHistories = createPriceHistories();

export const getPriceHistory = (energyType: EnergyType, days: number = 7): PricePoint[] => {
  const history = priceHistories[energyType] || [];
  const now = Date.now();
  const cutoff = now - (days * 24 * 60 * 60 * 1000);
  
  return history.filter(point => point.timestamp >= cutoff);
};

export const getLatestPrice = (energyType: EnergyType): number => {
  const history = priceHistories[energyType] || [];
  if (history.length === 0) return 0;
  
  return history[history.length - 1].price;
};

export const getPriceChange = (energyType: EnergyType, days: number = 1): { change: number, percentage: number } => {
  const history = getPriceHistory(energyType, days);
  if (history.length < 2) return { change: 0, percentage: 0 };
  
  const latest = history[history.length - 1].price;
  const earliest = history[0].price;
  const change = latest - earliest;
  const percentage = (change / earliest) * 100;
  
  return {
    change: parseFloat(change.toFixed(2)),
    percentage: parseFloat(percentage.toFixed(2))
  };
};

export const getVolumeData = (energyType: EnergyType, days: number = 7): { date: string, volume: number }[] => {
  const history = getPriceHistory(energyType, days);
  const volumeByDate: { [date: string]: number } = {};
  
  // Aggregate volume by date
  history.forEach(point => {
    const date = new Date(point.timestamp).toLocaleDateString();
    volumeByDate[date] = (volumeByDate[date] || 0) + point.volume;
  });
  
  // Convert to array format for charts
  return Object.entries(volumeByDate).map(([date, volume]) => ({
    date,
    volume
  }));
};
