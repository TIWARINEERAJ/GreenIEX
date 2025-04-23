export type EnergyType = 'SOLAR' | 'WIND' | 'HYDRO';

export interface MarketPrice {
  energyType: EnergyType;
  price: number;
  timestamp: string;
  volume: number;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  energyType: EnergyType;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  recAttached: boolean;
  timestamp: string;
  status: 'PENDING' | 'MATCHED' | 'CANCELLED';
}

export interface RECertificate {
  id: string;
  generatorId: string;
  energyType: EnergyType;
  mwhQuantity: number;
  generationDate: string;
  expiryDate: string;
  isRetired: boolean;
  carbonOffset: number;
}

export interface CarbonImpact {
  totalMwh: number;
  carbonOffset: number;
  energyMix: {
    [key in EnergyType]: number;
  };
}

export interface Transaction {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  sellerName?: string;
  energyType: EnergyType;
  quantity: number;
  price: number;
  timestamp: string;
}
