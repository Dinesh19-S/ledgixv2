import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken as any);

// GET settings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findUnique({
      where: { userId: req.user!.id },
    });
    res.json(settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPSERT settings
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { businessName, address, gstin, phone, email } = req.body;
    
    const settings = await prisma.setting.upsert({
      where: { userId: req.user!.id },
      update: {
        businessName,
        address,
        gstin,
        phone,
        email,
      },
      create: {
        userId: req.user!.id,
        businessName,
        address,
        gstin,
        phone,
        email,
      }
    });
    
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
