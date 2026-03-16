import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND status_aktif = "Y"',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username tidak ditemukan atau tidak aktif' });
    }

    const user = rows[0];

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Buat token JWT
    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        level: user.level,
        nama_lengkap: user.nama_lengkap
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id_user: user.id_user,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        level: user.level,
        nip: user.nip,
        id_jabatan: user.id_jabatan,
        id_jam: user.id_jam
      }
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Ganti Password
router.post('/ganti-password', verifyToken, async (req, res) => {
  try {
    const { password_lama, password_baru, konfirmasi_password } = req.body;

    // Validasi field wajib
    if (!password_lama || !password_baru || !konfirmasi_password) {
      return res.status(400).json({ message: 'Semua field password harus diisi' });
    }

    // Validasi konfirmasi password
    if (password_baru !== konfirmasi_password) {
      return res.status(400).json({ message: 'Konfirmasi password tidak cocok' });
    }

    // Validasi panjang password minimal
    if (password_baru.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    }

    // Ambil data user
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id_user = ?',
      [req.user.id_user]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = rows[0];

    // Verifikasi password lama
    const isValidPassword = await bcrypt.compare(password_lama, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Password lama salah' });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password_baru, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id_user = ?',
      [hashedPassword, req.user.id_user]
    );

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error ganti password:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
