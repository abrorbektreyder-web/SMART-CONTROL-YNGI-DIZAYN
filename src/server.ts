import app from './app';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Server ishga tushganda bazani avtomatik sozlash
const startServer = async () => {
  // Jadvallarni yaratish (agar yo'q bo'lsa)
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  });
};

startServer();
