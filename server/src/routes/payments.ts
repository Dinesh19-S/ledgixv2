import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken as any);

// GET all payments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE payment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { voucherNo, date, partyName, paymentType, transactionType, amount, remarks } = req.body;
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        voucherNo,
        date: new Date(date),
        partyName,
        paymentType,
        transactionType,
        amount,
        remarks,
      },
    });
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE payment
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.payment.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.payment.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BULK SAVE payments
router.post('/bulk', async (req: AuthRequest, res) => {
  try {
    const payments = req.body.payments;
    await prisma.payment.deleteMany({
      where: { userId: req.user!.id }
    });

    if (payments && payments.length > 0) {
      const rows = payments.map((p: any) => ({
        userId: req.user!.id,
        voucherNo: p.voucherNo,
        date: new Date(p.date),
        partyName: p.partyName,
        paymentType: p.paymentType,
        transactionType: p.transactionType,
        amount: p.amount,
        remarks: p.remarks,
      }));
      await prisma.payment.createMany({ data: rows });
    }
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
