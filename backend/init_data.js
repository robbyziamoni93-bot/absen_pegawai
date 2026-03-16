// Script untuk initialize data awal dengan password yang benar
import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import fs from 'fs';

const initializeData = async () => {
  try {
    console.log('Memulai inisialisasi data...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const pegawaiPassword = await bcrypt.hash('pegawai123', 10);

    console.log('Password berhasil di-hash');

    // Insert admin
    await pool.execute(`
      INSERT INTO users (username, password, nama_lengkap, level, status_aktif) 
      VALUES (?, ?, ?, 'admin', 'Y')
    `, ['admin', adminPassword, 'Administrator']);

    console.log('Admin berhasil ditambahkan');

    // Insert jabatan
    await pool.execute(`INSERT INTO jabatan (nama_jabatan) VALUES ('Manager')`);
    await pool.execute(`INSERT INTO jabatan (nama_jabatan) VALUES ('Supervisor')`);
    await pool.execute(`INSERT INTO jabatan (nama_jabatan) VALUES ('Staff')`);
    await pool.execute(`INSERT INTO jabatan (nama_jabatan) VALUES ('Admin')`);
    await pool.execute(`INSERT INTO jabatan (nama_jabatan) VALUES ('Security')`);

    console.log('Jabatan berhasil ditambahkan');

    // Insert jam kerja
    await pool.execute(`INSERT INTO jam_kerja (nama_shift, jam_masuk, jam_pulang) VALUES ('Pagi', '08:00:00', '17:00:00')`);
    await pool.execute(`INSERT INTO jam_kerja (nama_shift, jam_masuk, jam_pulang) VALUES ('Siang', '13:00:00', '22:00:00')`);
    await pool.execute(`INSERT INTO jam_kerja (nama_shift, jam_masuk, jam_pulang) VALUES ('Malam', '22:00:00', '08:00:00')`);

    console.log('Jam kerja berhasil ditambahkan');

    // Insert pegawai contoh
    await pool.execute(`
      INSERT INTO users (username, password, nama_lengkap, level, id_jabatan, id_jam, nip, status_aktif) 
      VALUES (?, ?, ?, 'pegawai', 3, 1, 'PEG001', 'Y')
    `, ['john', pegawaiPassword, 'John Doe']);

    await pool.execute(`
      INSERT INTO users (username, password, nama_lengkap, level, id_jabatan, id_jam, nip, status_aktif) 
      VALUES (?, ?, ?, 'pegawai', 3, 1, 'PEG002', 'Y')
    `, ['jane', pegawaiPassword, 'Jane Smith']);

    await pool.execute(`
      INSERT INTO users (username, password, nama_lengkap, level, id_jabatan, id_jam, nip, status_aktif) 
      VALUES (?, ?, ?, 'pegawai', 2, 1, 'PEG003', 'Y')
    `, ['bob', pegawaiPassword, 'Bob Wilson']);

    console.log('Pegawai contoh berhasil ditambahkan');

    console.log('\n===========================================');
    console.log('✅ Inisialisasi data selesai!');
    console.log('===========================================');
    console.log('\nLogin credentials:');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nPegawai:');
    console.log('  Username: john | Password: pegawai123');
    console.log('  Username: jane | Password: pegawai123');
    console.log('  Username: bob  | Password: pegawai123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

initializeData();
