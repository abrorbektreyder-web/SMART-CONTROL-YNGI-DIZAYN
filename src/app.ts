import express from 'express';
import cors from 'cors';
import { query } from './config/db';
import authRoutes from './routes/auth.routes'; // <-- QO'SHILGAN QATOR

const app = express();

// Middleware'lar - TO'G'RI TARTIB:
app.use(cors()); // 1. CORS birinchi
app.use(express.json()); // 2. JSON parser
app.use(express.urlencoded({ extended: true })); // 3. Form data parser (login.html uchun)

// Asosiy routerlar
app.use('/api/auth', authRoutes); // <-- QO'SHILGAN QATOR

// Test uchun (Bazaga ulanishni tekshirish)
app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error });
  }
});

export default app;
