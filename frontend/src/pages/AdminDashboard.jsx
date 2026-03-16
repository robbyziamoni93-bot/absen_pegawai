import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllPresensi, getAllPegawai, getStatistik, updateStatusCuti, getAllCuti, getJabatan, getJamKerja, addPegawai, updatePegawai, deletePegawai, addKeteranganPresensi, exportPresensiExcel, gantiPassword } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [statistik, setStatistik] = useState(null);
  const [presensi, setPresensi] = useState([]);
  const [pegawai, setPegawai] = useState([]);
  const [cuti, setCuti] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [jabatan, setJabatan] = useState([]);
  const [jamKerja, setJamKerja] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState(null);
  const [showKeteranganModal, setShowKeteranganModal] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_lengkap: '',
    nip: '',
    id_jabatan: '',
    id_jam: '',
    status_aktif: 'Y'
  });
  const [keteranganForm, setKeteranganForm] = useState({
    id_user: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: 'Izin',
    catatan: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password_lama: '',
    password_baru: '',
    konfirmasi_password: ''
  });
  const [exportDateRange, setExportDateRange] = useState({
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStatistik();
    fetchPresensi();
    fetchPegawai();
    fetchCuti();
    fetchJabatan();
    fetchJamKerja();
  }, [selectedDate]);

  const fetchJabatan = async () => {
    try {
      const response = await getJabatan();
      setJabatan(response.data);
    } catch (error) {
      console.error('Error fetching jabatan:', error);
    }
  };

  const fetchJamKerja = async () => {
    try {
      const response = await getJamKerja();
      setJamKerja(response.data);
    } catch (error) {
      console.error('Error fetching jam kerja:', error);
    }
  };

  const fetchStatistik = async () => {
    try {
      const response = await getStatistik(selectedDate);
      setStatistik(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPresensi = async () => {
    try {
      const response = await getAllPresensi(selectedDate);
      setPresensi(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPegawai = async () => {
    try {
      const response = await getAllPegawai();
      setPegawai(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCuti = async () => {
    try {
      const response = await getAllCuti();
      setCuti(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateCuti = async (id_cuti, status) => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status.toLowerCase()} pengajuan cuti ini?`)) {
      return;
    }

    setLoading(true);
    try {
      await updateStatusCuti(id_cuti, status);
      alert(`Pengajuan cuti berhasil ${status.toLowerCase()}`);
      fetchCuti();
    } catch (error) {
      alert('Gagal update status cuti');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pegawai = null) => {
    if (pegawai) {
      setEditingPegawai(pegawai);
      setFormData({
        username: pegawai.username || '',
        password: '',
        nama_lengkap: pegawai.nama_lengkap || '',
        nip: pegawai.nip || '',
        id_jabatan: pegawai.id_jabatan || '',
        id_jam: pegawai.id_jam || '',
        status_aktif: pegawai.status_aktif || 'Y'
      });
    } else {
      setEditingPegawai(null);
      setFormData({
        username: '',
        password: '',
        nama_lengkap: '',
        nip: '',
        id_jabatan: '',
        id_jam: '',
        status_aktif: 'Y'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPegawai(null);
    setFormData({
      username: '',
      password: '',
      nama_lengkap: '',
      nip: '',
      id_jabatan: '',
      id_jam: '',
      status_aktif: 'Y'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPegawai = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.nama_lengkap) {
      alert('Username dan nama lengkap wajib diisi');
      return;
    }

    if (!editingPegawai && !formData.password) {
      alert('Password wajib diisi untuk pegawai baru');
      return;
    }

    setLoading(true);
    try {
      const dataToSend = { ...formData };
      if (editingPegawai && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingPegawai) {
        await updatePegawai(editingPegawai.id_user, dataToSend);
        alert('Data pegawai berhasil diupdate');
      } else {
        await addPegawai(dataToSend);
        alert('Pegawai baru berhasil ditambahkan');
      }

      handleCloseModal();
      fetchPegawai();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan data pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePegawai = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pegawai "${nama}"? Data presensi dan cuti juga akan terhapus.`)) {
      return;
    }

    setLoading(true);
    try {
      await deletePegawai(id);
      alert('Pegawai berhasil dihapus');
      fetchPegawai();
    } catch (error) {
      alert('Gagal menghapus pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenKeteranganModal = (pegawai = null) => {
    setSelectedPegawai(pegawai);
    setKeteranganForm({
      id_user: pegawai ? pegawai.id_user : '',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: 'Izin',
      catatan: ''
    });
    setShowKeteranganModal(true);
  };

  const handleCloseKeteranganModal = () => {
    setShowKeteranganModal(false);
    setSelectedPegawai(null);
    setKeteranganForm({
      id_user: '',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: 'Izin',
      catatan: ''
    });
  };

  const handleKeteranganInputChange = (e) => {
    const { name, value } = e.target;
    setKeteranganForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitKeterangan = async (e) => {
    e.preventDefault();

    if (!keteranganForm.id_user || !keteranganForm.tanggal || !keteranganForm.keterangan) {
      alert('Semua field wajib diisi');
      return;
    }

    console.log('Data yang dikirim:', keteranganForm);

    setLoading(true);
    try {
      const response = await addKeteranganPresensi(keteranganForm);
      console.log('Response:', response);
      alert('Keterangan berhasil disimpan');
      handleCloseKeteranganModal();
      fetchPresensi();
    } catch (error) {
      console.error('Error detail:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || error.message || 'Gagal menyimpan keterangan');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.password_lama || !passwordForm.password_baru || !passwordForm.konfirmasi_password) {
      alert('Semua field password harus diisi');
      return;
    }

    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      alert('Konfirmasi password tidak cocok');
      return;
    }

    if (passwordForm.password_baru.length < 6) {
      alert('Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await gantiPassword(passwordForm.password_lama, passwordForm.password_baru, passwordForm.konfirmasi_password);
      alert('Password berhasil diubah');
      setShowPasswordModal(false);
      setPasswordForm({ password_lama: '', password_baru: '', konfirmasi_password: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!exportDateRange.tanggal_mulai || !exportDateRange.tanggal_selesai) {
      alert('Tanggal mulai dan selesai wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await exportPresensiExcel(exportDateRange.tanggal_mulai, exportDateRange.tanggal_selesai);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Presensi_${exportDateRange.tanggal_mulai}_s/d_${exportDateRange.tanggal_selesai}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert('Laporan berhasil diunduh');
    } catch (error) {
      alert('Gagal export laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin logout?')) {
      logout();
      navigate('/');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <h1>👨‍💼 Dashboard Admin</h1>
          <div className="header-actions-right">
            <button onClick={() => setShowPasswordModal(true)} className="btn-password">
              🔒 Ganti Password
            </button>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => setActiveTab('presensi')}
        >
          📅 Data Presensi
        </button>
        <button 
          className={`tab ${activeTab === 'pegawai' ? 'active' : ''}`}
          onClick={() => setActiveTab('pegawai')}
        >
          👥 Data Pegawai
        </button>
        <button 
          className={`tab ${activeTab === 'cuti' ? 'active' : ''}`}
          onClick={() => setActiveTab('cuti')}
        >
          🏖️ Pengajuan Cuti
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <>
            <div className="date-picker-section">
              <label>Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {statistik && (
              <div className="stat-cards">
                <div className="stat-card total">
                  <h3>Total Pegawai</h3>
                  <p className="stat-value">{statistik.total_pegawai}</p>
                </div>
                <div className="stat-card hadir">
                  <h3>Hadir</h3>
                  <p className="stat-value">{statistik.hadir}</p>
                </div>
                <div className="stat-card izin">
                  <h3>Izin</h3>
                  <p className="stat-value">{statistik.izin}</p>
                </div>
                <div className="stat-card sakit">
                  <h3>Sakit</h3>
                  <p className="stat-value">{statistik.sakit}</p>
                </div>
                <div className="stat-card alpha">
                  <h3>Alpha</h3>
                  <p className="stat-value">{statistik.alpha}</p>
                </div>
                <div className="stat-card terlambat">
                  <h3>Terlambat</h3>
                  <p className="stat-value">{statistik.terlambat}</p>
                </div>
              </div>
            )}

            <div className="recent-presensi">
              <h2>Presensi Hari Ini</h2>
              {presensi.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Jam Datang</th>
                      <th>Jam Pulang</th>
                      <th>Keterangan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presensi.slice(0, 10).map((p) => (
                      <tr key={p.id_presensi}>
                        <td>{p.nama_lengkap}</td>
                        <td>{formatTime(p.jam_datang)}</td>
                        <td>{formatTime(p.jam_pulang)}</td>
                        <td>{p.keterangan}</td>
                        <td>
                          <span className={`status-badge ${p.status_kehadiran.toLowerCase().replace(' ', '-')}`}>
                            {p.status_kehadiran}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">Belum ada data presensi untuk tanggal ini</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'presensi' && (
          <div className="data-section">
            <div className="filter-section">
              <label>Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="header-actions">
              <h2>Data Presensi - {formatDate(selectedDate)}</h2>
              <div className="header-actions-buttons">
                <button className="btn-add" onClick={() => setShowKeteranganModal(true)}>
                  + Input Keterangan
                </button>
                <button className="btn-excel" onClick={handleExportExcel}>
                  📄 Export Excel
                </button>
              </div>
            </div>

            <div className="export-date-filter">
              <label>Periode Export:</label>
              <input
                type="date"
                value={exportDateRange.tanggal_mulai}
                onChange={(e) => setExportDateRange({ ...exportDateRange, tanggal_mulai: e.target.value })}
              />
              <span>s/d</span>
              <input
                type="date"
                value={exportDateRange.tanggal_selesai}
                onChange={(e) => setExportDateRange({ ...exportDateRange, tanggal_selesai: e.target.value })}
              />
            </div>

            {presensi.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NIP</th>
                    <th>Jabatan</th>
                    <th>Jam Datang</th>
                    <th>Jam Pulang</th>
                    <th>Keterangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {presensi.map((p) => (
                    <tr key={p.id_presensi}>
                      <td>{p.nama_lengkap}</td>
                      <td>{p.nip || '-'}</td>
                      <td>{p.nama_jabatan || '-'}</td>
                      <td>{formatTime(p.jam_datang)}</td>
                      <td>{formatTime(p.jam_pulang)}</td>
                      <td>{p.keterangan}</td>
                      <td>
                        <span className={`status-badge ${p.status_kehadiran.toLowerCase().replace(' ', '-')}`}>
                          {p.status_kehadiran}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Belum ada data presensi untuk tanggal ini</p>
            )}
          </div>
        )}

        {activeTab === 'pegawai' && (
          <div className="data-section">
            <div className="header-actions">
              <h2>Data Pegawai</h2>
              <button className="btn-add" onClick={() => handleOpenModal()}>
                + Tambah Pegawai
              </button>
            </div>
            {pegawai.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NIP</th>
                    <th>Nama Lengkap</th>
                    <th>Username</th>
                    <th>Jabatan</th>
                    <th>Shift</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pegawai.map((peg) => (
                    <tr key={peg.id_user}>
                      <td>{peg.nip || '-'}</td>
                      <td>{peg.nama_lengkap}</td>
                      <td>{peg.username}</td>
                      <td>{peg.nama_jabatan || '-'}</td>
                      <td>{peg.nama_shift || '-'}</td>
                      <td>
                        <span className={`status-badge ${peg.status_aktif === 'Y' ? 'disetujui' : 'ditolak'}`}>
                          {peg.status_aktif === 'Y' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenModal(peg)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeletePegawai(peg.id_user, peg.nama_lengkap)}
                            title="Hapus"
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Belum ada data pegawai</p>
            )}
          </div>
        )}

        {activeTab === 'cuti' && (
          <div className="data-section">
            <h2>Pengajuan Cuti</h2>
            {cuti.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NIP</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Alasan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cuti.map((c) => (
                    <tr key={c.id_cuti}>
                      <td>{c.nama_lengkap}</td>
                      <td>{c.nip || '-'}</td>
                      <td>{formatDate(c.tgl_mulai)}</td>
                      <td>{formatDate(c.tgl_selesai)}</td>
                      <td>{c.alasan}</td>
                      <td>
                        <span className={`status-badge ${c.status_pengajuan.toLowerCase()}`}>
                          {c.status_pengajuan}
                        </span>
                      </td>
                      <td>
                        {c.status_pengajuan === 'Pending' && (
                          <div className="action-buttons">
                            <button 
                              className="btn-approve"
                              onClick={() => handleUpdateCuti(c.id_cuti, 'Disetujui')}
                              disabled={loading}
                            >
                              ✓
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => handleUpdateCuti(c.id_cuti, 'Ditolak')}
                              disabled={loading}
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Belum ada pengajuan cuti</p>
            )}
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Pegawai */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPegawai ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmitPegawai}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username untuk login"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {editingPegawai ? '(kosongkan jika tidak diubah)' : '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editingPegawai ? 'Kosongkan jika tidak diubah' : 'Password'}
                  required={!editingPegawai}
                />
              </div>
              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleInputChange}
                  placeholder="Nama lengkap pegawai"
                  required
                />
              </div>
              <div className="form-group">
                <label>NIP</label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleInputChange}
                  placeholder="Nomor Induk Pegawai"
                />
              </div>
              <div className="form-group">
                <label>Jabatan</label>
                <select
                  name="id_jabatan"
                  value={formData.id_jabatan}
                  onChange={handleInputChange}
                >
                  <option value="">-- Pilih Jabatan --</option>
                  {jabatan.map((j) => (
                    <option key={j.id_jabatan} value={j.id_jabatan}>
                      {j.nama_jabatan}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Jam Kerja / Shift</label>
                <select
                  name="id_jam"
                  value={formData.id_jam}
                  onChange={handleInputChange}
                >
                  <option value="">-- Pilih Shift --</option>
                  {jamKerja.map((j) => (
                    <option key={j.id_jam} value={j.id_jam}>
                      {j.nama_shift} ({j.jam_masuk} - {j.jam_pulang})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status_aktif"
                  value={formData.status_aktif}
                  onChange={handleInputChange}
                >
                  <option value="Y">Aktif</option>
                  <option value="N">Nonaktif</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Menyimpan...' : (editingPegawai ? 'Update' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Keterangan Presensi */}
      {showKeteranganModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Input Keterangan Ketidakhadiran</h2>
              <button className="btn-close" onClick={handleCloseKeteranganModal}>×</button>
            </div>
            <form onSubmit={handleSubmitKeterangan}>
              <div className="form-group">
                <label>Pilih Pegawai *</label>
                <select
                  name="id_user"
                  value={keteranganForm.id_user}
                  onChange={handleKeteranganInputChange}
                  required
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {pegawai.map((peg) => (
                    <option key={peg.id_user} value={peg.id_user}>
                      {peg.nama_lengkap} ({peg.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tanggal *</label>
                <input
                  type="date"
                  name="tanggal"
                  value={keteranganForm.tanggal}
                  onChange={handleKeteranganInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Keterangan *</label>
                <select
                  name="keterangan"
                  value={keteranganForm.keterangan}
                  onChange={handleKeteranganInputChange}
                  required
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>
              <div className="form-group">
                <label>Catatan / Alasan</label>
                <textarea
                  name="catatan"
                  value={keteranganForm.catatan}
                  onChange={handleKeteranganInputChange}
                  placeholder="Masukkan alasan atau catatan..."
                  rows="4"
                  style={{ width: '100%', padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseKeteranganModal}>
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ganti Password */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔒 Ganti Password</h2>
              <button className="btn-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitPassword}>
              <div className="form-group">
                <label>Password Lama *</label>
                <input
                  type="password"
                  name="password_lama"
                  value={passwordForm.password_lama}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan password lama"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password Baru *</label>
                <input
                  type="password"
                  name="password_baru"
                  value={passwordForm.password_baru}
                  onChange={handlePasswordChange}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
              <div className="form-group">
                <label>Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  name="konfirmasi_password"
                  value={passwordForm.konfirmasi_password}
                  onChange={handlePasswordChange}
                  placeholder="Ulangi password baru"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
