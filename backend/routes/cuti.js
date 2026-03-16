import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Dapatkan pengajuan cuti user
router.get('/riwayat', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT c.*, u.nama_lengkap FROM cuti c JOIN users u ON c.id_user = u.id_user WHERE c.id_user = ? ORDER BY c.tgl_mulai DESC',
      [req.user.id_user]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Ajukan cuti baru
router.post('/ajukan', verifyToken, async (req, res) => {
  try {
    const { tgl_mulai, tgl_selesai, alasan } = req.body;

    if (!tgl_mulai || !tgl_selesai || !alasan) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    await pool.execute(
      'INSERT INTO cuti (id_user, tgl_mulai, tgl_selesai, alasan, status_pengajuan) VALUES (?, ?, ?, ?, "Pending")',
      [req.user.id_user, tgl_mulai, tgl_selesai, alasan]
    );

    res.json({ message: 'Pengajuan cuti berhasil dikirim' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Dapatkan semua pengajuan cuti (hanya admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, u.nama_lengkap, u.nip 
       FROM cuti c 
       JOIN users u ON c.id_user = u.id_user 
       ORDER BY c.tgl_mulai DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
