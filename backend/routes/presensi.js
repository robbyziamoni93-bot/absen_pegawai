import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Dapatkan presensi hari ini untuk user yang login
router.get('/hari-ini', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [rows] = await pool.execute(
      'SELECT * FROM presensi WHERE id_user = ? AND tanggal = ?',
      [req.user.id_user, today]
    );

    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Absen datang
router.post('/datang', verifyToken, async (req, res) => {
  try {
    const { lokasi_gps, keterangan } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const jam_datang = now.toTimeString().split(' ')[0];

    // Cek apakah sudah absen hari ini
    const [existing] = await pool.execute(
      'SELECT * FROM presensi WHERE id_user = ? AND tanggal = ?',
      [req.user.id_user, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Anda sudah absen datang hari ini' });
    }

    // Dapatkan jam kerja user
    const [jamKerjaRows] = await pool.execute(
      `SELECT jk.* FROM jam_kerja jk 
       JOIN users u ON u.id_jam = jk.id_jam 
       WHERE u.id_user = ?`,
      [req.user.id_user]
    );

    let status_kehadiran = 'Tepat Waktu';
    
    if (jamKerjaRows.length > 0) {
      const jamKerja = jamKerjaRows[0];
      const jamMasuk = jamKerja.jam_masuk;
      
      // Bandingkan jam datang dengan jam masuk
      if (jam_datang > jamMasuk) {
        status_kehadiran = 'Terlambat';
      }
    }

    await pool.execute(
      `INSERT INTO presensi (id_user, tanggal, jam_datang, lokasi_gps, keterangan, status_kehadiran) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id_user, today, jam_datang, lokasi_gps, keterangan || 'Hadir', status_kehadiran]
    );

    res.json({ 
      message: 'Absen datang berhasil', 
      jam_datang,
      status_kehadiran 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Absen pulang
router.post('/pulang', verifyToken, async (req, res) => {
  try {
    const { lokasi_gps } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const jam_pulang = now.toTimeString().split(' ')[0];

    // Cek apakah sudah absen datang hari ini
    const [existing] = await pool.execute(
      'SELECT * FROM presensi WHERE id_user = ? AND tanggal = ?',
      [req.user.id_user, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: 'Anda belum absen datang hari ini' });
    }

    if (existing[0].jam_pulang) {
      return res.status(400).json({ message: 'Anda sudah absen pulang hari ini' });
    }

    // Dapatkan jam kerja user
    const [jamKerjaRows] = await pool.execute(
      `SELECT jk.* FROM jam_kerja jk 
       JOIN users u ON u.id_jam = jk.id_jam 
       WHERE u.id_user = ?`,
      [req.user.id_user]
    );

    let status_kehadiran = existing[0].status_kehadiran;
    
    if (jamKerjaRows.length > 0) {
      const jamKerja = jamKerjaRows[0];
      const jamPulangKerja = jamKerja.jam_pulang;
      
      // Bandingkan jam pulang dengan jam pulang kerja
      if (jam_pulang < jamPulangKerja) {
        status_kehadiran = 'Pulang Cepat';
      }
    }

    await pool.execute(
      'UPDATE presensi SET jam_pulang = ?, lokasi_gps = ?, status_kehadiran = ? WHERE id_user = ? AND tanggal = ?',
      [jam_pulang, lokasi_gps, status_kehadiran, req.user.id_user, today]
    );

    res.json({ 
      message: 'Absen pulang berhasil', 
      jam_pulang 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Riwayat presensi user
router.get('/riwayat', verifyToken, async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    let query = 'SELECT p.*, u.nama_lengkap FROM presensi p JOIN users u ON p.id_user = u.id_user WHERE p.id_user = ?';
    const params = [req.user.id_user];

    if (bulan && tahun) {
      query += ' AND MONTH(p.tanggal) = ? AND YEAR(p.tanggal) = ?';
      params.push(bulan, tahun);
    }

    query += ' ORDER BY p.tanggal DESC';

    const [rows] = await pool.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
