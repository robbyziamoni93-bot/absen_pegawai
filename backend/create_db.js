import mysql from 'mysql2/promise';

async function setupDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mysql1234!',
      multipleStatements: true
    });

    const queries = `
-- 1. Membuat Database
CREATE DATABASE IF NOT EXISTS db_absensi_pegawai;
USE db_absensi_pegawai;

-- 2. Tabel Jabatan
CREATE TABLE IF NOT EXISTS jabatan (
    id_jabatan INT AUTO_INCREMENT PRIMARY KEY,
    nama_jabatan VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 3. Tabel Jam Kerja
CREATE TABLE IF NOT EXISTS jam_kerja (
    id_jam INT AUTO_INCREMENT PRIMARY KEY,
    nama_shift VARCHAR(20) NOT NULL,
    jam_masuk TIME NOT NULL,
    jam_pulang TIME NOT NULL
) ENGINE=InnoDB;

-- 4. Tabel Users (Kombinasi Admin & Pegawai)
CREATE TABLE IF NOT EXISTS users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    level ENUM('admin', 'pegawai') NOT NULL,
    id_jabatan INT,
    id_jam INT,
    nip VARCHAR(20) UNIQUE,
    status_aktif ENUM('Y', 'N') DEFAULT 'Y',
    FOREIGN KEY (id_jabatan) REFERENCES jabatan(id_jabatan) ON DELETE SET NULL,
    FOREIGN KEY (id_jam) REFERENCES jam_kerja(id_jam) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabel Presensi
CREATE TABLE IF NOT EXISTS presensi (
    id_presensi INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    tanggal DATE NOT NULL,
    jam_datang TIME,
    jam_pulang TIME,
    lokasi_gps TEXT,
    keterangan ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') DEFAULT 'Hadir',
    status_kehadiran ENUM('Tepat Waktu', 'Terlambat', 'Pulang Cepat') DEFAULT 'Tepat Waktu',
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabel Cuti
CREATE TABLE IF NOT EXISTS cuti (
    id_cuti INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    tgl_mulai DATE NOT NULL,
    tgl_selesai DATE NOT NULL,
    alasan TEXT,
    status_pengajuan ENUM('Pending', 'Disetujui', 'Ditolak') DEFAULT 'Pending',
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;
    `;

    console.log("Menjalankan query pembuatan database...");
    await connection.query(queries);
    console.log("Database dan tabel berhasil dibuat.");
    await connection.end();
  } catch (err) {
    console.error("Error setting up DB:", err);
  }
}

setupDB();
