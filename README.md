# Sistem Absensi Pegawai

Aplikasi absensi pegawai berbasis web menggunakan React (Frontend) dan Node.js + MySQL (Backend).

## 📋 Fitur

### Admin
- Dashboard dengan statistik absensi harian
- Melihat data presensi semua pegawai
- Melihat data pegawai
- Mengelola pengajuan cuti (setujui/tolak)
- CRUD data pegawai
- menambah keterangan sakit, izin, aplha pada pegawai

### Pegawai
- Absen datang dengan lokasi GPS
- Absen pulang dengan lokasi GPS
- Melihat riwayat absensi
- Mengajukan cuti online
- Melihat status pengajuan cuti

## 🛠️ Teknologi

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs

## 📁 Struktur Project

```
absen_pegawai/
├── frontend/          # React frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── backend/           # Node.js backend
    ├── config/
    ├── middleware/
    ├── routes/
    └── init_data.js
```

## 🚀 Cara Instalasi

### 1. Setup Database

Pastikan MySQL sudah terinstall, lalu jalankan query SQL dari file `db.md`:

```sql
-- Copy semua query dari db.md dan jalankan di MySQL
```

### 2. Setup Backend

```bash
cd backend
npm install

# Inisialisasi data awal (admin, pegawai contoh, jabatan, jam kerja)
node init_data.js

# Jalankan server
npm start
# atau untuk development
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 🔐 Login Credentials (Setelah init_data.js)

### Admin
- Username: `admin`
- Password: `admin123`

### Pegawai
- Username: `john` | Password: `pegawai123`
- Username: `jane` | Password: `pegawai123`
- Username: `bob`  | Password: `pegawai123`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Presensi (Pegawai)
- `GET /api/presensi/hari-ini` - Get presensi hari ini
- `POST /api/presensi/datang` - Absen datang
- `POST /api/presensi/pulang` - Absen pulang
- `GET /api/presensi/riwayat` - Riwayat presensi

### Admin Endpoints
- `GET /api/users/pegawai` - Daftar pegawai
- `GET /api/users/presensi` - Data presensi semua pegawai
- `GET /api/users/statistik` - Statistik absensi
- `PUT /api/users/cuti/:id/status` - Update status cuti

### Cuti
- `GET /api/cuti/riwayat` - Riwayat cuti user
- `POST /api/cuti/ajukan` - Ajukan cuti baru
- `GET /api/cuti/all` - Semua pengajuan cuti (admin)

## 🔧 Konfigurasi

Edit file `backend/.env` untuk konfigurasi database:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql1234!
DB_NAME=db_absensi_pegawai
DB_PORT=3306
JWT_SECRET=absensi_pegawai_secret_key_2024
PORT=5000
```

## 📱 Cara Penggunaan

### Untuk Pegawai:
1. Buka aplikasi di browser
2. Login dengan username dan password pegawai
3. Klik "Absen Datang" saat datang kerja
4. Klik "Absen Pulang" saat pulang kerja
5. Untuk mengajukan cuti, buka tab "Pengajuan Cuti"

### Untuk Admin:
1. Buka aplikasi di browser
2. Login dengan username dan password admin
3. Dashboard menampilkan statistik absensi hari ini
4. Tab "Data Presensi" untuk melihat semua presensi
5. Tab "Data Pegawai" untuk melihat daftar pegawai
6. Tab "Pengajuan Cuti" untuk menyetujui/menolak cuti

## ⚠️ Catatan Penting

- Pastikan GPS aktif saat melakukan absensi
- Aplikasi ini menggunakan lokasi GPS untuk validasi absensi
- Password di-hash menggunakan bcrypt untuk keamanan


