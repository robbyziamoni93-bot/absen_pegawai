import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import presensiRoutes from './routes/presensi.js';
import userRoutes from './routes/users.js';
import cutiRoutes from './routes/cuti.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/presensi', presensiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cuti', cutiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Absensi Pegawai berjalan' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
