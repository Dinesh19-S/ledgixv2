import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import partiesRoutes from './routes/parties';
import paymentsRoutes from './routes/payments';
import journalsRoutes from './routes/journals';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/settings', settingsRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ledgix API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
