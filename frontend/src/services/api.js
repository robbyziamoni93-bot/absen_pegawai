import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const gantiPassword = (password_lama, password_baru, konfirmasi_password) =>
  api.post('/auth/ganti-password', { password_lama, password_baru, konfirmasi_password });

// Presensi
export const getPresensiHariIni = () => api.get('/presensi/hari-ini');
export const absenDatang = (lokasi_gps, keterangan) => api.post('/presensi/datang', { lokasi_gps, keterangan });
export const absenPulang = (lokasi_gps) => api.post('/presensi/pulang', { lokasi_gps });
export const getRiwayatPresensi = (bulan, tahun) => api.get('/presensi/riwayat', { params: { bulan, tahun } });

// Admin - Users
export const getAllPegawai = () => api.get('/users/pegawai');
export const getAllPresensi = (tanggal, id_user) => api.get('/users/presensi', { params: { tanggal, id_user } });
export const getStatistik = (tanggal) => api.get('/users/statistik', { params: { tanggal } });
export const updateStatusCuti = (id_cuti, status_pengajuan) => api.put(`/users/cuti/${id_cuti}/status`, { status_pengajuan });
export const getJabatan = () => api.get('/users/jabatan');
export const getJamKerja = () => api.get('/users/jam-kerja');
export const addPegawai = (data) => api.post('/users/pegawai', data);
export const updatePegawai = (id, data) => api.put(`/users/pegawai/${id}`, data);
export const deletePegawai = (id) => api.delete(`/users/pegawai/${id}`);
export const addKeteranganPresensi = (data) => api.post('/users/presensi/keterangan', data);
export const exportPresensiExcel = (tanggal_mulai, tanggal_selesai) =>
  api.get('/users/presensi/export-excel', {
    params: { tanggal_mulai, tanggal_selesai },
    responseType: 'blob'
  });

// Cuti
export const getRiwayatCuti = () => api.get('/cuti/riwayat');
export const ajukanCuti = (tgl_mulai, tgl_selesai, alasan) => api.post('/cuti/ajukan', { tgl_mulai, tgl_selesai, alasan });
export const getAllCuti = () => api.get('/cuti/all');

export default api;
