-- Data awal untuk aplikasi absensi pegawai
-- Gunakan script ini setelah membuat database dengan query di db.md

USE db_absensi_pegawai;

-- 1. Insert data jabatan
INSERT INTO jabatan (nama_jabatan) VALUES
('Manager'),
('Supervisor'),
('Staff'),
('Admin'),
('Security');

-- 2. Insert data jam kerja (shift)
INSERT INTO jam_kerja (nama_shift, jam_masuk, jam_pulang) VALUES
('Pagi', '08:00:00', '17:00:00'),
('Siang', '13:00:00', '22:00:00'),
('Malam', '22:00:00', '08:00:00');

-- 3. Insert user admin
-- Password: admin123 (sudah di-hash dengan bcrypt)
INSERT INTO users (username, password, nama_lengkap, level, status_aktif) VALUES
('admin', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Administrator', 'admin', 'Y');

-- Catatan: Password di atas adalah placeholder. 
-- Gunakan script PHP/Node.js berikut untuk generate password hash:
-- bcrypt.hash('admin123', 10) untuk admin
-- bcrypt.hash('pegawai123', 10) untuk pegawai

-- 4. Insert data pegawai contoh
-- Password: pegawai123 (sudah di-hash dengan bcrypt)
INSERT INTO users (username, password, nama_lengkap, level, id_jabatan, id_jam, nip, status_aktif) VALUES
('john', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'John Doe', 'pegawai', 3, 1, 'PEG001', 'Y'),
('jane', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Jane Smith', 'pegawai', 3, 1, 'PEG002', 'Y'),
('bob', '$2a$10$rMx9YQYxQYxQYxQYxQYxQuQYxQYxQYxQYxQYxQYxQYxQYxQYxQYxQ', 'Bob Wilson', 'pegawai', 2, 1, 'PEG003', 'Y');

-- Catatan: Password hash di atas adalah placeholder.
-- Jalankan script init_data.js untuk insert data dengan password yang benar.
