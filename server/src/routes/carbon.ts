import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Trade } from '../entities/Trade';
import { CarbonCredit } from '../entities/CarbonCredit';
import { logger } from '../utils/logger';

export const carbonRouter = Router();
const tradeRepository = AppDataSource.getRepository(Trade);
const carbonCreditRepository = AppDataSource.getRepository(CarbonCredit);

// Get carbon impact summary
carbonRouter.get('/summary', async (req, res) => {
  try {
    const { startDate } = req.query;
    
    const trades = await tradeRepository.find({
      where: {
        executedAt: startDate ? new Date(startDate as string) : new Date(0)
      }
    });
    
    const summary = calculateCarbonImpact(trades);
    return res.json({ totalCarbonOffset: summary.totalOffset });
  } catch (error) {
    logger.error('Error fetching carbon impact:', error);
    return res.status(500).json({ error: 'Failed to fetch carbon impact' });
  }
});

// Generate carbon credits from trade
carbonRouter.post('/credits/generate', async (req, res) => {
  try {
    const { tradeId } = req.body;
    
    const trade = await tradeRepository.findOneBy({ id: tradeId });
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const carbonCredit = carbonCreditRepository.create({
      tradeId: trade.id,
      amount: trade.carbonOffset,
      sourceType: trade.buyOrder.energyType,
      expiryDate: calculateExpiryDate(),
    });
    
    await carbonCreditRepository.save(carbonCredit);
    return res.status(201).json(carbonCredit);
  } catch (error) {
    logger.error('Error generating carbon credits:', error);
    return res.status(500).json({ error: 'Failed to generate carbon credits' });
  }
});

// Get carbon credits
carbonRouter.get('/credits', async (_req, res) => {
  try {
    const credits = await carbonCreditRepository.find({
      where: {
        isRetired: false,
        expiryDate: new Date()
      },
      order: {
        generatedAt: 'DESC'
      }
    });
    return res.json(credits);
  } catch (error) {
    logger.error('Error fetching carbon credits:', error);
    return res.status(500).json({ error: 'Failed to fetch carbon credits' });
  }
});

// Retire carbon credits
carbonRouter.post('/credits/retire', async (req, res) => {
  try {
    const { creditId, reason } = req.body;
    
    const credit = await carbonCreditRepository.findOneBy({ id: creditId });
    if (!credit) {
      return res.status(404).json({ error: 'Carbon credit not found' });
    }
    
    if (credit.isRetired) {
      return res.status(400).json({ error: 'Carbon credit is already retired' });
    }
    
    credit.isRetired = true;
    credit.retirementReason = reason;
    await carbonCreditRepository.save(credit);
    
    return res.json(credit);
  } catch (error) {
    logger.error('Error retiring carbon credits:', error);
    return res.status(500).json({ error: 'Failed to retire carbon credits' });
  }
});

function calculateCarbonImpact(trades: Trade[]) {
  const impact = {
    totalOffset: 0,
    bySource: {
      SOLAR: 0,
      WIND: 0,
      HYDRO: 0
    },
    equivalencies: {}
  };
  
  trades.forEach(trade => {
    impact.totalOffset += trade.carbonOffset;
    impact.bySource[trade.buyOrder.energyType as keyof typeof impact.bySource] += trade.carbonOffset;
  });
  
  // Calculate real-world equivalencies
  impact.equivalencies = {
    treeYears: impact.totalOffset * 45, // One ton CO2 = ~45 tree-years
    carMiles: impact.totalOffset * 2481, // One ton CO2 = ~2,481 miles driven
    homeEnergy: impact.totalOffset * 1.21 // One ton CO2 = 1.21 homes' electricity for one month
  };
  
  return impact;
}

function calculateExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  return expiryDate;
}
