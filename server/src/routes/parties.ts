import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken as any); // Secure all party routes

// GET all parties for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const parties = await prisma.party.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(parties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE party
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, mobile, address, gst, openingBalance, balanceType } = req.body;
    const party = await prisma.party.create({
      data: {
        userId: req.user!.id,
        name,
        mobile,
        address,
        gst,
        openingBalance,
        balanceType,
      },
    });
    res.status(201).json(party);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE party
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Ensure the party belongs to the user
    const existing = await prisma.party.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const party = await prisma.party.update({
      where: { id },
      data,
    });
    res.json(party);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE party
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.party.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.party.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BULK SAVE parties
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const parties = req.body.parties;
    
    // In Supabase they deleted all parties not '0000...' but let's just clear user's parties and insert
    await prisma.party.deleteMany({
      where: { userId: req.user!.id }
    });

    if (parties && parties.length > 0) {
      const rows = parties.map((p: any) => ({
        userId: req.user!.id,
        name: p.name,
        mobile: p.mobile,
        address: p.address,
        gst: p.gst,
        openingBalance: p.openingBalance,
        balanceType: p.balanceType,
      }));
      await prisma.party.createMany({ data: rows });
    }
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
