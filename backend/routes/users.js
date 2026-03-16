import express from 'express';
import pool from '../config/database.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';

const router = express.Router();

// Dapatkan semua jabatan (untuk dropdown)
router.get('/jabatan', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM jabatan ORDER BY nama_jabatan ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Dapatkan semua jam kerja (untuk dropdown)
router.get('/jam-kerja', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM jam_kerja ORDER BY nama_shift ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Dapatkan semua pegawai (hanya admin)
router.get('/pegawai', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.*, j.nama_jabatan, jk.nama_shift
       FROM users u
       LEFT JOIN jabatan j ON u.id_jabatan = j.id_jabatan
       LEFT JOIN jam_kerja jk ON u.id_jam = jk.id_jam
       WHERE u.level = 'pegawai'
       ORDER BY u.nama_lengkap ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Tambah pegawai baru (hanya admin)
router.post('/pegawai', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, password, nama_lengkap, nip, id_jabatan, id_jam, status_aktif } = req.body;

    // Validasi field wajib
    if (!username || !password || !nama_lengkap) {
      return res.status(400).json({ message: 'Username, password, dan nama lengkap wajib diisi' });
    }

    // Cek username sudah ada atau belum
    const [existingUsername] = await pool.execute(
      'SELECT id_user FROM users WHERE username = ?',
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Cek NIP sudah ada atau belum (jika diisi)
    if (nip) {
      const [existingNip] = await pool.execute(
        'SELECT id_user FROM users WHERE nip = ?',
        [nip]
      );

      if (existingNip.length > 0) {
        return res.status(400).json({ message: 'NIP sudah digunakan' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert pegawai baru
    const [result] = await pool.execute(
      `INSERT INTO users (username, password, nama_lengkap, level, nip, id_jabatan, id_jam, status_aktif)
       VALUES (?, ?, ?, 'pegawai', ?, ?, ?, ?)`,
      [username, hashedPassword, nama_lengkap, nip || null, id_jabatan || null, id_jam || null, status_aktif || 'Y']
    );

    res.status(201).json({
      message: 'Pegawai berhasil ditambahkan',
      id_user: result.insertId
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update data pegawai (hanya admin)
router.put('/pegawai/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama_lengkap, nip, id_jabatan, id_jam, status_aktif } = req.body;

    // Cek apakah user ada
    const [existingUser] = await pool.execute(
      'SELECT id_user FROM users WHERE id_user = ? AND level = "pegawai"',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
    }

    // Cek username sudah digunakan oleh user lain
    if (username) {
      const [existingUsername] = await pool.execute(
        'SELECT id_user FROM users WHERE username = ? AND id_user != ? AND level = "pegawai"',
        [username, id]
      );

      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
    }

    // Cek NIP sudah digunakan oleh user lain
    if (nip) {
      const [existingNip] = await pool.execute(
        'SELECT id_user FROM users WHERE nip = ? AND id_user != ? AND level = "pegawai"',
        [nip, id]
      );

      if (existingNip.length > 0) {
        return res.status(400).json({ message: 'NIP sudah digunakan' });
      }
    }

    // Build query update
    let query = 'UPDATE users SET ';
    const params = [];

    if (username) {
      params.push(`username = ?`);
      params.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(`password = ?`);
      params.push(hashedPassword);
    }

    if (nama_lengkap) {
      params.push(`nama_lengkap = ?`);
      params.push(nama_lengkap);
    }

    params.push(`nip = ?`);
    params.push(nip || null);

    params.push(`id_jabatan = ?`);
    params.push(id_jabatan || null);

    params.push(`id_jam = ?`);
    params.push(id_jam || null);

    params.push(`status_aktif = ?`);
    params.push(status_aktif || 'Y');

    query += params.slice(0, -1).join(', ');
    query += ' WHERE id_user = ?';
    params.push(id);

    // Remove the params that were added for tracking
    const finalParams = [];
    let paramIndex = 0;
    
    const updates = [];
    if (username) {
      updates.push('username = ?');
      finalParams.push(username);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      finalParams.push(hashedPassword);
    }
    if (nama_lengkap) {
      updates.push('nama_lengkap = ?');
      finalParams.push(nama_lengkap);
    }
    finalParams.push(nip || null, id_jabatan || null, id_jam || null, status_aktif || 'Y', id);

    const finalQuery = `UPDATE users SET ${updates.join(', ')} WHERE id_user = ?`;

    await pool.execute(finalQuery, finalParams);

    res.json({ message: 'Data pegawai berhasil diupdate' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Hapus pegawai (hanya admin)
router.delete('/pegawai/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah user ada
    const [existingUser] = await pool.execute(
      'SELECT id_user FROM users WHERE id_user = ? AND level = "pegawai"',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
    }

    // Hapus pegawai (presensi dan cuti akan terhapus otomatis karena ON DELETE CASCADE)
    await pool.execute('DELETE FROM users WHERE id_user = ? AND level = "pegawai"', [id]);

    res.json({ message: 'Pegawai berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Admin tambah keterangan ketidakhadiran untuk pegawai
router.post('/presensi/keterangan', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id_user, tanggal, keterangan, catatan } = req.body;

    console.log('Request body:', req.body);

    // Validasi field wajib
    if (!id_user || !tanggal || !keterangan) {
      return res.status(400).json({ 
        message: 'ID user, tanggal, dan keterangan wajib diisi',
        received: { id_user, tanggal, keterangan }
      });
    }

    // Validasi keterangan
    const keteranganValid = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
    if (!keteranganValid.includes(keterangan)) {
      return res.status(400).json({ message: 'Keterangan tidak valid' });
    }

    // Convert id_user ke number jika berupa string
    const userId = typeof id_user === 'string' ? parseInt(id_user, 10) : id_user;

    // Cek apakah sudah ada presensi untuk tanggal tersebut
    const [existing] = await pool.execute(
      'SELECT id_presensi FROM presensi WHERE id_user = ? AND tanggal = ?',
      [userId, tanggal]
    );

    if (existing.length > 0) {
      // Update presensi yang sudah ada
      await pool.execute(
        `UPDATE presensi SET keterangan = ?, catatan = ? WHERE id_user = ? AND tanggal = ?`,
        [keterangan, catatan || null, userId, tanggal]
      );

      res.json({ message: 'Keterangan presensi berhasil diupdate' });
    } else {
      // Insert presensi baru
      await pool.execute(
        `INSERT INTO presensi (id_user, tanggal, keterangan, catatan, status_kehadiran)
         VALUES (?, ?, ?, ?, 'Tepat Waktu')`,
        [userId, tanggal, keterangan, catatan || null]
      );

      res.status(201).json({ message: 'Keterangan presensi berhasil ditambahkan' });
    }
  } catch (error) {
    console.error('Error detail:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan pada server',
      error: error.message 
    });
  }
});

// Dapatkan semua presensi (hanya admin)
router.get('/presensi', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { tanggal, id_user } = req.query;
    
    let query = `
      SELECT p.*, u.nama_lengkap, u.nip, j.nama_jabatan 
      FROM presensi p 
      JOIN users u ON p.id_user = u.id_user 
      LEFT JOIN jabatan j ON u.id_jabatan = j.id_jabatan 
      WHERE u.level = 'pegawai'
    `;
    const params = [];

    if (tanggal) {
      query += ' AND p.tanggal = ?';
      params.push(tanggal);
    }

    if (id_user) {
      query += ' AND p.id_user = ?';
      params.push(id_user);
    }

    query += ' ORDER BY p.tanggal DESC, p.jam_datang DESC';

    const [rows] = await pool.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Statistik absensi per hari (hanya admin)
router.get('/statistik', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { tanggal } = req.query;
    const today = tanggal || new Date().toISOString().split('T')[0];

    const [totalPegawai] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE level = 'pegawai' AND status_aktif = 'Y'"
    );

    const [hadir] = await pool.execute(
      'SELECT COUNT(*) as total FROM presensi WHERE tanggal = ? AND keterangan = "Hadir"',
      [today]
    );

    const [izin] = await pool.execute(
      'SELECT COUNT(*) as total FROM presensi WHERE tanggal = ? AND keterangan = "Izin"',
      [today]
    );

    const [sakit] = await pool.execute(
      'SELECT COUNT(*) as total FROM presensi WHERE tanggal = ? AND keterangan = "Sakit"',
      [today]
    );

    const [alpha] = await pool.execute(
      'SELECT COUNT(*) as total FROM presensi WHERE tanggal = ? AND keterangan = "Alpha"',
      [today]
    );

    const [terlambat] = await pool.execute(
      'SELECT COUNT(*) as total FROM presensi WHERE tanggal = ? AND status_kehadiran = "Terlambat"',
      [today]
    );

    res.json({
      tanggal: today,
      total_pegawai: totalPegawai[0].total,
      hadir: hadir[0].total,
      izin: izin[0].total,
      sakit: sakit[0].total,
      alpha: alpha[0].total,
      terlambat: terlambat[0].total
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update status cuti (hanya admin)
router.put('/cuti/:id_cuti/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id_cuti } = req.params;
    const { status_pengajuan } = req.body;

    if (!['Pending', 'Disetujui', 'Ditolak'].includes(status_pengajuan)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await pool.execute(
      'UPDATE cuti SET status_pengajuan = ? WHERE id_cuti = ?',
      [status_pengajuan, id_cuti]
    );

    res.json({ message: 'Status cuti berhasil diupdate' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Export presensi ke Excel
router.get('/presensi/export-excel', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { tanggal_mulai, tanggal_selesai } = req.query;

    if (!tanggal_mulai || !tanggal_selesai) {
      return res.status(400).json({ message: 'Tanggal mulai dan selesai wajib diisi' });
    }

    // Ambil data presensi dengan join ke users, jabatan, dan jam_kerja
    const [rows] = await pool.execute(
      `SELECT 
        p.*,
        u.nama_lengkap,
        u.nip,
        j.nama_jabatan,
        jk.nama_shift,
        jk.jam_masuk,
        jk.jam_pulang
       FROM presensi p
       JOIN users u ON p.id_user = u.id_user
       LEFT JOIN jabatan j ON u.id_jabatan = j.id_jabatan
       LEFT JOIN jam_kerja jk ON u.id_jam = jk.id_jam
       WHERE p.tanggal BETWEEN ? AND ?
       ORDER BY p.tanggal DESC, u.nama_lengkap ASC`,
      [tanggal_mulai, tanggal_selesai]
    );

    // Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Presensi');

    // Set column widths
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 12 },
      { header: 'NIP', key: 'nip', width: 15 },
      { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
      { header: 'Jabatan', key: 'nama_jabatan', width: 20 },
      { header: 'Shift', key: 'nama_shift', width: 12 },
      { header: 'Jam Masuk', key: 'jam_masuk', width: 12 },
      { header: 'Jam Pulang', key: 'jam_pulang', width: 12 },
      { header: 'Jam Datang', key: 'jam_datang', width: 12 },
      { header: 'Jam Pulang', key: 'jam_pulang_actual', width: 12 },
      { header: 'Keterangan', key: 'keterangan', width: 15 },
      { header: 'Status Kehadiran', key: 'status_kehadiran', width: 18 },
      { header: 'Catatan', key: 'catatan', width: 30 }
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows
    rows.forEach((row, index) => {
      const dataRow = {
        no: index + 1,
        tanggal: row.tanggal,
        nip: row.nip || '-',
        nama_lengkap: row.nama_lengkap,
        nama_jabatan: row.nama_jabatan || '-',
        nama_shift: row.nama_shift || '-',
        jam_masuk: row.jam_masuk ? row.jam_masuk.toString() : '-',
        jam_pulang: row.jam_pulang ? row.jam_pulang.toString() : '-',
        jam_datang: row.jam_datang || '-',
        jam_pulang_actual: row.jam_pulang_actual || row.jam_pulang || '-',
        keterangan: row.keterangan,
        status_kehadiran: row.status_kehadiran,
        catatan: row.catatan || '-'
      };
      const worksheetRow = worksheet.addRow(dataRow);

      // Add borders to data rows
      worksheetRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary section
    const summaryRow = worksheet.addRow([]);
    const totalHadir = rows.filter(r => r.keterangan === 'Hadir').length;
    const totalIzin = rows.filter(r => r.keterangan === 'Izin').length;
    const totalSakit = rows.filter(r => r.keterangan === 'Sakit').length;
    const totalAlpha = rows.filter(r => r.keterangan === 'Alpha').length;
    const totalTerlambat = rows.filter(r => r.status_kehadiran === 'Terlambat').length;

    worksheet.addRow(['Ringkasan:', '', '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Hadir', totalHadir, '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Izin', totalIzin, '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Sakit', totalSakit, '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Alpha', totalAlpha, '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Terlambat', totalTerlambat, '', '', '', '', '', '', '', '', '', '', '']);
    worksheet.addRow(['Total Record', rows.length, '', '', '', '', '', '', '', '', '', '', '']);

    // Set headers for title
    worksheet.mergeCells('A1:L1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = `LAPORAN PRESENSI PEGAWAI\nPeriode: ${tanggal_mulai} s/d ${tanggal_selesai}`;
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.getCell(1).font = { size: 14, bold: true };

    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Laporan_Presensi_${tanggal_mulai}_s/d_${tanggal_selesai}.xlsx"`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error export Excel:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
