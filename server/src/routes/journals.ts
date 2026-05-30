import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken as any);

// GET all journals
router.get('/', async (req: AuthRequest, res) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(journals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE journal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { voucherNo, date, debitParty, creditParty, amount, remarks } = req.body;
    const journal = await prisma.journal.create({
      data: {
        userId: req.user!.id,
        voucherNo,
        date: new Date(date),
        debitParty,
        creditParty,
        amount,
        remarks,
      },
    });
    res.status(201).json(journal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE journal
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.journal.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.journal.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BULK SAVE journals
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const journals = req.body.journals;
    await prisma.journal.deleteMany({
      where: { userId: req.user!.id }
    });

    if (journals && journals.length > 0) {
      const rows = journals.map((j: any) => ({
        userId: req.user!.id,
        voucherNo: j.voucherNo,
        date: new Date(j.date),
        debitParty: j.debitParty,
        creditParty: j.creditParty,
        amount: j.amount,
        remarks: j.remarks,
      }));
      await prisma.journal.createMany({ data: rows });
    }
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
