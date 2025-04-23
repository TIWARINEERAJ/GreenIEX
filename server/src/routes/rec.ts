import { Router } from 'express';
import { MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RECertificate } from '../entities/RECertificate';
import { logger } from '../utils/logger';

export const recRouter = Router();
const recRepository = AppDataSource.getRepository(RECertificate);

// Issue new REC
recRouter.post('/issue', async (req, res) => {
  try {
    const {
      generatorId,
      energyType,
      mwhQuantity,
      expiryDate
    } = req.body;

    const carbonOffset = calculateCarbonOffset(energyType, mwhQuantity);
    
    const rec = recRepository.create({
      generatorId,
      energyType,
      mwhQuantity,
      expiryDate: new Date(expiryDate),
      carbonOffset,
      currentOwnerId: generatorId
    });

    await recRepository.save(rec);
    res.status(201).json(rec);
  } catch (error) {
    logger.error('Error issuing REC:', error);
    res.status(500).json({ error: 'Failed to issue REC' });
  }
});

// Get available RECs
recRouter.get('/available', async (_req, res) => {
  try {
    const recs = await recRepository.find({
      where: {
        isRetired: false,
        expiryDate: MoreThanOrEqual(new Date())
      },
      order: {
        generationDate: 'DESC'
      }
    });
    res.json(recs);
  } catch (error) {
    logger.error('Error fetching RECs:', error);
    res.status(500).json({ error: 'Failed to fetch RECs' });
  }
});

// Transfer REC
recRouter.post('/transfer', async (req, res) => {
  try {
    const { recId, newOwnerId } = req.body;
    
    const rec = await recRepository.findOneBy({ id: recId });
    if (!rec) {
      return res.status(404).json({ error: 'REC not found' });
    }
    
    if (rec.isRetired) {
      return res.status(400).json({ error: 'REC is already retired' });
    }
    
    rec.currentOwnerId = newOwnerId;
    await recRepository.save(rec);
    
    return res.json(rec);
  } catch (error) {
    logger.error('Error transferring REC:', error);
    return res.status(500).json({ error: 'Failed to transfer REC' });
  }
});

// Retire REC
recRouter.post('/retire', async (req, res) => {
  try {
    const { recId } = req.body;
    
    const rec = await recRepository.findOneBy({ id: recId });
    if (!rec) {
      return res.status(404).json({ error: 'REC not found' });
    }
    
    if (rec.isRetired) {
      return res.status(400).json({ error: 'REC is already retired' });
    }
    
    rec.isRetired = true;
    await recRepository.save(rec);
    
    return res.json(rec);
  } catch (error) {
    logger.error('Error retiring REC:', error);
    return res.status(500).json({ error: 'Failed to retire REC' });
  }
});

function calculateCarbonOffset(energyType: string, mwhQuantity: number): number {
  const offsetRates = {
    SOLAR: 0.9, // 0.9 tons CO2 per MWh
    WIND: 0.8,
    HYDRO: 0.7
  };
  return mwhQuantity * offsetRates[energyType as keyof typeof offsetRates];
}
